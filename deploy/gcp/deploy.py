"""GitHub-hosted orchestration for the existing temporary GCP deployment."""

import hashlib
import json
import os
import re
import shlex
import signal
import subprocess
import tempfile
import time
import urllib.request
from pathlib import Path

PROJECT = "ctrlfvideo"
REGION = "asia-northeast1"
ZONE = "asia-northeast1-a"
INSTANCE = "ctrlfvideo-backend"
SERVICE = "ctrlfvideo-frontend"
ACCOUNT = "ctrlfvideo-deployer@ctrlfvideo.iam.gserviceaccount.com"
ORIGIN = "https://ctrlfvideo-frontend-655757141159.asia-northeast1.run.app"
PUBLIC_ORIGINS = {ORIGIN, "https://ctrlfvideo.com"}
CUTOFF = 1792414800  # October 19, 2026, 22:00 JST; leaves rollback/cleanup headroom.


def run(args):
    result = subprocess.run(args, capture_output=True, text=True, timeout=1000)
    if result.returncode:
        # gcloud may include private response/config values; CI gets a bounded diagnosis.
        markers = ("ERROR:", "Release failed:", "Permission denied (publickey)")
        diagnosis = next(
            (line for line in result.stderr.splitlines() if line.startswith(markers)), ""
        )
        raise RuntimeError(
            f"Command failed: {args[0]} (exit {result.returncode}). {diagnosis[:600]}"
        )
    return result.stdout


def cloud(*args):
    return run(
        [
            "gcloud",
            *args,
            f"--project={PROJECT}",
            f"--billing-project={PROJECT}",
            f"--account={ACCOUNT}",
            "--quiet",
        ]
    )


def remote(*args):
    managed = ["--managed"] if args[0] in {"deploy", "drill"} else []
    command = shlex.join(["sudo", "/usr/local/sbin/ctrlfvideo-release", *managed, *args])
    return json.loads(
        cloud(
            "compute",
            "ssh",
            INSTANCE,
            f"--zone={ZONE}",
            "--tunnel-through-iap",
            "--ssh-flag=-oServerAliveInterval=15",
            "--ssh-flag=-oServerAliveCountMax=8",
            f"--command={command}",
        )
    )


def frontend_traffic(revisions):
    return cloud(
        "run",
        "services",
        "update-traffic",
        SERVICE,
        f"--region={REGION}",
        "--to-revisions=" + ",".join(f"{k}={v}" for k, v in revisions.items()),
    )


def public_check(origin):
    if origin not in PUBLIC_ORIGINS:
        raise RuntimeError("Unapproved public deployment origin")
    for path in ("/", "/gateway/health", "/health", "/api/session"):
        with urllib.request.urlopen(origin + path, timeout=30) as response:
            body = response.read()
            if response.status != 200:
                raise RuntimeError("Public deployment check failed")
            if path == "/health" and json.loads(body)["mode"] != "fixture":
                raise RuntimeError("Unexpected model mode after release")


def release(image, *, drill=False):
    if time.time() >= CUTOFF:
        raise RuntimeError("Deployment window closed; cleanup must retain control")
    sha = os.environ["GITHUB_SHA"]
    run_id = os.environ["GITHUB_RUN_ID"]
    if not re.fullmatch(r"[0-9a-f]{40}", sha) or not run_id.isdecimal():
        raise RuntimeError("Invalid immutable workflow identity")
    if not re.fullmatch(
        r"asia-northeast1-docker\.pkg\.dev/ctrlfvideo/ctrlfvideo/frontend@sha256:[0-9a-f]{64}",
        image,
    ):
        raise RuntimeError("Frontend must use this project's immutable image digest")
    old = json.loads(
        cloud("run", "services", "describe", SERVICE, f"--region={REGION}", "--format=json")
    )
    public_origin = next(
        (
            item.get("value")
            for item in old["spec"]["template"]["spec"]["containers"][0].get("env", [])
            if item["name"] == "CTRLF_PUBLIC_ORIGIN"
        ),
        None,
    )
    if public_origin not in PUBLIC_ORIGINS:
        raise RuntimeError("Unapproved public deployment origin")
    traffic = {
        r["revisionName"]: r["percent"] for r in old["status"]["traffic"] if r.get("percent")
    }
    pending = False
    frontend_changed = False
    with tempfile.TemporaryDirectory() as directory:
        archive = Path(directory) / f"ctrlfvideo-{sha}-{run_id}.tgz"
        run(["git", "archive", "--format=tar.gz", f"--output={archive}", sha])
        archive.chmod(0o600)
        digest = hashlib.sha256(archive.read_bytes()).hexdigest()
        destination = f"/tmp/{archive.name}"
        cloud(
            "compute",
            "scp",
            str(archive),
            f"{INSTANCE}:{destination}",
            f"--zone={ZONE}",
            "--tunnel-through-iap",
        )
        try:
            if drill:
                result = remote("drill", sha, destination, digest)
                if result.get("phase") != "drill_passed":
                    raise RuntimeError("Rollback drill did not complete")
                public_check(public_origin)
                print(
                    "Rollback drill passed; previous code, owned data and verified backup retained."
                )
            result = remote("deploy", sha, destination, digest)
            if result.get("phase") != "pending":
                raise RuntimeError("Backend release did not reach the guarded pending phase")
            pending = True
            revision = f"{SERVICE}-ci-{sha[:8]}-{run_id}"
            cloud(
                "run",
                "deploy",
                SERVICE,
                f"--region={REGION}",
                f"--image={image}",
                "--no-traffic",
                f"--revision-suffix=ci-{sha[:8]}-{run_id}",
                "--min-instances=0",
                "--max-instances=1",
                "--max=1",
                "--cpu=1",
                "--memory=512Mi",
                "--concurrency=32",
                "--timeout=300",
            )
            candidate = json.loads(
                cloud(
                    "run", "revisions", "describe", revision, f"--region={REGION}", "--format=json"
                )
            )
            if not any(
                c.get("type") == "Ready" and c.get("status") == "True"
                for c in candidate["status"].get("conditions", [])
            ):
                raise RuntimeError("This release's frontend revision is not ready")
            frontend_changed = True  # Set before mutation: uncertain API outcomes also roll back.
            # With --no-traffic, the service's latestReadyRevisionName can retain
            # the previous serving revision. Promote this exact tested revision.
            frontend_traffic({revision: 100})
            serving = json.loads(
                cloud("run", "services", "describe", SERVICE, f"--region={REGION}", "--format=json")
            )
            actual = {
                r["revisionName"]: r["percent"]
                for r in serving["status"]["traffic"]
                if r.get("percent")
            }
            if actual != {revision: 100}:
                raise RuntimeError("Frontend traffic did not reach this release")
            remote("finalize", sha)
            public_check(public_origin)
            pending = False
            print("Both services deployed; session, fixture mode and persistence checks passed.")
        except Exception:
            failures = []
            if frontend_changed:
                try:
                    frontend_traffic(traffic)
                except Exception:
                    failures.append("frontend traffic")
            if pending:
                try:
                    remote("rollback", sha)
                except Exception:
                    failures.append("backend code")
            if failures:
                raise RuntimeError(
                    "Automatic recovery needs operator attention: " + ", ".join(failures)
                ) from None
            raise


if __name__ == "__main__":

    def interrupted(signum, frame):
        raise RuntimeError("Release interrupted; attempting recovery")

    signal.signal(signal.SIGTERM, interrupted)
    signal.signal(signal.SIGINT, interrupted)
    release(os.environ["FRONTEND_IMAGE"], drill=os.environ.get("ROLLBACK_DRILL") == "true")
