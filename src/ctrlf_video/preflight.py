"""Read-only prerequisites; never starts GPU resources or contacts a model."""

import json
import shutil
import sys

from ctrlf_video import __version__
from ctrlf_video.config import ConfigurationError, Settings, load_settings

MODEL_BLOCKERS = (
    "Live model IDs/revisions, credentials and input/output bounds need verification",
    "Finite numeric call/money/calibration budgets have not been confirmed",
    "Model request cost bounds and provider billing controls are unverified",
    "Google Cloud durable storage and Linux media isolation remain deployment prerequisites",
)


def report(settings: Settings, runtime=None) -> dict:
    if runtime is None:
        from ctrlf_video.agent import load_runtime

        runtime = load_runtime()
    tools = {name: shutil.which(name) is not None for name in ("ffmpeg", "ffprobe")}
    blockers = list(MODEL_BLOCKERS)
    if not all(tools.values()):
        blockers.append("ffmpeg and ffprobe are required for real media")
    return {
        "version": __version__,
        "mode": settings.mode,
        "provider": runtime.provider if runtime else "gemini",
        "python": sys.version.split()[0],
        "local_tools": tools,
        "configuration": settings.model_dump(),
        "fixture_contract_checks_ready": True,
        "real_ready": False,
        "blockers": blockers,
        "model_requests_sent": 0,
        "gpu_resources_started": 0,
        "implemented": [
            "schema",
            "configuration",
            "window planning",
            "local budget ledger",
            "fixture workspace",
            "durable investigations and source library",
            "owned private media and bounded macOS decode",
            "Gemini and ai& Gemma adapters through the same approved attempt ledger",
            "idempotent chat and budget admission",
        ],
        "pending": [
            "live model calibration and paid resource cutoff proof",
            "live multimodal quality evaluation",
            "hour-long performance and concurrent workload validation",
            "real eval",
        ],
    }


def main() -> None:
    from ctrlf_video.agent import AgentError, load_runtime

    try:
        settings = load_settings()
        runtime = load_runtime()
    except (ConfigurationError, AgentError) as exc:
        print(json.dumps({"code": "invalid_config", "message": str(exc)}))
        raise SystemExit(2) from None
    print(
        json.dumps(
            report(settings, runtime),
            ensure_ascii=False,
            indent=2,
        )
    )
    if settings.mode == "real":
        raise SystemExit(2)


if __name__ == "__main__":
    main()
