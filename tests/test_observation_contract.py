"""Offline model-format regressions; transport mocks do not establish live quality."""

import json

import pytest

from ctrlf_video.agent import AgentError, checked_observations


def test_singular_frame_array_is_corrected_without_changing_references_or_claims():
    sampled = [{"frame_id": "actual-a"}, {"frame_id": "actual-b"}]
    source = {
        "observations": [
            {"frame_ids": ["actual-a"], "statement": "Original model claim A"},
            {"frame_id": ["actual-a", "actual-b"], "statement": "Original model claim B"},
        ],
        "unresolved": [],
    }
    original = json.dumps(source)
    items, warnings = checked_observations(source, sampled)
    assert [item["frame_ids"] for item in items] == [["actual-a"], ["actual-a", "actual-b"]]
    assert items[1]["statement"] == "Original model claim B"
    assert json.dumps(source) == original, "Never rewrite the archived model response"
    assert any("format correction" in warning for warning in warnings)


def test_bad_observation_does_not_discard_another_valid_observation():
    items, warnings = checked_observations(
        {
            "observations": [
                {"frame_ids": ["actual-a"], "statement": "Keep this original claim"},
                {"frame_ids": ["foreign-video"], "statement": "Cannot cite this"},
                {
                    "frame_ids": ["actual-a"],
                    "frame_id": ["foreign-video"],
                    "statement": "Conflicting references",
                },
            ]
        },
        [{"frame_id": "actual-a"}],
    )
    assert items == [{"frame_ids": ["actual-a"], "statement": "Keep this original claim"}]
    assert any("2 observations" in warning and "excluded" in warning for warning in warnings)


@pytest.mark.parametrize(
    "item",
    [
        {"frame_id": "actual-a", "statement": "Do not guess a string into a frame list"},
        {"frame_id": ["foreign-video"], "statement": "Do not allow unprovided frames"},
        {
            "frame_ids": [],
            "frame_id": ["actual-a"],
            "statement": "Do not override an invalid canonical field",
        },
        {"frame_ids": ["actual-a"], "statement": ""},
    ],
)
def test_format_correction_never_weakens_frame_or_statement_validation(item):
    with pytest.raises(AgentError, match="invalid_observations"):
        checked_observations({"observations": [item]}, [{"frame_id": "actual-a"}])


def test_contradictory_global_negative_is_still_rejected():
    with pytest.raises(AgentError, match="invalid_observations"):
        checked_observations(
            {
                "no_match": True,
                "observations": [
                    {"frame_id": ["actual-a"], "statement": "A visible model claim"},
                ],
            },
            [{"frame_id": "actual-a"}],
        )


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
@pytest.mark.parametrize("all_invalid", [False, True])
async def test_real_pipeline_keeps_valid_rows_and_never_replays_completed_calls(
    tmp_path, monkeypatch, all_invalid
):
    from test_agent import generation_response, handler, setup_real

    monkeypatch.setenv("TEST_GEMINI_KEY", "test-secret")
    calls = []
    default = handler(calls)

    def respond(request):
        payload = json.loads(request.content)
        if not request.url.path.endswith(":batchEmbedContents"):
            parts = payload["contents"][0]["parts"]
            if any("inlineData" in part for part in parts) and not parts[0]["text"].startswith(
                "Describe"
            ):
                calls.append((str(request.url), payload))
                frames = [json.loads(part["text"]) for part in parts[1:] if "text" in part]
                invalid = {
                    "frame_ids": ["not-a-supplied-frame"],
                    "statement": "Excluded model claim",
                }
                rows = (
                    [invalid]
                    if all_invalid
                    else [
                        {"frame_ids": [frames[0]["frame_id"]], "statement": "Original claim A"},
                        {"frame_id": [frames[-1]["frame_id"]], "statement": "Original claim B"},
                        invalid,
                    ]
                )
                return generation_response({"observations": rows, "unresolved": []})
        return default(request)

    app, client, video, desk = await setup_real(
        tmp_path, monkeypatch, calls, response_handler=respond
    )
    try:
        body = {
            "investigation_id": desk["id"],
            "request_id": f"format_{all_invalid}",
            "generation": 0,
            "question": "What is visible?",
        }
        result = await client.post("/api/chat", json=body)
        response = result.json()["response"]
        if all_invalid:
            assert result.status_code == 502
            assert response["status"] == "error"
            assert response["errors"][0]["code"] == "invalid_observations"
        else:
            assert result.status_code == 200, result.text
            assert response["status"] == "partial"
            assert len(response["events"]) == 2
            assert any("format correction" in text for text in response["unresolved"])
            assert any("excluded" in text for text in response["unresolved"])
            assert "not-a-supplied-frame" not in result.text
        count = len(calls)
        repeated = await client.post("/api/chat", json=body)
        assert repeated.json() == result.json()
        assert len(calls) == count, "A completed request must not cause a repeat model charge"
    finally:
        await client.aclose()
