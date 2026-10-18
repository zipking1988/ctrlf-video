"""Offline state-coverage and conversation regressions, never live quality claims."""

import json

import httpx
import pytest
from test_agent import generation_response, handler, setup_real

from ctrlf_video.agent import AgentError, whole_video_windows


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture(autouse=True)
def mock_key(monkeypatch):
    monkeypatch.setenv("TEST_GEMINI_KEY", "test-secret")


@pytest.mark.parametrize(
    "question",
    [
        "How does the lead change?",
        "How did the displayed counter change?",
        "Did the score ever decrease?",
        "Were there any decreases?",
        "Show every score change, including reversals.",
        "What changes across the recording?",
        "Compare before and after states.",
        "How did the score change after the last basket?",
        "比分是怎么变化的？",
        "中间有没有回落？",
        "请检查全部计数器变化。",
    ],
)
def test_change_questions_require_complete_sampled_state_review(question):
    from ctrlf_video.agent import change_review_request

    assert change_review_request(question)


@pytest.mark.parametrize(
    "question",
    [
        "What does the scoreboard show?",
        "Who holds the ball?",
        "Where does the caption say How does the lead change?",
        "Why did you change your last answer?",
        "How does the score change in the first 10 seconds?",
        "How does it change between 10 and 20 seconds?",
        "What changes at 00:37?",
        "最后10秒比分如何变化？",
    ],
)
def test_point_questions_and_quoted_scope_do_not_enable_global_state_review(question):
    from ctrlf_video.agent import change_review_request

    assert not change_review_request(question)


def test_short_complete_reviews_use_smaller_overlapping_batches_with_same_hard_limits():
    windows = whole_video_windows(70.203467, focused=True)
    assert len(windows) == 3
    assert windows[0]["start"] == 0 and windows[-1]["end"] == 70.203467
    assert all(0 < w["end"] - w["start"] < 30 for w in windows)
    assert all(
        b["start"] == pytest.approx(a["end"] - 5)
        for a, b in zip(windows, windows[1:], strict=False)
    )
    assert whole_video_windows(300, focused=True) == whole_video_windows(300)
    with pytest.raises(AgentError, match="whole_video_review_limit"):
        whole_video_windows(350.01, focused=True)


@pytest.mark.parametrize(
    "question", ["Analyze the entire video.", "Review the full recording.", "请分析整段视频。"]
)
def test_natural_explicit_whole_video_prompts_do_not_depend_on_a_starter_button(question):
    from ctrlf_video.agent import whole_video_request

    assert whole_video_request(question)
    assert not whole_video_request("Where does the caption say " + question)


def samples():
    return [
        {"frame_id": f"actual-{i}", "t": t}
        for i, t in enumerate([24.024, 36.036, 37.037, 43.043, 59.059])
    ]


def test_state_readings_retain_reversals_and_intermediate_values_at_real_sample_times():
    from ctrlf_video.agent import checked_state_readings, state_synthesis

    source = {
        "readings": [
            {"sample": i, "value": value}
            for i, value in reversed(list(enumerate(["62", "62", "61", "64", "67"])))
        ],
        "unresolved": [],
    }
    original = json.dumps(source)
    items, warnings = checked_state_readings(source, samples())
    assert [i["statement"] for i in items] == ["62", "61", "64", "67"]
    assert items[0]["frame_ids"] == ["actual-0", "actual-1"]
    assert items[1]["frame_ids"] == ["actual-2"]
    assert json.dumps(source) == original and not warnings
    observations = [
        dict(item, evidence=[f for f in samples() if f["frame_id"] in item["frame_ids"]])
        for item in items
    ]
    result = state_synthesis(observations, "How does the lead change?")
    assert all(value in result["answer"] for value in ["62", "61", "64", "67"])
    assert "00:00:37.037" in result["answer"] and "00:00:43.043" in result["answer"]
    assert "increases throughout" not in result["answer"]
    assert result["unresolved"]  # Complete sample accounting still isn't continuous coverage.


def test_missing_unreadable_conflicting_samples_never_borrow_prior_values():
    from ctrlf_video.agent import checked_state_readings

    items, warnings = checked_state_readings(
        {
            "readings": [
                {"sample": 0, "value": "62"},
                {"sample": 1, "value": None},
                {"sample": 2, "value": "61"},
                {"sample": 2, "value": "62"},
                {"sample": 4, "value": "67"},
                {"sample": True, "value": "invented"},
                {"sample": 999, "value": "foreign"},
            ]
        },
        samples(),
    )
    assert [i["statement"] for i in items] == ["62", "67"]
    assert any("2/5" in w and "00:00:37.037" in w and "00:00:43.043" in w for w in warnings)
    assert any("invalid" in w.lower() for w in warnings)
    with pytest.raises(AgentError, match="invalid_state_readings"):
        checked_state_readings({"readings": [{"sample": False, "value": "foreign"}]}, samples())


def test_whole_review_preserves_valid_state_and_narrative_evidence_independently():
    from ctrlf_video.agent import checked_whole_observations

    items, warnings = checked_whole_observations(
        {
            "observations": [{"frame_ids": ["foreign"], "statement": "bad reference"}],
            "readings": [{"sample": 2, "value": "61"}],
        },
        samples(),
    )
    assert items == [{"frame_ids": ["actual-2"], "statement": "61", "state_reading": True}]
    assert any("Narrative review unavailable" in w for w in warnings)
    items, warnings = checked_whole_observations(
        {"observations": [{"frame_ids": ["actual-0"], "statement": "Original narrative"}]},
        samples(),
    )
    assert items[0]["statement"] == "Original narrative"
    assert any("Per-sample state audit unavailable" in w for w in warnings)


@pytest.mark.anyio
@pytest.mark.parametrize(
    "failure", [None, "missing", "whole", "unknown_cancel", "revoked", "money", "too_long"]
)
async def test_full_state_review_retains_changes_and_allows_three_contextual_turns(
    tmp_path, monkeypatch, failure
):
    import ctrlf_video.agent as module

    calls = []
    base = handler(calls)
    reviewed = []
    missing = None
    omit_current = False

    def respond(request):
        nonlocal missing
        payload = json.loads(request.content)
        if request.url.path.endswith(":generateContent"):
            parts = payload["contents"][0]["parts"]
            if any("inlineData" in p for p in parts) and not parts[0]["text"].startswith(
                "Describe"
            ):
                calls.append((str(request.url), payload))
                prompt = json.loads(parts[0]["text"])
                selected = [json.loads(p["text"]) for p in parts[1:] if "text" in p]
                assert "readings" in prompt["instruction"]
                assert "prior" in prompt["instruction"].lower()
                schema = payload["generationConfig"]["responseSchema"]
                assert "readings" in schema["required"] and "unresolved" in schema["required"]
                reviewed.append(prompt)
                if failure == "unknown_cancel" and len(reviewed) == 2:
                    raise httpx.ReadTimeout("mock unknown second-window outcome")
                readings = [
                    {"sample": f["sample"], "value": f"Visible counter {states[f['t']]}"}
                    for f in selected
                ]
                if (failure == "missing" or omit_current) and any(
                    f["t"] == 37.037 for f in selected
                ):
                    missing = next(f for f in selected if f["t"] == 37.037)
                    readings = [x for x in readings if x["sample"] != missing["sample"]]
                result = {"readings": readings, "unresolved": []}
                if "observations" in schema["required"]:
                    # Narrative noise must not displace intermediate state runs
                    # when the existing evidence cap requires a reduction.
                    result["observations"] = [
                        {"frame_ids": [selected[0]["frame_id"]], "statement": "Mock source action."}
                        for _ in range(100)
                    ]
                return generation_response(result)
            if (
                failure == "whole"
                and not any("inlineData" in p for p in parts)
                and "observations" in json.loads(parts[0]["text"])
            ):
                calls.append((str(request.url), payload))
                return generation_response(
                    {
                        "answer": "Mock overview omits intermediate values.",
                        "unresolved": [],
                        "followups": [],
                    }
                )
        return base(request)

    app, client, video, desk = await setup_real(
        tmp_path, monkeypatch, calls, response_handler=respond
    )
    owner = (await client.get("/api/session")).json()["owner_id"]
    ws = app.state.workspace
    metadata = json.loads(ws.owned("videos", video, owner)["metadata"])
    metadata["duration"] = 351 if failure == "too_long" else 70.203467
    with ws.db() as db:
        db.execute("UPDATE videos SET metadata=? WHERE id=?", (json.dumps(metadata), video))
    seed = next((tmp_path / video / "frames").glob("*.jpg")).read_bytes()
    # Synthetic transport readings at annotated timestamps; not a fresh model inference.
    states = {1.001: 56, 8.008: 59, 24.024: 62, 36.036: 62, 37.037: 61, 43.043: 64, 59.059: 67}
    decoded = []

    def decode(directory, video_id, meta, window, count, prefix):
        decoded.append(window)
        result = []
        for t in states:
            if window["start"] <= t < window["end"]:
                name = f"{prefix}_{len(result)}.jpg"
                (directory / "frames" / name).write_bytes(seed)
                result.append(
                    {
                        "frame_id": video_id + "_" + name[:-4],
                        "file": name,
                        "t": t,
                        "uri": f"/media/{video_id}/frames/{name}",
                    }
                )
        return result

    monkeypatch.setattr(module, "frames", decode)
    if failure == "revoked":
        app.state.agent.ledger.restrict(owner, "test_v1")
    if failure == "money":
        app.state.agent.ledger.restrict(owner, "test_v1", money_units=3)
    before = len(calls)
    body = {
        "investigation_id": desk["id"],
        "request_id": "change0",
        "generation": 0,
        "question": "Analyze the entire video."
        if failure == "whole"
        else "How does the lead change?",
    }
    try:
        result = await client.post("/api/chat", json=body)
        if failure in {"revoked", "money", "too_long"}:
            assert result.status_code != 200 and len(calls) == before and not decoded
            return
        if failure == "unknown_cancel":
            assert result.status_code == 409 and result.json()["state"] == "unknown"
            count = len(calls)
            result = await client.post(f"/api/investigations/{desk['id']}/requests/change0/cancel")
            assert len(calls) == count
            answer = result.json()["response"]
            assert answer["events"] and any("Unreviewed ranges" in w for w in answer["unresolved"])
            return
        assert result.status_code == 200, result.text
        response = result.json()
        answer = response["response"]
        assert answer["status"] == "partial" and answer["trace"]["visible"]["channels"] == []
        assert len(calls) - before == (4 if failure == "whole" else 3)
        assert len(decoded) == 3 and answer["trace"]["visible"]["segments_reviewed"] == 3
        assert "Visible counter 64" in answer["answer"]
        if failure == "missing":
            assert "Visible counter 61" not in answer["answer"]
            assert any("00:00:37.037" in w for w in answer["unresolved"])
            return
        assert "Visible counter 61" in answer["answer"]
        assert "00:00:37.037" in answer["answer"] and "00:00:43.043" in answer["answer"]
        if failure == "whole":
            assert "Mock overview" in answer["answer"]
            assert "Mock source action." in json.dumps(answer["events"])
            assert len(answer["events"]) <= 100
            assert any("retained 33" in w for w in answer["unresolved"])
        count = len(calls)
        assert (await client.post("/api/chat", json=body)).json() == response
        assert len(calls) == count
        # Three actual API follow-ups, each anchored to the preceding new result.
        for i, question in enumerate(
            ["Did the score ever decrease?", "Show every counter change.", "中间有没有回落？"], 1
        ):
            body = dict(
                body, request_id=f"change{i}", parent_request_id=f"change{i - 1}", question=question
            )
            result = await client.post("/api/chat", json=body)
            assert result.status_code == 200, result.text
            assert result.json()["usedContext"] is True
            assert "Visible counter 61" in result.json()["response"]["answer"]
            assert reviewed[-1]["context"]["question"] == (
                response["question"] if i == 1 else reviewed[-4]["question"]
            )
            assert "Visible counter 61" in json.dumps(reviewed[-1]["context"])
        assert len(calls) - before == (13 if failure == "whole" else 12)
        # A newly unreadable frame must not inherit a value from a valid parent.
        omit_current = True
        body = dict(
            body,
            request_id="change4",
            parent_request_id="change3",
            question="Show every counter change.",
        )
        result = await client.post("/api/chat", json=body)
        assert result.status_code == 200 and result.json()["usedContext"] is True
        assert "Visible counter 61" in json.dumps(reviewed[-1]["context"])
        assert "Visible counter 61" not in result.json()["response"]["answer"]
        assert any("00:00:37.037" in w for w in result.json()["response"]["unresolved"])
        assert len(calls) - before == (16 if failure == "whole" else 15)
    finally:
        await client.aclose()
