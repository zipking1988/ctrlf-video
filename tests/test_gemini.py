"""Gemini transport contracts with actual local decoding; no live calls or cloud resources."""

import json
import time
from pathlib import Path

import httpx
import pytest
from pydantic import ValidationError
from test_agent import approve, setup_real

from ctrlf_video.agent import AgentError, Endpoint, Provider, Runtime, load_runtime
from ctrlf_video.attempts import ApprovedBudget, AttemptLedger, BudgetDenied
from ctrlf_video.config import Settings
from ctrlf_video.gemini import BASE_URL, normalize_response, prepare_request
from ctrlf_video.readiness import readiness_report
from ctrlf_video.schema import Answer


@pytest.fixture
def anyio_backend():
    return "asyncio"


def configuration():
    def endpoint(model):
        return Endpoint(
            base_url=BASE_URL,
            model=model,
            revision="MOCK-NOT-LIVE",
            key_env="TEST_GEMINI_KEY",
            max_cost_micro=1,
        )

    return Runtime(
        provider="gemini",
        allow_google_media=True,
        vision=endpoint("gemini-test"),
        text=endpoint("gemini-test"),
        rerank=endpoint("gemini-test"),
        embed=endpoint("gemini-embedding-test"),
        budget_version="test_v1",
        calibration_reference="MOCK ONLY",
        resource_cutoff_reference="MOCK ONLY",
        valid_until=time.time() + 3600,
        attempt_seconds=2,
    )


def response(result, finish="STOP"):
    return httpx.Response(
        200,
        json={
            "candidates": [
                {
                    "finishReason": finish,
                    "content": {
                        "parts": [
                            {"text": "untrusted internal thought", "thought": True},
                            {"text": json.dumps(result, ensure_ascii=False)},
                        ]
                    },
                }
            ]
        },
    )


def handler(calls, *, fake_frame=False):
    def respond(request):
        payload = json.loads(request.content)
        calls.append((request, payload))
        assert request.url.host == "generativelanguage.googleapis.com"
        assert request.headers["x-goog-api-key"] == "test-secret"
        assert "authorization" not in request.headers and "key" not in request.url.params
        if request.url.path.endswith(":batchEmbedContents"):
            return httpx.Response(
                200, json={"embeddings": [{"values": [1.0, 0.0]} for _ in payload["requests"]]}
            )
        assert request.url.path.endswith(":generateContent")
        assert payload["generationConfig"]["responseMimeType"] == "application/json"
        parts = payload["contents"][0]["parts"]
        prompt = parts[0]["text"]
        if any("inlineData" in p for p in parts):
            ids = [json.loads(p["text"])["frame_id"] for p in parts[1:] if "text" in p]
            if prompt.startswith("Describe"):
                return response(
                    {"frames": [{"frame_id": f, "caption": "纸箱在工作台上"} for f in ids]}
                )
            return response(
                {
                    "observations": [
                        {
                            "frame_ids": ["invented-frame" if fake_frame else ids[0]],
                            "statement": "纸箱出现在工作台上。",
                        }
                    ],
                    "unresolved": [],
                }
            )
        prompt = json.loads(prompt)
        if "documents" in prompt:
            return response({"results": [{"index": i} for i in range(len(prompt["documents"]))]})
        if "candidates" in prompt:
            return response({"inspect": list(range(min(3, len(prompt["candidates"]))))})
        return response(
            {"answer": "可以在引用画面中看到纸箱。", "followups": ["之后呢？"], "unresolved": []}
        )

    return respond


@pytest.mark.anyio
@pytest.mark.parametrize("visible_match", [True, False])
@pytest.mark.parametrize("planner_answers_question", [False, True])
async def test_empty_relevance_selection_still_requires_bounded_visual_verification(
    tmp_path, monkeypatch, visible_match, planner_answers_question
):
    monkeypatch.setenv("TEST_GEMINI_KEY", "test-secret")
    calls, plans = [], []
    normal = handler(calls)

    def respond(request):
        payload = json.loads(request.content)
        if request.url.path.endswith(":generateContent"):
            parts = payload["contents"][0]["parts"]
            prompt = parts[0]["text"]
            if not any("inlineData" in p for p in parts):
                prompt = json.loads(prompt)
                if "documents" in prompt:
                    calls.append((request, payload))
                    return response({"results": []})
                if "candidates" in prompt:
                    calls.append((request, payload))
                    plans.append(prompt)
                    schema = payload["generationConfig"].get("responseSchema")
                    if planner_answers_question and schema is None:
                        # The second live failure answered the question instead
                        # of choosing review windows when no schema was supplied.
                        return response(
                            {"team_names": ["Milwaukee", "Atlanta"], "scores": ["51", "56"]}
                        )
                    if planner_answers_question:
                        assert schema["required"] == ["inspect"]
                        assert schema["properties"]["inspect"]["items"]["type"] == "INTEGER"
                    # Reproduce the valid plan returned by the live NBA query.
                    return response({"inspect": [0]})
            elif not visible_match and not prompt.startswith("Describe"):
                calls.append((request, payload))
                return response({"observations": [], "unresolved": [], "no_match": True})
        return normal(request)

    app, client, video, desk = await setup_real(
        tmp_path,
        monkeypatch,
        calls,
        runtime_factory=configuration,
        response_handler=respond,
    )
    try:
        body = {
            "investigation_id": desk["id"],
            "request_id": "req_empty_relevance",
            "generation": 0,
            "question": "Find the visible object and cite a source frame.",
        }
        result = await client.post("/api/chat", json=body)
        assert result.status_code == 200, result.text
        answer = Answer.model_validate(result.json()["response"])
        assert answer.status == ("ok" if visible_match else "no_result")
        assert plans and 1 <= len(plans[0]["candidates"]) <= app.state.agent.settings.rerank_k
        with app.state.agent.ledger._connect() as conn:
            attempts = conn.execute("SELECT kind,state FROM attempts").fetchall()
        assert sum(r["kind"] == "zoom" for r in attempts) == 1
        assert len(attempts) == len(calls)
        assert all(r["state"] == "completed" for r in attempts)
        for event in answer.events:
            assert event.video_id == video
            for frame in event.evidence:
                assert (await client.get(frame.uri)).status_code == 200
        before = len(calls)
        assert (await client.post("/api/chat", json=body)).json() == result.json()
        assert len(calls) == before
    finally:
        await client.aclose()


@pytest.mark.anyio
async def test_synthesis_receives_decoded_frame_times_instead_of_only_review_window_bounds(
    tmp_path, monkeypatch
):
    monkeypatch.setenv("TEST_GEMINI_KEY", "test-secret")
    calls, cited, summaries = [], [], []
    normal = handler(calls)

    def respond(request):
        payload = json.loads(request.content)
        if request.url.path.endswith(":generateContent"):
            parts = payload["contents"][0]["parts"]
            text = parts[0]["text"]
            if any("inlineData" in part for part in parts) and not text.startswith("Describe"):
                frame = [json.loads(p["text"]) for p in parts[1:] if "text" in p][2]
                cited.append(frame)
                calls.append((request, payload))
                return response(
                    {
                        "observations": [
                            {"frame_ids": [frame["frame_id"]], "statement": "A box is visible."}
                        ],
                        "unresolved": [],
                    }
                )
            if not any("inlineData" in part for part in parts):
                prompt = json.loads(text)
                if "observations" in prompt:
                    calls.append((request, payload))
                    summaries.append(prompt)
                    evidence = prompt["observations"][0].get("evidence", [])
                    timestamp = evidence[0]["t"] if evidence else prompt["observations"][0]["start"]
                    return response(
                        {
                            "answer": f"A box is visible at {timestamp} seconds.",
                            "followups": [],
                            "unresolved": [],
                        }
                    )
        return normal(request)

    app, client, video, desk = await setup_real(
        tmp_path, monkeypatch, calls, runtime_factory=configuration, response_handler=respond
    )
    try:
        result = await client.post(
            "/api/chat",
            json={
                "investigation_id": desk["id"],
                "request_id": "req_exact_frame_times",
                "generation": 0,
                "question": "When is the box visible?",
            },
        )
        assert result.status_code == 200, result.text
        answer = Answer.model_validate(result.json()["response"])
        frame = answer.events[0].evidence[0]
        assert frame.t > answer.events[0].start
        assert frame.t == cited[0]["t"]
        assert f"at {frame.t} seconds" in answer.answer
        evidence = summaries[0]["observations"][0]["evidence"]
        assert evidence == [{"frame_id": frame.frame_id, "t": frame.t, "t_hms": frame.t_hms}]
        assert (await client.get(frame.uri)).status_code == 200
    finally:
        await client.aclose()


@pytest.mark.anyio
async def test_gemini_upload_index_followup_evidence_ownership_and_idempotency(
    tmp_path, monkeypatch
):
    monkeypatch.setenv("TEST_GEMINI_KEY", "test-secret")
    calls = []
    app, client, video, desk = await setup_real(
        tmp_path,
        monkeypatch,
        calls,
        runtime_factory=configuration,
        response_handler=handler(calls),
    )
    try:
        assert (await client.get("/api/session")).json()["provider"] == "gemini"
        status = (await client.get("/api/runtime/status")).json()
        assert status["provider"] == "gemini" and not status["live_verified"]
        assert "test-secret" not in json.dumps(status)
        body = {
            "investigation_id": desk["id"],
            "request_id": "req_gemini_first",
            "generation": 0,
            "question": "纸箱在哪？",
        }
        result = await client.post("/api/chat", json=body)
        assert result.status_code == 200, result.text
        answer = Answer.model_validate(result.json()["response"])
        assert answer.events and answer.schema_version == "0.1"
        assert "thought" not in answer.answer
        for event in answer.events:
            assert event.video_id == video
            for frame in event.evidence:
                assert (await client.get(frame.uri)).status_code == 200
                assert 0 <= frame.t <= 18
        before = len(calls)
        assert (await client.post("/api/chat", json=body)).json() == result.json()
        assert len(calls) == before
        follow = await client.post(
            "/api/chat",
            json={
                **body,
                "request_id": "req_gemini_follow",
                "question": "它后来呢？",
                "parent_request_id": body["request_id"],
            },
        )
        assert follow.status_code == 200 and follow.json()["usedContext"]
        assert any("Selected prior question" in json.dumps(p) for _, p in calls)
        with app.state.agent.ledger._connect() as conn:
            rows = conn.execute("SELECT kind,state FROM attempts").fetchall()
        assert len(rows) == len(calls) and all(r["state"] == "completed" for r in rows)
        assert sum(r["kind"] == "zoom" for r in rows) <= 6
        for req, payload in calls:
            if ":batchEmbedContents" in req.url.path:
                assert "inlineData" not in json.dumps(payload)
                assert all(
                    r["embedContentConfig"]["taskType"] in {"RETRIEVAL_QUERY", "RETRIEVAL_DOCUMENT"}
                    for r in payload["requests"]
                )
                assert all(
                    r["embedContentConfig"]["autoTruncate"] is False for r in payload["requests"]
                )
            elif payload["contents"][0]["parts"][0]["text"].startswith("{"):
                # Only visual verification has inline JPEGs; planning/rerank/synthesis do not.
                if "inlineData" in json.dumps(payload):
                    assert "observations" in payload["contents"][0]["parts"][0]["text"]
        foreign = httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test")
        async with foreign:
            await foreign.get("/api/session")
            assert (await foreign.get(answer.events[0].evidence[0].uri)).status_code == 404
    finally:
        await client.aclose()


@pytest.mark.anyio
@pytest.mark.parametrize("case", ["allowed", "unlisted", "unfunded", "changed_model"])
async def test_query_budget_rollover_preserves_index_and_old_reservations(
    tmp_path, monkeypatch, case
):
    monkeypatch.setenv("TEST_GEMINI_KEY", "test-secret")
    calls = []
    runtime = configuration()
    app, client, video, desk = await setup_real(
        tmp_path,
        monkeypatch,
        calls,
        runtime_factory=lambda: runtime,
        response_handler=handler(calls),
    )
    try:
        ledger = app.state.agent.ledger
        with ledger._connect() as conn:
            owner = conn.execute("SELECT scope FROM budgets WHERE scope!='*'").fetchone()[0]
        ledger.reserve(
            attempt_id="old_unknown",
            owner=owner,
            version="test_v1",
            payload_hash="prior-dispatch",
            kind="text",
            money_units=1,
            currency_unit="USD_MICRO",
        )
        ledger.transition("old_unknown", "dispatched")
        ledger.transition("old_unknown", "unknown")
        with app.state.workspace.db() as conn:
            old_manifest = conn.execute(
                "SELECT manifest FROM videos WHERE id=?", (video,)
            ).fetchone()[0]
        with ledger._connect() as conn:
            old_attempts = [tuple(r) for r in conn.execute("SELECT * FROM attempts ORDER BY id")]
            budgets = [dict(r) for r in conn.execute("SELECT * FROM budgets")]
        for budget in budgets:
            ledger.restrict(budget["scope"], "test_v1")
            if case != "unfunded":
                ledger.install_approved_record(
                    ApprovedBudget(
                        budget["scope"], "test_v2", "MOCK ROLLOVER", 6, 40, 100, "USD_MICRO"
                    )
                )
        runtime.budget_version = "test_v2"
        runtime.query_index_budget_versions = [] if case == "unlisted" else ["test_v1"]
        if case == "changed_model":
            runtime.vision.revision = "DIFFERENT-REVISION"
        before_calls = len(calls)
        result = await client.post(
            "/api/chat",
            json={
                "investigation_id": desk["id"],
                "request_id": "req_rollover",
                "generation": 0,
                "question": "Where is the box?",
            },
        )
        if case == "allowed":
            assert result.status_code == 200, result.text
            assert Answer.model_validate(result.json()["response"]).status == "ok"
            assert len(calls) > before_calls
        else:
            assert len(calls) == before_calls
            assert result.status_code != 200 or result.json()["response"]["status"] == "error"
        with ledger._connect() as conn:
            assert [
                tuple(r)
                for r in conn.execute("SELECT * FROM attempts WHERE version='test_v1' ORDER BY id")
            ] == old_attempts
            for old in budgets:
                current = dict(
                    conn.execute(
                        "SELECT * FROM budgets WHERE scope=? AND version='test_v1'", (old["scope"],)
                    ).fetchone()
                )
                assert current == {**old, "active": 0}
            new_attempts = conn.execute("SELECT * FROM attempts WHERE version='test_v2'").fetchall()
            assert len(new_attempts) == len(calls) - before_calls
            if case == "allowed":
                assert all(r["kind"] != "coarse" for r in new_attempts)
                assert all(r["state"] == "completed" for r in new_attempts)
        detail = (await client.get("/api/videos/" + video)).json()
        assert detail["job"]["state"] == "ready"
        with app.state.workspace.db() as conn:
            assert (
                conn.execute("SELECT manifest FROM videos WHERE id=?", (video,)).fetchone()[0]
                == old_manifest
            )
    finally:
        await client.aclose()


@pytest.mark.anyio
async def test_gemini_cannot_accept_invented_frame_references(tmp_path, monkeypatch):
    monkeypatch.setenv("TEST_GEMINI_KEY", "test-secret")
    calls = []
    _, client, _, desk = await setup_real(
        tmp_path,
        monkeypatch,
        calls,
        runtime_factory=configuration,
        response_handler=handler(calls, fake_frame=True),
    )
    try:
        result = await client.post(
            "/api/chat",
            json={
                "investigation_id": desk["id"],
                "request_id": "req_fake_frame",
                "generation": 0,
                "question": "纸箱在哪？",
            },
        )
        assert result.status_code == 502, result.text
        assert result.json()["response"]["status"] == "error"
        assert not result.json()["response"]["events"]
    finally:
        await client.aclose()


@pytest.mark.anyio
async def test_audio_question_is_rejected_without_any_model_dispatch(tmp_path, monkeypatch):
    monkeypatch.setenv("TEST_GEMINI_KEY", "test-secret")
    calls = []
    _, client, _, desk = await setup_real(
        tmp_path,
        monkeypatch,
        calls,
        runtime_factory=configuration,
        response_handler=handler(calls),
    )
    try:
        before = len(calls)
        result = await client.post(
            "/api/chat",
            json={
                "investigation_id": desk["id"],
                "request_id": "req_audio_unsupported",
                "generation": 0,
                "question": "What was said in the audio?",
            },
        )
        assert result.status_code == 502, result.text
        answer = Answer.model_validate(result.json()["response"])
        assert answer.status == "error" and not answer.events
        assert answer.errors[0].code == "audio_channel_unavailable"
        assert len(calls) == before
    finally:
        await client.aclose()


@pytest.mark.parametrize(
    "mutation,code",
    [
        ("host", "gemini_endpoint_not_allowed"),
        ("http", "gemini_endpoint_not_allowed"),
        ("model", "invalid_gemini_model"),
        ("consent", "google_media_not_enabled"),
        ("key", "model_key_missing"),
    ],
)
def test_gemini_configuration_blocks_unsafe_routes(monkeypatch, mutation, code):
    monkeypatch.setenv("TEST_GEMINI_KEY", "test-secret")
    config = configuration()
    assert not config.blockers()
    if mutation == "host":
        config.vision.base_url = "https://other.example/v1beta"
    if mutation == "http":
        config.text.base_url = "http://generativelanguage.googleapis.com/v1beta"
    if mutation == "model":
        config.embed.model = "bad/model?key=secret"
    if mutation == "consent":
        config.allow_google_media = False
    if mutation == "key":
        config.text.key_env = None
    assert code in config.blockers()
    assert not readiness_report(Settings(mode="real"), config, approved=True)[
        "dispatch_prerequisites_met"
    ]


def provider(tmp_path, monkeypatch, respond):
    monkeypatch.setenv("TEST_GEMINI_KEY", "test-secret")
    ledger = AttemptLedger(tmp_path / "attempts.sqlite3")
    config = configuration()
    return Provider(config, ledger, lambda: None, httpx.MockTransport(respond))


def kwargs():
    return {
        "owner": "owner",
        "attempt": "req_test_plan",
        "kind": "text",
        "version": "test_v1",
        "category": "query",
        "deadline": time.monotonic() + 30,
    }


def test_gemini_unapproved_budget_sends_nothing(tmp_path, monkeypatch):
    calls = []
    p = provider(tmp_path, monkeypatch, lambda req: calls.append(req))
    with pytest.raises(BudgetDenied):
        p.chat("text", "{}", **kwargs())
    assert not calls


@pytest.mark.parametrize("role", ["text", "rerank", "vision"])
@pytest.mark.parametrize("oversized", ["界" * (64 * 1024 // 3 + 1), "\ufdfa" * 4000])
def test_generation_text_bound_rejects_before_budget_or_network(
    tmp_path, monkeypatch, role, oversized
):
    calls = []
    p = provider(tmp_path, monkeypatch, lambda req: calls.append(req))
    approve(p.ledger, "owner")
    with pytest.raises(AgentError, match="gemini_text_input_limit"):
        if role == "rerank":
            p.call(
                role,
                "/rerank",
                {"model": "gemini-test", "query": "find", "documents": [oversized], "top_n": 1},
                **kwargs(),
            )
        elif role == "vision":
            import base64

            p.chat(
                role,
                [
                    {"type": "text", "text": oversized},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": "data:image/jpeg;base64,"
                            + base64.b64encode(b"\xff\xd8\xff").decode()
                        },
                    },
                ],
                **kwargs(),
            )
        else:
            p.chat(role, oversized, **kwargs())
    assert not calls
    assert p.ledger.read_attempt("req_test_plan", "owner") is None


@pytest.mark.parametrize("finish", ["MAX_TOKENS", "SAFETY", "RECITATION"])
def test_gemini_incomplete_results_are_unknown_and_never_resent(tmp_path, monkeypatch, finish):
    calls = []

    def respond(req):
        calls.append(req)
        return response({"inspect": [0]}, finish)

    p = provider(tmp_path, monkeypatch, respond)
    approve(p.ledger, "owner")
    with pytest.raises(AgentError, match="model_unknown"):
        p.chat("text", "{}", **kwargs())
    assert p.ledger.read_attempt("req_test_plan", "owner")["state"] == "unknown"
    with pytest.raises(AgentError, match="unknown_attempt_do_not_resend"):
        p.chat("text", "{}", **kwargs())
    assert len(calls) == 1


def test_gemini_external_media_and_oversized_requests_rejected_before_reservation(
    tmp_path, monkeypatch
):
    calls = []
    p = provider(tmp_path, monkeypatch, lambda req: calls.append(req))
    approve(p.ledger, "owner")
    with pytest.raises(AgentError, match="gemini_inline_jpeg_required"):
        p.chat(
            "vision",
            [{"type": "image_url", "image_url": {"url": "https://private.example/x.jpg"}}],
            **kwargs(),
        )
    monkeypatch.setattr("ctrlf_video.gemini.MAX_REQUEST_BYTES", 200)
    with pytest.raises(AgentError, match="gemini_request_limit"):
        p.chat("text", "too large", **kwargs())
    assert not calls and p.ledger.read_attempt("req_test_plan", "owner") is None


def test_gemini_ignores_thoughts_and_rejects_function_calls():
    content = {
        "candidates": [
            {
                "finishReason": "STOP",
                "content": {
                    "parts": [
                        {"thought": True, "text": '{"wrong":true}'},
                        {"text": '{"inspect":'},
                        {"text": "[0]}"},
                    ]
                },
            }
        ]
    }
    assert (
        normalize_response("text", content)["choices"][0]["message"]["content"] == '{"inspect":[0]}'
    )
    content["candidates"][0]["content"]["parts"] = [{"functionCall": {"name": "tool"}}]
    with pytest.raises(AgentError):
        normalize_response("text", content)


def test_template_is_valid_but_blocked_and_gemini_is_the_only_provider(monkeypatch):
    monkeypatch.setenv("CTRLF_RUNTIME_FILE", str(Path("docs/runtime.example.json")))
    config = load_runtime()
    assert config.provider == "gemini"
    assert "calibration_expired" in config.blockers()
    assert "resource_cost_bound_unverified" in config.blockers()
    assert "google_media_not_enabled" in config.blockers()
    values = config.model_dump()
    values.pop("provider")
    assert Runtime.model_validate(values).provider == "gemini"
    for changes in ({"provider": "other_provider"}, {"asr": values["vision"]}):
        with pytest.raises(ValidationError):
            Runtime.model_validate({**values, **changes})
    _, wire = prepare_request(
        "embed", "/embeddings", {"model": "test", "input": ["one", "two"]}, "ingest"
    )
    assert len(wire["requests"]) == 2
