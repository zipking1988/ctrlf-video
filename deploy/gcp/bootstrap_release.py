"""One-time root installation on the existing native GCE host; no cloud provisioning."""

import json
import re
import subprocess
import sys
from pathlib import Path

from backend_release import Release, atomic_json

ROOT = Path("/opt/ctrlfvideo")
PYTHON = "/opt/ctrlfvideo/python/cpython-3.13.12-linux-x86_64-gnu/bin/python3.13"
BIN = Path("/usr/local/sbin/ctrlfvideo-release")
SYSTEMD = Path("/etc/systemd/system")


def command(*args):
    subprocess.run(args, check=True, capture_output=True, timeout=120)


def install(username):
    if not re.fullmatch(r"sa_[0-9]+", username):
        raise ValueError("Expected the deployment service account's OS Login username")
    (ROOT / "releases").mkdir(exist_ok=True, mode=0o755)
    (ROOT / "releases").chmod(0o755)
    if not (ROOT / "current").exists():
        (ROOT / "current").symlink_to(ROOT / "app")
    backups = Path("/var/backups/ctrlfvideo")
    backups.mkdir(exist_ok=True, mode=0o700)
    backups.chmod(0o700)
    config = {
        "root": str(ROOT),
        "backups": str(backups),
        "data": "/data",
        "environment": "/etc/ctrlfvideo/backend.env",
        "port": 8080,
        "maintenance": "/run/ctrlfvideo-release-maintenance",
        "disabled": "/etc/ctrlfvideo/deploy-disabled",
        "cutoff_epoch": 1792417500,  # October 19, 22:45 JST: recovery headroom.
        "max_releases": 24,  # Engineering loop backstop, not a GCP/billing quota.
        "user": "ctrlfvideo",
        "python": PYTHON,
        "uv": "/opt/ctrlfvideo/bootstrap/bin/uv",
    }
    atomic_json(Path("/etc/ctrlfvideo/release.json"), config)
    source = Path(__file__).with_name("backend_release.py").read_text()
    BIN.write_text(source.replace("#!/usr/bin/python3", f"#!{PYTHON}", 1))
    BIN.chmod(0o755)
    sudoers = Path("/etc/sudoers.d/ctrlfvideo-ci")
    temporary = sudoers.with_suffix(".tmp")
    temporary.write_text(f"{username} ALL=(root) NOPASSWD: {BIN} *\n")
    temporary.chmod(0o440)
    command("visudo", "-cf", str(temporary))
    temporary.replace(sudoers)

    release = Release(config)
    release.healthy(check_canary=False)
    release.state["canary"] = release.create_canary()
    release.save()
    unit = SYSTEMD / "ctrlfvideo-backend.service"
    old_unit = unit.read_bytes()
    nginx = Path("/etc/nginx/sites-enabled/ctrlfvideo")
    old_nginx = nginx.read_text()
    release.marker.touch(mode=0o600)
    release.service("stop")
    try:
        backup = release.backup("bootstrap")
        unit.write_text(f"""[Unit]
Description=CtrlF Video single durable backend
After=network-online.target ctrlfvideo-release-boot.service
Wants=ctrlfvideo-release-boot.service
RequiresMountsFor=/data
[Service]
Type=simple
User=ctrlfvideo
Group=ctrlfvideo
WorkingDirectory={ROOT}/current
EnvironmentFile=/etc/ctrlfvideo/backend.env
ExecStart={ROOT}/current/.venv/bin/python -m ctrlf_video.server
Restart=on-failure
RestartSec=5
UMask=0077
[Install]
WantedBy=multi-user.target
""")
        (SYSTEMD / "ctrlfvideo-release-boot.service").write_text(f"""[Unit]
Description=Recover interrupted CtrlF Video release before backend startup
Before=ctrlfvideo-backend.service
RequiresMountsFor=/data
[Service]
Type=oneshot
ExecStart={BIN} boot
RemainAfterExit=yes
""")
        (SYSTEMD / "ctrlfvideo-release-watchdog.service").write_text(f"""[Unit]
Description=Recover abandoned CtrlF Video release
[Service]
Type=oneshot
ExecStart={BIN} watchdog
""")
        (SYSTEMD / "ctrlfvideo-release-watchdog.timer").write_text("""[Unit]
Description=Check bounded CtrlF Video release recovery
[Timer]
OnBootSec=1min
OnUnitActiveSec=1min
AccuracySec=10s
[Install]
WantedBy=timers.target
""")
        if str(release.marker) not in old_nginx:
            nginx.write_text(
                old_nginx.replace(
                    "    location / {",
                    f"    if (-f {release.marker}) {{ return 503; }}\n    location / {{",
                    1,
                )
            )
        command("nginx", "-t")
        command("systemctl", "reload", "nginx")
        command("systemctl", "daemon-reload")
        release.service("start")
        release.healthy()
        release.state.update(phase="committed", backup=backup, expires=0)
        release.save()
        release.marker.unlink(missing_ok=True)
        command("systemctl", "enable", "--now", "ctrlfvideo-release-watchdog.timer")
        print(
            json.dumps(
                {
                    "installed": True,
                    "consistent_backup_restore_verified": True,
                    "canary_survived_restart": True,
                }
            )
        )
    except Exception:
        release.service("stop")
        unit.write_bytes(old_unit)
        nginx.write_text(old_nginx)
        command("systemctl", "daemon-reload")
        command("systemctl", "reload", "nginx")
        release.service("start")
        release.healthy()
        release.marker.unlink(missing_ok=True)
        raise


if __name__ == "__main__":
    install(sys.argv[1])
