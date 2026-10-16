"""Release fault injection on private temporary copies; no cloud/model requests."""

import importlib.util
import json
import os
import sqlite3
import subprocess
import sys
import tarfile
import time
from pathlib import Path

import pytest

MODULE = Path(__file__).parents[1] / "deploy/gcp/backend_release.py"
spec = importlib.util.spec_from_file_location("backend_release", MODULE)
release_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release_module)


class LocalRelease(release_module.Release):
    """Exercise real backup/symlink/state logic; replace only OS service/processes."""

    fail_prepare = False
    fail_candidate = False
    expired_prior_canary = False

    def __init__(self, config):
        super().__init__(config)
        self.original = self.current.resolve()
        self.calls = []

    def command(self, args, *, cwd=None):
        self.calls.append(args)
        return ""

    def healthy(self, *, check_canary=True):
        if (
            check_canary
            and self.expired_prior_canary
            and (self.state.get("canary") or {}).get("expired")
        ):
            raise RuntimeError("Expired prior release canary")
        if self.fail_candidate and self.current.resolve() != self.original:
            raise RuntimeError("Injected candidate failure")

    def create_canary(self):
        return {"title": "fresh synthetic persistence canary"}

    def prepare(self, sha, archive, expected):
        if self.fail_prepare:
            raise RuntimeError("Injected preparation failure")
        target = self.releases / f"{sha}-{len(self.state['attempts'])}"
        target.mkdir()
        return target


@pytest.fixture
def release(tmp_path):
    root = tmp_path / "code"
    root.mkdir()
    (root / "old").mkdir()
    (root / "current").symlink_to(root / "old")
    (root / "releases").mkdir()
    data = tmp_path / "data"
    data.mkdir()
    for name in ("workspace.sqlite3", "attempts.sqlite3"):
        with sqlite3.connect(data / name) as connection:
            connection.execute("CREATE TABLE retained(value TEXT)")
            connection.execute("INSERT INTO retained VALUES('unknown attempt remains reserved')")
    (data / "original").write_bytes(b"authorized synthetic video sentinel")
    settings = tmp_path / "config"
    settings.mkdir()
    (settings / "backend.env").write_text("CTRLF_VIDEO_MODE=fixture\n")
    backups = tmp_path / "backups"
    backups.mkdir()
    return LocalRelease(
        {
            "root": str(root),
            "data": str(data),
            "backups": str(backups),
            "environment": str(settings / "backend.env"),
            "maintenance": str(tmp_path / "maintenance"),
            "disabled": str(settings / "deploy-disabled"),
            "cutoff_epoch": time.time() + 3600,
            "max_releases": 24,
        }
    )


def test_release_verifies_restored_backup_and_preserves_live_ledger_on_finalize(release):
    before = release_module.fingerprint(Path(release.config["data"]))
    result = release.deploy("a" * 40, Path("unused"), "unused")
    assert result["phase"] == "pending" and result["backup_verified"]
    assert release.marker.exists()
    verification = Path(release.state["backup"]).with_suffix(".verified.json")
    assert json.loads(verification.read_text())["restored_databases"] == 2
    release.finalize("a" * 40)
    assert not release.marker.exists()
    assert release.current.resolve() != release.original
    assert release_module.fingerprint(Path(release.config["data"])) == before


@pytest.mark.parametrize("drill", [False, True])
def test_candidate_health_failure_rolls_code_back_without_rewinding_financial_state(release, drill):
    before = release_module.fingerprint(Path(release.config["data"]))
    release.fail_candidate = True
    with pytest.raises(RuntimeError, match="candidate failure"):
        release.deploy("b" * 40, Path("unused"), "unused", drill=drill)
    assert release.current.resolve() == release.original
    assert not release.marker.exists()
    assert release.state["phase"] == "rolled_back"
    assert release_module.fingerprint(Path(release.config["data"])) == before


def test_intentional_drill_requires_actual_healthy_candidate_and_verified_backup(release):
    assert release.deploy("c" * 40, Path("unused"), "unused", drill=True)["phase"] == "drill_passed"
    assert release.current.resolve() == release.original
    release.fail_prepare = True
    with pytest.raises(RuntimeError, match="preparation failure"):
        release.deploy("d" * 40, Path("unused"), "unused", drill=True)
    assert release.state["backup"] is None


def test_expired_previous_canary_does_not_block_new_release(release):
    release.state.update(phase="committed", canary={"expired": True})
    release.expired_prior_canary = True
    assert release.deploy("e" * 40, Path("unused"), "unused")["phase"] == "pending"
    assert release.state["canary"] == {"title": "fresh synthetic persistence canary"}


def test_expired_prior_canary_cannot_break_preparation_failure_recovery(release):
    release.state.update(phase="committed", canary={"expired": True})
    release.expired_prior_canary = True
    release.fail_prepare = True
    with pytest.raises(RuntimeError, match="preparation failure"):
        release.deploy("e" * 40, Path("unused"), "unused")
    assert release.state["phase"] == "rolled_back"
    assert release.current.resolve() == release.original
    assert not release.marker.exists()


def test_successful_systemd_stop_post_does_not_corrupt_primary_json_output():
    result = subprocess.run(
        [sys.executable, str(MODULE), "failure"],
        capture_output=True,
        env={**os.environ, "SERVICE_RESULT": "success"},
    )
    assert result.returncode == 0
    assert result.stdout == b""


@pytest.mark.parametrize("mode", ["fixture", "real"])
def test_backend_health_uses_explicit_operator_mode_without_model_calls(release, mode):
    release.config["expected_mode"] = mode
    requested = []

    def request(path, **kwargs):
        requested.append(path)
        return {"mode": mode}, None

    release.request = request
    release_module.Release.healthy(release)
    assert requested == ["/health"]


def test_backend_health_rejects_mode_drift_and_invalid_configuration(release, monkeypatch):
    monkeypatch.setattr(release_module.time, "sleep", lambda seconds: None)
    release.request = lambda *args, **kwargs: ({"mode": "real"}, None)
    with pytest.raises(RuntimeError, match="health or persistence"):
        release_module.Release.healthy(release)
    release.config["expected_mode"] = "anything"
    with pytest.raises(RuntimeError, match="Unapproved"):
        release_module.Release.healthy(release)


@pytest.mark.parametrize("phase", ["preparing", "switching", "pending"])
def test_interrupted_release_boot_recovery_restores_previous_code_before_service_start(
    release, phase
):
    candidate = release.releases / "candidate"
    candidate.mkdir()
    release.switch(candidate)
    release.marker.touch()
    release.state.update(phase=phase, previous=str(release.original))
    release.save()
    restarted = LocalRelease(release.config)
    assert restarted.recover(boot=True)["phase"] == "rolled_back"
    assert restarted.current.resolve() == release.original
    assert not restarted.marker.exists()
    assert not restarted.calls  # Boot unit must not recursively start backend.


@pytest.mark.parametrize("phase", ["committed", "rolled_back"])
def test_terminal_state_crash_cannot_strand_maintenance(release, phase):
    release.state["phase"] = phase
    release.marker.touch()
    release.recover()
    assert not release.marker.exists()


@pytest.mark.parametrize("reason", ["cutoff", "limit", "shutdown", "pending"])
def test_budget_window_and_serial_release_guards_fail_before_work(release, reason):
    if reason == "cutoff":
        release.config["cutoff_epoch"] = time.time() - 1
    elif reason == "limit":
        release.state["attempts"] = [1] * release.config["max_releases"]
    elif reason == "shutdown":
        Path(release.config["disabled"]).touch()
    else:
        release.state["phase"] = "pending"
    with pytest.raises(RuntimeError):
        release.deploy("f" * 40, Path("unused"), "unused")
    assert not release.calls
    assert release.current.resolve() == release.original


def test_backup_corruption_is_rejected_before_code_switch(release, monkeypatch):
    monkeypatch.setattr(
        release_module,
        "verify_backup",
        lambda *args: (_ for _ in ()).throw(RuntimeError("corrupt backup")),
    )
    with pytest.raises(RuntimeError, match="corrupt backup"):
        release.deploy("f" * 40, Path("unused"), "unused")
    assert release.current.resolve() == release.original
    assert not release.marker.exists()


def test_frontend_failure_after_backend_finalize_can_still_roll_code_back(release):
    release.deploy("a" * 40, Path("unused"), "unused")
    release.finalize("a" * 40)
    assert release.rollback("a" * 40)["phase"] == "rolled_back"
    assert release.current.resolve() == release.original


def test_cleanup_marker_prevents_recovery_from_restarting_service(release):
    release.state.update(phase="pending", previous=str(release.original))
    Path(release.config["disabled"]).touch()
    assert release.recover()["phase"] == "deployment_disabled"
    assert not release.calls


def test_archive_symlinks_are_rejected(tmp_path):
    archive = tmp_path / "unsafe.tgz"
    with tarfile.open(archive, "w:gz") as bundle:
        entry = tarfile.TarInfo("source")
        entry.type = tarfile.SYMTYPE
        entry.linkname = "/etc/passwd"
        bundle.addfile(entry)
    with pytest.raises(RuntimeError, match="Unsafe archive"):
        release_module.unpack(archive, tmp_path / "restore")


@pytest.fixture
def orchestrator(monkeypatch):
    path = MODULE.with_name("deploy.py")
    spec = importlib.util.spec_from_file_location("cloud_deploy", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    monkeypatch.setenv("GITHUB_SHA", "a" * 40)
    monkeypatch.setenv("GITHUB_RUN_ID", "123")
    monkeypatch.setattr(module.time, "time", lambda: module.CUTOFF - 3600)
    actions = []
    traffic = [{"revisionName": "previous", "percent": 100}]

    def cloud(*args):
        actions.append(args)
        if args[:3] == ("run", "services", "describe"):
            return json.dumps(
                {
                    "spec": {
                        "template": {
                            "spec": {
                                "containers": [
                                    {
                                        "env": [
                                            {
                                                "name": "CTRLF_PUBLIC_ORIGIN",
                                                "value": "https://ctrlfvideo.com",
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    "status": {
                        "traffic": traffic,
                        # A no-traffic revision need not update this field.
                        "latestReadyRevisionName": "previous",
                    },
                }
            )
        if args[:3] == ("run", "revisions", "describe"):
            return json.dumps({"status": {"conditions": [{"type": "Ready", "status": "True"}]}})
        if args[:3] == ("run", "services", "update-traffic"):
            name = next(v for v in args if v.startswith("--to-revisions="))
            revision, percent = name.split("=", 1)[1].rsplit("=", 1)
            traffic[:] = [{"revisionName": revision, "percent": int(percent)}]
        return ""

    def remote(*args):
        actions.append(args)
        return {
            "phase": {
                "drill": "drill_passed",
                "deploy": "pending",
                "finalize": "committed",
                "rollback": "rolled_back",
            }[args[0]]
        }

    def run(args):
        output = next(v.split("=", 1)[1] for v in args if v.startswith("--output="))
        Path(output).write_bytes(b"synthetic source archive")
        return ""

    monkeypatch.setattr(module, "cloud", cloud)
    monkeypatch.setattr(module, "remote", remote)
    monkeypatch.setattr(module, "run", run)
    monkeypatch.setattr(
        module, "public_check", lambda origin: actions.append(("public_check", origin))
    )
    return module, actions


IMAGE = "asia-northeast1-docker.pkg.dev/ctrlfvideo/ctrlfvideo/frontend@sha256:" + "a" * 64
REVISION = "ctrlfvideo-frontend-ci-aaaaaaaa-123"


@pytest.mark.parametrize("mode", ["fixture", "real"])
def test_public_health_verifies_configured_mode_without_paid_operations(
    orchestrator, monkeypatch, mode
):
    module, _ = orchestrator
    # Restore the implementation replaced by the orchestration fixture.
    spec = importlib.util.spec_from_file_location(
        "public_mode_check", MODULE.with_name("deploy.py")
    )
    checker = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(checker)
    monkeypatch.setenv("CTRLF_EXPECTED_MODE", mode)
    paths = []

    class Response:
        status = 200

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def read(self):
            return json.dumps({"mode": mode}).encode()

    def urlopen(url, **kwargs):
        paths.append(url)
        return Response()

    monkeypatch.setattr(checker.urllib.request, "urlopen", urlopen)
    checker.public_check("https://ctrlfvideo.com")
    assert paths == [
        "https://ctrlfvideo.com" + path
        for path in ("/", "/gateway/health", "/health", "/api/session")
    ]
    monkeypatch.setenv("CTRLF_EXPECTED_MODE", "real" if mode == "fixture" else "fixture")
    with pytest.raises(RuntimeError, match="Unexpected model mode"):
        checker.public_check("https://ctrlfvideo.com")
    monkeypatch.setenv("CTRLF_EXPECTED_MODE", "unapproved")
    before = len(paths)
    with pytest.raises(RuntimeError, match="Unapproved public verification mode"):
        checker.public_check("https://ctrlfvideo.com")
    assert len(paths) == before


def test_both_components_publish_only_after_backend_verification(orchestrator):
    module, actions = orchestrator
    module.release(IMAGE, drill=True)
    names = [a[0] for a in actions]
    assert names.index("drill") < names.index("deploy") < names.index("finalize")
    assert not any(a[0] == "rollback" for a in actions)
    assert any(f"--to-revisions={REVISION}=100" in a for a in actions)
    assert ("public_check", "https://ctrlfvideo.com") in actions


@pytest.mark.parametrize("fault", ["frontend_release", "traffic_uncertain", "public_health"])
def test_frontend_failure_or_interruption_rolls_both_components_back(
    orchestrator, monkeypatch, fault
):
    module, actions = orchestrator
    original = module.cloud
    raised = False

    def cloud(*args):
        nonlocal raised
        fail = (fault == "frontend_release" and args[:2] == ("run", "deploy")) or (
            fault == "traffic_uncertain" and f"--to-revisions={REVISION}=100" in args
        )
        if fail and not raised:
            raised = True
            raise RuntimeError("Injected interruption or API failure")
        return original(*args)

    monkeypatch.setattr(module, "cloud", cloud)
    if fault == "public_health":
        monkeypatch.setattr(
            module,
            "public_check",
            lambda origin: (_ for _ in ()).throw(RuntimeError("Injected public failure")),
        )
    with pytest.raises(RuntimeError):
        module.release(IMAGE)
    assert ("rollback", "a" * 40) in actions
    if fault != "frontend_release":
        assert any("--to-revisions=previous=100" in a for a in actions)


@pytest.mark.parametrize("fault", ["not_ready", "traffic_stale"])
def test_frontend_revision_or_traffic_mismatch_prevents_finalize(orchestrator, monkeypatch, fault):
    module, actions = orchestrator
    original = module.cloud

    def cloud(*args):
        if fault == "not_ready" and args[:3] == ("run", "revisions", "describe"):
            return json.dumps({"status": {"conditions": [{"type": "Ready", "status": "False"}]}})
        if fault == "traffic_stale" and args[:3] == ("run", "services", "update-traffic"):
            return ""  # The API returned without changing serving traffic.
        return original(*args)

    monkeypatch.setattr(module, "cloud", cloud)
    with pytest.raises(RuntimeError, match="not ready|did not reach"):
        module.release(IMAGE)
    assert ("rollback", "a" * 40) in actions
    assert not any(a[0] == "finalize" for a in actions)


def test_deploy_cutoff_denies_cloud_activity(orchestrator, monkeypatch):
    module, actions = orchestrator
    monkeypatch.setattr(module.time, "time", lambda: module.CUTOFF)
    with pytest.raises(RuntimeError, match="window closed"):
        module.release(IMAGE)
    assert not actions


@pytest.mark.parametrize("origin", ["https://foreign.example", "http://ctrlfvideo.com", None])
def test_unknown_or_missing_public_origin_denies_release_before_remote_work(
    orchestrator, monkeypatch, origin
):
    module, actions = orchestrator
    original = module.cloud

    def cloud(*args):
        body = json.loads(original(*args))
        body["spec"]["template"]["spec"]["containers"][0]["env"][0]["value"] = origin
        return json.dumps(body)

    monkeypatch.setattr(module, "cloud", cloud)
    with pytest.raises(RuntimeError, match="Unapproved public"):
        module.release(IMAGE)
    assert len(actions) == 1  # Only service metadata; no build/source upload/backend work.
