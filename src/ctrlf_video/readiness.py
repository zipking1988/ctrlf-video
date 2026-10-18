"""Read-only local dispatch prerequisites. No endpoint calls or approval installation."""

import argparse
import json
import os
import shutil
import sqlite3
import time
from pathlib import Path

from ctrlf_video.agent import AgentError, load_runtime
from ctrlf_video.config import ConfigurationError, load_settings


def budget_ready(connection, owner, runtime):
    if not owner or not runtime:
        return False
    for scope in ("*", owner):
        row = connection.execute(
            "SELECT active,currency,call_cap,used_calls,money_cap,used_money "
            "FROM budgets WHERE scope=? AND version=?",
            (scope, runtime.budget_version),
        ).fetchone()
        if not row:
            return False
        active, currency, calls, used_calls, money, used_money = row
        if (
            not active
            or currency != runtime.currency_unit
            or calls <= used_calls
            or money <= used_money
        ):
            return False
    return True


def readiness_report(settings, runtime, approved=False):
    checks = []
    provider = runtime.provider if runtime else "gemini"

    def check(id, label, passed, detail):
        checks.append(
            {
                "id": id,
                "label": label,
                "state": "available" if passed else "blocked",
                "detail": detail,
            }
        )

    check(
        "mode",
        "Model analysis mode",
        settings.mode == "real",
        (
            "Fixture mode provides preset demos only. Model analysis requires "
            "local configuration; this page cannot approve spending."
        ),
    )
    check(
        "media_tools",
        "Local video tools",
        all(shutil.which(t) for t in ("ffmpeg", "ffprobe")),
        (
            "Upload preflight and evidence extraction require FFmpeg / ffprobe. "
            "Deployment isolation needs separate verification."
        ),
    )
    blockers = runtime.blockers() if runtime else ["model_endpoints_missing"]
    roles = []
    for role, label in (
        ("vision", "Visual review"),
        ("embed", "Vector retrieval"),
        ("rerank", "Candidate selection"),
        ("text", "Text synthesis"),
    ):
        endpoint = getattr(runtime, role, None) if runtime else None
        key_present = bool(endpoint and (not endpoint.key_env or os.environ.get(endpoint.key_env)))
        roles.append(
            {
                "role": role,
                "label": label,
                "optional": False,
                "configured": bool(endpoint),
                "key_present": key_present,
                "model": endpoint.model if endpoint else None,
                "revision": endpoint.revision if endpoint else None,
                "provider": runtime.role_provider(role) if runtime else None,
            }
        )
    required = all(r["configured"] and r["key_present"] for r in roles if not r["optional"])
    check(
        "models",
        "Model configuration and credentials",
        required,
        (
            "This check reads model configuration without connecting to models. "
            "Visual review only; no audio transcription."
        ),
    )
    check(
        "endpoints",
        "Endpoints and media boundaries",
        bool(runtime)
        and not any(
            b in blockers
            for b in (
                "model_revision_missing",
                "gemini_endpoint_not_allowed",
                "invalid_gemini_model",
                "google_media_not_enabled",
                "aiand_endpoint_not_allowed",
                "invalid_aiand_model",
                "aiand_media_not_enabled",
            )
        ),
        (
            "Locally decoded JPEG frames go to "
            + ("ai& Gemma" if provider == "aiand" else "Google Gemini")
            + " only when explicitly enabled "
            "in private configuration. Text and retrieval stages send no media. "
            "Audio transcription is not supported. "
            + ("Retrieval embeddings send text to Google Gemini." if provider == "aiand" else "")
            + (
                " Planning, selection and synthesis send text only to ai& Gemma."
                if provider == "gemini_aiand"
                else ""
            )
        ),
    )
    calibrated = bool(
        runtime
        and runtime.valid_until > time.time()
        and runtime.calibration_reference
        and runtime.resource_cutoff_reference
    )
    check(
        "calibration",
        "Cost calibration and resource cutoffs",
        calibrated,
        (
            "Checks calibration references and validity only; does not prove "
            "billing cutoffs or live acceptance."
        ),
    )
    check(
        "budget",
        "Session and deployment budgets",
        approved,
        (
            "Both scopes require valid, matching approvals from a trusted local "
            "operator. Analysis admission uses actual window counts and costs."
        ),
    )
    return {
        "mode": settings.mode,
        "provider": provider,
        "checks": checks,
        "models": roles,
        "runtime_blockers": blockers,
        "dispatch_prerequisites_met": not blockers
        and all(c["state"] == "available" for c in checks),
        "live_verified": False,
        "model_requests_sent_by_check": 0,
        "note": (
            "Local prerequisites only; not acceptance of model connectivity, "
            "quality, performance or deployment."
        ),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--owner", help="Existing local session owner ID; optional, not an approval"
    )
    parser.add_argument(
        "--data-dir", type=Path, default=Path(os.environ.get("CTRLF_DATA_DIR", ".ctrlf-video-data"))
    )
    args = parser.parse_args()
    try:
        settings, runtime = load_settings(), load_runtime()
        approved = False
        path = args.data_dir / "attempts.sqlite3"
        if path.is_file() and args.owner and runtime:
            connection = sqlite3.connect(path.resolve().as_uri() + "?mode=ro", uri=True)
            try:
                approved = budget_ready(connection, args.owner, runtime)
            finally:
                connection.close()
        report = readiness_report(settings, runtime, approved)
        print(json.dumps(report, ensure_ascii=False, indent=2))
        if not report["dispatch_prerequisites_met"]:
            raise SystemExit(2)
    except (AgentError, ConfigurationError, OSError, sqlite3.Error):
        parser.exit(2, "Local configuration or budget ledger unavailable; no model request sent.\n")


if __name__ == "__main__":
    main()
