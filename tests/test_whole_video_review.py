"""Adversarial offline regressions; mock frames are not live model evidence."""

import json

import httpx
import pytest
from test_agent import generation_response, handler, setup_real

from ctrlf_video.media import MediaError


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
@pytest.mark.parametrize("failure", ["decoder", "event_cap", "unknown_cancel"])
async def test_whole_review_retains_verified_evidence_across_windows(
    tmp_path, monkeypatch, failure
):
    import ctrlf_video.agent as module

    monkeypatch.setenv("TEST_GEMINI_KEY", "test-secret")
    calls = []
    default = handler(calls)
    review_calls = 0

    def respond(request):
        nonlocal review_calls
        payload = json.loads(request.content)
        if not request.url.path.endswith(":batchEmbedContents"):
            parts = payload["contents"][0]["parts"]
            text = parts[0]["text"]
            if any("inlineData" in p for p in parts) and not text.startswith("Describe"):
                review_calls += 1
                if failure == "unknown_cancel" and review_calls == 2:
                    calls.append((str(request.url), payload))
                    raise httpx.ReadTimeout("mock unknown second-window outcome")
            if failure in {"event_cap", "unknown_cancel"} and any("inlineData" in p for p in parts):
                if not text.startswith("Describe"):
                    calls.append((str(request.url), payload))
                    frame = next(json.loads(p["text"]) for p in parts[1:] if "text" in p)
                    return generation_response(
                        {
                            "observations": [
                                {"frame_ids": [frame["frame_id"]], "statement": f"Visible {i}"}
                                for i in range(60)
                            ],
                            "unresolved": ["Mock uncertainty from the verified window"],
                        }
                    )
        return default(request)

    app, client, video, desk = await setup_real(
        tmp_path, monkeypatch, calls, response_handler=respond
    )
    try:
        owner = (await client.get("/api/session")).json()["owner_id"]
        ws = app.state.workspace
        metadata = json.loads(ws.owned("videos", video, owner)["metadata"])
        metadata["duration"] = 300
        with ws.db() as connection:
            connection.execute(
                "UPDATE videos SET metadata=? WHERE id=?", (json.dumps(metadata), video)
            )
        seed = next((tmp_path / video / "frames").glob("*.jpg")).read_bytes()
        decoded = []

        def decode(directory, video_id, meta, window, count, prefix):
            decoded.append(window["start"])
            if failure == "decoder" and len(decoded) == 2:
                # frames() really raises MediaError, not AgentError.
                raise MediaError("media_timeout")
            name = prefix + "_001.jpg"
            (directory / "frames" / name).write_bytes(seed)
            return [
                {
                    "frame_id": video_id + "_" + prefix + "_001",
                    "file": name,
                    "t": window["start"],
                    "uri": f"/media/{video_id}/frames/{name}",
                }
            ]

        monkeypatch.setattr(module, "frames", decode)
        request_id = "whole_review_adversarial_" + failure
        result = await client.post(
            "/api/chat",
            json={
                "investigation_id": desk["id"],
                "request_id": request_id,
                "generation": 0,
                "question": "Break down the whole video.",
            },
        )
        if failure == "unknown_cancel":
            assert result.status_code == 409 and result.json()["state"] == "unknown"
            count = len(calls)
            result = await client.post(
                f"/api/investigations/{desk['id']}/requests/{request_id}/cancel"
            )
            assert len(calls) == count, "Cancellation must not repeat any model attempt"
        answer = result.json()["response"]
        assert result.status_code == 200, result.text
        assert answer["status"] == "partial"
        assert answer["events"], "Verified first-window evidence must survive later decode errors"
        if failure in {"decoder", "unknown_cancel"}:
            assert any("Unreviewed ranges" in text for text in answer["unresolved"])
            assert any("1 FPS" in text for text in answer["unresolved"])
            if failure == "unknown_cancel":
                assert "Mock uncertainty from the verified window" in answer["unresolved"]
                assert any("retained 33 of 60" in text for text in answer["unresolved"])
        else:
            assert answer["trace"]["visible"]["segments_reviewed"] == 3
            cited = {frame["t"] for event in answer["events"] for frame in event["evidence"]}
            assert {0, 115, 230} <= cited, "Every reviewed window must retain replayable evidence"
            assert len(answer["events"]) <= 100
            assert any(
                "observations" in text.lower()
                and any(word in text.lower() for word in ("retain", "limit", "omit", "cap"))
                for text in answer["unresolved"]
            ), "The reduction of verified observations must be disclosed"
    finally:
        await client.aclose()
