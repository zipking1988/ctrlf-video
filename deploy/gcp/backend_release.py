#!/usr/bin/python3
"""Single-writer native releases. Installed root-owned; never restores live data.

Configuration and backups stay on the VM, outside the checkout and CI logs.
The systemd release unit calls recover after interruption or timeout.
"""

import argparse
import fcntl
import hashlib
import http.client
import json
import os
import re
import shlex
import shutil
import sqlite3
import subprocess
import sys
import tarfile
import tempfile
import time
from pathlib import Path
from urllib.parse import urlparse

CONFIG = Path("/etc/ctrlfvideo/release.json")
SHA = re.compile(r"[0-9a-f]{40}")


def atomic_json(path, value):
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(value, sort_keys=True) + "\n")
    temporary.chmod(0o600)
    with temporary.open("rb") as stream:
        os.fsync(stream.fileno())
    temporary.replace(path)
    descriptor = os.open(path.parent, os.O_DIRECTORY)
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def fingerprint(root):
    result = {}
    for path in sorted(root.rglob("*")):
        if path.is_symlink():
            raise RuntimeError("Backup tree contains a symlink")
        if path.is_file():
            with path.open("rb") as stream:
                result[str(path.relative_to(root))] = hashlib.file_digest(
                    stream, "sha256"
                ).hexdigest()
    return result


def unpack(archive, destination):
    with tarfile.open(archive, "r:gz") as bundle:
        for member in bundle.getmembers():
            path = Path(member.name)
            if path.is_absolute() or ".." in path.parts or not (member.isfile() or member.isdir()):
                raise RuntimeError("Unsafe archive entry")
        bundle.extractall(destination, filter="data")


def verify_backup(archive, expected, scratch):
    """Restore to an isolated copy and verify every file plus both SQLite stores."""
    with tempfile.TemporaryDirectory(dir=scratch) as directory:
        restored = Path(directory)
        unpack(archive, restored)
        if fingerprint(restored) != expected:
            raise RuntimeError("Backup file checksum mismatch")
        databases = sorted((restored / "data").glob("*.sqlite3"))
        if {p.name for p in databases} != {"workspace.sqlite3", "attempts.sqlite3"}:
            raise RuntimeError("Backup must include workspace and financial ledger")
        for database in databases:
            with sqlite3.connect(f"file:{database}?mode=ro", uri=True) as connection:
                if connection.execute("PRAGMA integrity_check").fetchall() != [("ok",)]:
                    raise RuntimeError("Restored database failed integrity check")
        if not (restored / "config" / "backend.env").is_file():
            raise RuntimeError("Backup omitted runtime configuration")
    with archive.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


class Release:
    def __init__(self, config):
        self.config = config
        self.root = Path(config["root"])
        self.current = self.root / "current"
        self.releases = self.root / "releases"
        self.backups = Path(config["backups"])
        self.state_file = self.root / "release-state.json"
        self.marker = Path(config["maintenance"])
        self.state = json.loads(self.state_file.read_text()) if self.state_file.exists() else {}

    def command(self, args, *, cwd=None):
        # Capture output: private runtime values and SQLite rows never enter CI logs.
        result = subprocess.run(args, cwd=cwd, capture_output=True, timeout=600)
        if result.returncode:
            log = self.root / "release-errors.log"
            with log.open("ab") as stream:
                log.chmod(0o600)
                stream.write(result.stdout + result.stderr + b"\n")
            raise RuntimeError(f"Release command failed: {Path(args[0]).name}")
        return result.stdout.decode()

    def save(self):
        atomic_json(self.state_file, self.state)

    def guard(self):
        self.check_window()
        if len(self.state.get("attempts", [])) >= self.config["max_releases"]:
            raise RuntimeError("Finite release-attempt allowance exhausted")
        if self.state.get("phase") in {"preparing", "switching", "pending"}:
            raise RuntimeError("Previous release requires finalize or rollback")

    def check_window(self):
        if Path(self.config["disabled"]).exists() or time.time() >= self.config["cutoff_epoch"]:
            raise RuntimeError("Temporary deployment window has closed")

    def request(self, path, *, method="GET", body=None, cookie=None, csrf=None):
        values = {}
        for line in Path(self.config["environment"]).read_text().splitlines():
            if line.strip() and not line.startswith("#"):
                key, value = line.split("=", 1)
                values[key] = " ".join(shlex.split(value))
        headers = {
            "Host": urlparse(values["CTRLF_PUBLIC_ORIGIN"]).netloc,
            "x-ctrlf-gateway-token": values["CTRLF_GATEWAY_TOKEN"],
        }
        if cookie:
            headers["Cookie"] = cookie
        if csrf:
            headers.update({"X-CTRLF-CSRF": csrf, "Origin": values["CTRLF_PUBLIC_ORIGIN"]})
        if body is not None:
            headers["Content-Type"] = "application/json"
            body = json.dumps(body)
        connection = http.client.HTTPConnection("127.0.0.1", self.config["port"], timeout=5)
        try:
            connection.request(method, path, body=body, headers=headers)
            response = connection.getresponse()
            payload = json.loads(response.read())
            if response.status >= 400:
                raise RuntimeError("Backend verification request rejected")
            return payload, response.getheader("Set-Cookie")
        finally:
            connection.close()

    def healthy(self, *, check_canary=True):
        expected_mode = self.config.get("expected_mode", "fixture")
        if expected_mode not in {"fixture", "real"}:
            raise RuntimeError("Unapproved backend verification mode")
        for _ in range(30):
            try:
                health, _ = self.request("/health")
                if health["mode"] != expected_mode:
                    raise RuntimeError("Backend model mode differs from operator configuration")
                canary = self.state.get("canary")
                if canary and check_canary:
                    desk, _ = self.request(canary["path"], cookie=canary["cookie"])
                    if desk["title"] != canary["title"]:
                        raise RuntimeError("Owned investigation did not survive release")
                return
            except (OSError, ValueError, KeyError, RuntimeError):
                time.sleep(1)
        raise RuntimeError("Backend health or persistence verification failed")

    def create_canary(self):
        session, cookie = self.request("/api/session")
        desk, _ = self.request(
            "/api/investigations",
            method="POST",
            body={"title": "CI persistence check"},
            cookie=cookie.split(";", 1)[0],
            csrf=session["csrf"],
        )
        return {
            "path": f"/api/investigations/{desk['id']}",
            "cookie": cookie.split(";", 1)[0],
            "title": desk["title"],
        }

    def prepare(self, sha, archive, expected):
        if not SHA.fullmatch(sha) or not re.fullmatch(r"[0-9a-f]{64}", expected):
            raise RuntimeError("Invalid immutable release identifier")
        with archive.open("rb") as stream:
            if hashlib.file_digest(stream, "sha256").hexdigest() != expected:
                raise RuntimeError("Transferred source checksum mismatch")
        target = self.releases / f"{sha}-{len(self.state['attempts'])}"
        if target.exists():
            raise RuntimeError("Release directory already exists; never reuse ambiguous work")
        target.mkdir(mode=0o755)
        target.chmod(0o755)  # Operator umask is 077; the service must traverse code.
        unpack(archive, target)
        # Automatic deployment must not introduce database/ledger/schema migration.
        for name in ("workspace.py", "attempts.py", "schema.py", "api.py", "routes.py"):
            path = Path("src/ctrlf_video") / name
            if (target / path).read_bytes() != (self.current / path).read_bytes():
                raise RuntimeError("Persistence contract changed; reviewed migration required")
        uv = self.config["uv"]
        self.command(
            [uv, "sync", "--frozen", "--no-editable", "--python", self.config["python"]], cwd=target
        )
        self.command(["chmod", "-R", "a+rX", str(target)])
        self.command(
            [
                "runuser",
                "-u",
                self.config["user"],
                "--",
                str(target / ".venv/bin/python"),
                "-m",
                "pytest",
                "-q",
                "-p",
                "no:cacheprovider",
            ],
            cwd=target,
        )
        return target

    def backup(self, sha):
        data = Path(self.config["data"])
        settings = Path(self.config["environment"]).parent
        # Three copies' headroom covers the archive and its isolated restore check.
        total = sum(
            p.stat().st_size for root in (data, settings) for p in root.rglob("*") if p.is_file()
        )
        if shutil.disk_usage(self.backups).free < total * 3 + 512 * 1024**2:
            raise RuntimeError("Insufficient backup/restore headroom")
        expected = {f"data/{k}": v for k, v in fingerprint(data).items()}
        expected.update({f"config/{k}": v for k, v in fingerprint(settings).items()})
        archive = self.backups / f"{sha}-{int(time.time())}.tgz"
        with tarfile.open(archive, "w:gz") as bundle:
            bundle.add(data, arcname="data")
            bundle.add(settings, arcname="config")
        archive.chmod(0o600)
        digest = verify_backup(archive, expected, self.backups)
        atomic_json(
            archive.with_suffix(".verified.json"),
            {"sha256": digest, "files": expected, "restored_databases": 2},
        )
        return str(archive)

    def switch(self, target):
        temporary = self.root / "next"
        temporary.unlink(missing_ok=True)
        temporary.symlink_to(target)
        temporary.replace(self.current)

    def service(self, action):
        self.command(["systemctl", action, "ctrlfvideo-backend.service"])

    def deploy(self, sha, archive, expected, *, drill=False):
        self.guard()
        self.healthy(check_canary=False)
        self.state.update(
            phase="preparing",
            previous=str(self.current.resolve()),
            sha=sha,
            expires=time.time() + 900,
            backup=None,
            canary=None,
        )
        self.state.setdefault("attempts", []).append({"sha": sha, "time": int(time.time())})
        self.save()
        drill_reached = False
        try:
            target = self.prepare(sha, archive, expected)
            self.check_window()
            self.state["canary"] = self.create_canary()
            self.save()
            self.marker.touch(mode=0o600)
            self.service("stop")
            self.state["backup"] = self.backup(sha)
            self.check_window()
            self.state["phase"] = "switching"
            self.save()
            self.switch(target)
            self.service("start")
            self.healthy()
            if drill:
                drill_reached = True
                raise RuntimeError("Intentional rollback drill after candidate health")
            self.state["phase"] = "pending"
            self.state["expires"] = time.time() + 600
            self.save()
            # Keep maintenance until frontend and external health checks succeed.
            return {"phase": "pending", "backup_verified": True, "sha": sha}
        except Exception:
            self.recover()
            if drill_reached and self.state.get("phase") == "rolled_back":
                return {"phase": "drill_passed", "backup_verified": True, "sha": sha}
            raise

    def recover(self, *, boot=False):
        if Path(self.config["disabled"]).exists():
            return {"phase": "deployment_disabled"}
        if self.state.get("phase") not in {"preparing", "switching", "pending"}:
            # Crash after a terminal state write but before maintenance removal.
            if self.marker.exists():
                if not boot:
                    self.healthy(check_canary=False)
                self.marker.unlink()
            return {"phase": self.state.get("phase", "idle")}
        self.marker.touch(mode=0o600)
        if not boot:
            self.service("stop")
        self.switch(Path(self.state["previous"]))
        if not boot:
            self.service("start")
            self.healthy()
        self.state["phase"] = "rolled_back"
        self.save()
        self.marker.unlink(missing_ok=True)
        return {"phase": "rolled_back", "live_data_restored": False}

    def finalize(self, sha):
        self.check_window()
        if self.state.get("phase") != "pending" or self.state.get("sha") != sha:
            raise RuntimeError("No matching pending release")
        self.healthy()
        self.state["phase"] = "committed"
        self.save()
        self.marker.unlink(missing_ok=True)
        return {"phase": "committed", "sha": sha, "backup_verified": True}

    def rollback(self, sha):
        self.check_window()
        if self.state.get("sha") != sha or self.state.get("phase") not in {"committed", "pending"}:
            raise RuntimeError("No matching release to roll back")
        self.state["phase"] = "pending"
        self.save()
        return self.recover()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "action",
        choices=(
            "deploy",
            "drill",
            "recover",
            "boot",
            "finalize",
            "rollback",
            "watchdog",
            "failure",
        ),
    )
    parser.add_argument("--managed", action="store_true")
    parser.add_argument("sha", nargs="?")
    parser.add_argument("archive", nargs="?")
    parser.add_argument("checksum", nargs="?")
    args = parser.parse_args()
    os.umask(0o077)
    if args.action == "failure" and os.environ.get("SERVICE_RESULT") == "success":
        return  # ExecStopPost shares stdout with the primary managed action.
    if args.managed:
        if args.action not in {"deploy", "drill"}:
            raise RuntimeError("Only releases run as managed units")
        # The unit survives SSH/runner loss and recovers immediately on failure.
        result = subprocess.run(
            [
                "systemd-run",
                "--quiet",
                "--wait",
                "--pipe",
                "--collect",
                "--unit=ctrlfvideo-release",
                "--property=Type=oneshot",
                "--property=TimeoutStartSec=900",
                "--property=ExecStopPost=/usr/local/sbin/ctrlfvideo-release failure",
                sys.executable,
                "/usr/local/sbin/ctrlfvideo-release",
                args.action,
                args.sha or "",
                args.archive or "",
                args.checksum or "",
            ],
            check=False,
        )
        raise SystemExit(result.returncode)
    with Path("/run/lock/ctrlfvideo-release.lock").open("w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        release = Release(json.loads(CONFIG.read_text()))
        if args.action in {"deploy", "drill"}:
            result = release.deploy(
                args.sha or "",
                Path(args.archive or ""),
                args.checksum or "",
                drill=args.action == "drill",
            )
        elif args.action == "finalize":
            result = release.finalize(args.sha)
        elif args.action == "rollback":
            result = release.rollback(args.sha)
        elif args.action == "watchdog":
            terminal = release.state.get("phase") not in {"preparing", "switching", "pending"}
            result = (
                release.recover()
                if terminal or time.time() > release.state.get("expires", float("inf"))
                else {}
            )
        elif args.action == "failure":
            result = release.recover() if os.environ.get("SERVICE_RESULT") != "success" else {}
        else:
            result = release.recover(boot=args.action == "boot")
        if args.action != "failure":
            print(json.dumps(result))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        # Avoid dumping private HTTP responses, credentials or database contents.
        raise SystemExit(f"Release failed: {type(error).__name__}") from None
