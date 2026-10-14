"""Transport mocks test integration; they are never presented as live model evaluation."""

import asyncio
import json
import threading
import time
from pathlib import Path

import httpx
import pytest
from httpx import ASGITransport, AsyncClient

from ctrlf_video.agent import AgentError, Endpoint, Provider, Runtime, checked_embeddings
from ctrlf_video.api import create_app
from ctrlf_video.attempts import ApprovedBudget, AttemptLedger, BudgetDenied
from ctrlf_video.config import Settings
from ctrlf_video.gemini import BASE_URL
from ctrlf_video.schema import Answer


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture(autouse=True)
def gemini_mock_key(monkeypatch):
    monkeypatch.setenv("TEST_GEMINI_KEY", "test-secret")


def configuration():
    def endpoint(role):
        return Endpoint(
            base_url=BASE_URL,
            model="gemini-test-" + role,
            revision="mock-contract-test",
            key_env="TEST_GEMINI_KEY",
            max_cost_micro=1,
        )

    return Runtime(
        allow_google_media=True,
        vision=endpoint("vision"),
        embed=endpoint("embed"),
        rerank=endpoint("rerank"),
        text=endpoint("text"),
        budget_version="test_v1",
        calibration_reference="SYNTHETIC TEST ONLY",
        resource_cutoff_reference="MOCK",
        valid_until=time.time() + 3600,
        attempt_seconds=2,
    )


def generation_response(result):
    return httpx.Response(
        200,
        json={
            "candidates": [
                {
                    "finishReason": "STOP",
                    "content": {"parts": [{"text": json.dumps(result)}]},
                }
            ],
        },
    )


def approve(ledger, owner, calls=100, money=100):
    for scope in ("*", owner):
        ledger.install_approved_record(
            ApprovedBudget(
                scope, "test_v1", "TEST ONLY NO MONEY", min(50, calls), calls, money, "USD_MICRO"
            )
        )


def handler(calls, fail_zoom=False):
    def respond(request):
        payload = json.loads(request.content)
        calls.append((str(request.url), payload))
        assert request.url.host == "generativelanguage.googleapis.com"
        if request.url.path.endswith(":batchEmbedContents"):
            return httpx.Response(
                200,
                json={"embeddings": [{"values": [1.0, 0.0]} for _ in payload["requests"]]},
            )
        parts = payload["contents"][0]["parts"]
        content = parts[0]["text"]
        if any("inlineData" in part for part in parts):
            selected = [json.loads(part["text"]) for part in parts[1:] if "text" in part]
            if content.startswith("Describe"):
                result = {
                    "frames": [
                        {"frame_id": f["frame_id"], "caption": "纸箱在工作台上"} for f in selected
                    ]
                }
            else:
                if fail_zoom:
                    raise httpx.ReadTimeout("mock transport timeout")
                result = {
                    "observations": [
                        {
                            "frame_ids": [selected[0]["frame_id"]],
                            "statement": "纸箱出现在工作台上。",
                        }
                    ],
                    "unresolved": [],
                }
        else:
            prompt = json.loads(content)
            if "documents" in prompt:
                result = {"results": [{"index": i} for i in range(len(prompt["documents"]))]}
            elif "candidates" in prompt:
                result = {"inspect": list(range(min(3, len(prompt["candidates"]))))}
            else:
                result = {
                    "answer": "可以在引用画面中看到纸箱。",
                    "followups": ["之后的位置呢？"],
                    "unresolved": [],
                }
        return generation_response(result)

    return respond


async def setup_real(
    tmp_path,
    monkeypatch,
    calls,
    fail_zoom=False,
    *,
    runtime_factory=configuration,
    response_handler=None,
):
    import ctrlf_video.api

    monkeypatch.setenv("CTRLF_DATA_DIR", str(tmp_path))
    monkeypatch.setattr(ctrlf_video.api, "load_runtime", runtime_factory)
    app = create_app(Settings(mode="real"))
    app.state.agent.transport = httpx.MockTransport(response_handler or handler(calls, fail_zoom))
    client = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    session = (await client.get("/api/session")).json()
    client.headers["x-ctrlf-csrf"] = session["csrf"]
    approve(app.state.agent.ledger, session["owner_id"])
    upload = await client.post(
        "/api/videos",
        content=Path("src/ctrlf_video/static/demo/parcel.mp4").read_bytes(),
        headers={"content-type": "video/mp4"},
    )
    video = upload.json()["id"]
    for _ in range(100):
        detail = (await client.get("/api/videos/" + video)).json()
        if detail["job"]["state"] not in {"queued", "probing"}:
            break
        await asyncio.sleep(0.03)
    assert detail["job"]["state"] == "awaiting_configuration", detail
    assert (await client.post(f"/api/videos/{video}/analyze")).status_code == 202
    for _ in range(150):
        detail = (await client.get("/api/videos/" + video)).json()
        if detail["job"]["state"] in {"ready", "failed"}:
            break
        await asyncio.sleep(0.03)
    assert detail["job"]["state"] == "ready", detail
    desk = (await client.post("/api/investigations", json={"video_id": video})).json()
    return app, client, video, desk


@pytest.mark.anyio
@pytest.mark.parametrize("request_id", ["req_first", "r" * 128])
async def test_upload_index_query_multi_turn_same_id_and_source_ownership(
    tmp_path, monkeypatch, request_id
):
    calls = []
    app, client, video, desk = await setup_real(tmp_path, monkeypatch, calls)
    try:
        assert (await client.get("/api/session")).json()["real_ready"]
        body = {
            "investigation_id": desk["id"],
            "request_id": request_id,
            "generation": 0,
            "question": "纸箱在哪？",
        }
        assert (await client.post("/api/chat/prepare", json=body)).json()["kind"] == "ready"
        response = await client.post("/api/chat", json=body)
        assert response.status_code == 200, response.text
        result = response.json()
        answer = Answer.model_validate(result["response"])
        assert answer.events and all(e.video_id == video for e in answer.events)
        assert all(
            [
                (await client.get(frame.uri)).status_code == 200
                for event in answer.events
                for frame in event.evidence
            ]
        )
        before = len(calls)
        repeated = await client.post("/api/chat", json=body)
        assert repeated.json() == result and len(calls) == before
        changed = await client.post("/api/chat", json={**body, "question": "别的问题"})
        assert changed.status_code == 409 and len(calls) == before
        follow = {
            **body,
            "request_id": "req_follow",
            "question": "它后来呢？",
            "parent_request_id": request_id,
        }
        response = await client.post("/api/chat", json=follow)
        assert response.status_code == 200 and response.json()["usedContext"]
        assert (
            await client.post(
                "/api/chat",
                json={**follow, "request_id": "req_forged", "parent_request_id": "someone_else"},
            )
        ).status_code == 409
        records = (await client.get(f"/api/investigations/{desk['id']}/requests")).json()["items"]
        assert len(records) == 2 and all(r["state"] == "done" for r in records)
        # Only vision sends inline JPEGs; text and embeddings receive no images.
        for url, payload in calls:
            if "/models/gemini-test-text:" in url:
                assert all("inlineData" not in part for part in payload["contents"][0]["parts"])
        with app.state.agent.ledger._connect() as c:
            attempts = c.execute("SELECT kind,state FROM attempts").fetchall()
            assert all(r["state"] == "completed" for r in attempts)
            assert sum(r["kind"] == "zoom" for r in attempts) <= 6
    finally:
        await client.aclose()


@pytest.mark.anyio
async def test_unknown_same_request_never_resends_or_refunds(tmp_path, monkeypatch):
    calls = []
    app, client, _, desk = await setup_real(tmp_path, monkeypatch, calls, True)
    try:
        body = {
            "investigation_id": desk["id"],
            "request_id": "req_timeout",
            "generation": 0,
            "question": "纸箱在哪？",
        }
        response = await client.post("/api/chat", json=body)
        assert response.status_code == 409 and response.json()["state"] == "unknown"
        before = len(calls)
        assert (await client.post("/api/chat", json=body)).json()["state"] == "unknown"
        assert len(calls) == before
        with app.state.agent.ledger._connect() as c:
            zoom = c.execute("SELECT * FROM attempts WHERE kind='zoom'").fetchone()
            assert zoom["state"] == "unknown" and zoom["money"] == 1
        data = (await client.get(f"/api/investigations/{desk['id']}/requests")).json()["items"][0]
        assert data["input"] == {
            **body,
            "parent_request_id": None,
            "task_brief": "",
            "study_type": "ux_research",
        }
        assert data["state"] == "unknown"
    finally:
        await client.aclose()


@pytest.mark.anyio
async def test_pending_duplicate_and_reset_discard_late_answer(tmp_path, monkeypatch):
    calls = []
    app, client, _, desk = await setup_real(tmp_path, monkeypatch, calls)
    started, release = threading.Event(), threading.Event()
    real_query = app.state.agent.query

    def slow(*args, **kwargs):
        started.set()
        release.wait(5)
        return real_query(*args, **kwargs)

    monkeypatch.setattr(app.state.agent, "query", slow)
    body = {
        "investigation_id": desk["id"],
        "request_id": "req_slow",
        "generation": 0,
        "question": "纸箱在哪？",
    }
    try:
        first = asyncio.create_task(client.post("/api/chat", json=body))
        await asyncio.to_thread(started.wait, 2)
        second = await client.post("/api/chat", json=body)
        assert second.status_code == 202 and second.json()["state"] == "pending"
        assert second.headers["Retry-After"] == "3"
        await client.put(
            f"/api/investigations/{desk['id']}", json={"revision": 0, "state": {"epoch": 1}}
        )
        release.set()
        assert (await first).status_code == 409
        assert (await client.post("/api/chat", json=body)).status_code == 409
    finally:
        release.set()
        await client.aclose()


@pytest.mark.anyio
@pytest.mark.parametrize(
    "research_context",
    [
        {},
        {"task_brief": "Verify the task outcome", "study_type": "technical_sample"},
    ],
    ids=["default-context", "explicit-context"],
)
async def test_cancel_stops_later_dispatch_and_preserves_terminal_result(
    tmp_path, monkeypatch, research_context
):
    calls = []
    app, client, _, desk = await setup_real(tmp_path, monkeypatch, calls)
    started, release = threading.Event(), threading.Event()
    real_query = app.state.agent.query

    def slow(*args, **kwargs):
        started.set()
        release.wait(5)
        return real_query(*args, **kwargs)

    monkeypatch.setattr(app.state.agent, "query", slow)
    body = {
        "investigation_id": desk["id"],
        "request_id": "req_cancel",
        "generation": 0,
        "question": "纸箱在哪？",
        **research_context,
    }
    route = f"/api/investigations/{desk['id']}/requests/req_cancel/cancel"
    try:
        first = asyncio.create_task(client.post("/api/chat", json=body))
        assert await asyncio.to_thread(started.wait, 2)
        requests = (await client.get(f"/api/investigations/{desk['id']}/requests")).json()
        submitted = requests["items"][0]["input"]
        assert submitted["task_brief"] == research_context.get("task_brief", "")
        assert submitted["study_type"] == research_context.get("study_type", "ux_research")
        before = len(calls)
        cancelled = await client.post(route)
        assert cancelled.status_code == 200
        assert cancelled.json()["task_brief"] == submitted["task_brief"]
        assert cancelled.json()["study_type"] == submitted["study_type"]
        assert cancelled.json()["response"]["errors"][0]["code"] == "query_cancelled"
        release.set()
        assert (await first).json() == cancelled.json()
        assert (await client.post("/api/chat", json=body)).json() == cancelled.json()
        assert (await client.post(route)).json() == cancelled.json()
        assert len(calls) == before
    finally:
        release.set()
        await client.aclose()


def test_unapproved_budget_and_expired_calibration_dispatch_nothing(tmp_path):
    runtime = configuration()
    ledger = AttemptLedger(tmp_path / "ledger.sqlite")
    calls = []
    provider = Provider(runtime, ledger, lambda: None, httpx.MockTransport(handler(calls)))
    kwargs = dict(
        owner="owner",
        attempt="a",
        kind="embed",
        version="test_v1",
        category="query",
        deadline=time.monotonic() + 10,
    )
    with pytest.raises(BudgetDenied):
        provider.call("embed", "/embeddings", {"model": "m", "input": ["x"]}, **kwargs)
    assert not calls
    approve(ledger, "owner", 1, 1)
    runtime.valid_until = 0
    with pytest.raises(AgentError, match="real_blocked"):
        provider.call("embed", "/embeddings", {"model": "m", "input": ["x"]}, **kwargs)
    assert not calls


@pytest.mark.anyio
@pytest.mark.parametrize(
    "stage,malformed,expected_status",
    [
        ("planning", {"inspect": [None]}, "error"),
        ("zoom", {"observations": [None], "unresolved": []}, "error"),
        ("zoom", {"observations": [], "unresolved": None}, "error"),
        ("synthesis", {"answer": None, "followups": [], "unresolved": []}, "partial"),
        ("synthesis", {"answer": "answer", "followups": {}, "unresolved": []}, "partial"),
        ("rerank", {"results": [None]}, "error"),
        ("embed", {"embeddings": [{"values": ["bad-value"]}]}, "error"),
    ],
)
async def test_malformed_model_output_is_terminal_and_keeps_verified_evidence(
    tmp_path, monkeypatch, stage, malformed, expected_status
):
    calls = []
    app, client, _, desk = await setup_real(tmp_path, monkeypatch, calls)
    normal = handler(calls)

    def respond(request):
        payload = json.loads(request.content)
        parts = payload.get("contents", [{"parts": []}])[0]["parts"]
        content = parts[0]["text"] if parts else None
        images = any("inlineData" in part for part in parts)
        prompt = json.loads(content) if content and content.startswith("{") else {}
        replace = (
            stage == "embed"
            and request.url.path.endswith(":batchEmbedContents")
            or stage == "rerank"
            and "documents" in prompt
            or stage == "planning"
            and "candidates" in prompt
            or stage == "zoom"
            and images
            or stage == "synthesis"
            and not images
            and "observations" in prompt
        )
        if replace:
            return (
                httpx.Response(200, json=malformed)
                if stage == "embed"
                else generation_response(malformed)
            )
        return normal(request)

    app.state.agent.transport = httpx.MockTransport(respond)
    body = {
        "investigation_id": desk["id"],
        "request_id": "req_malformed",
        "generation": 0,
        "question": "纸箱在哪？",
    }
    try:
        first = await client.post("/api/chat", json=body)
        assert first.status_code == (200 if expected_status == "partial" else 502), first.text
        answer = Answer.model_validate(first.json()["response"])
        assert answer.status == expected_status
        assert bool(answer.events) == (expected_status == "partial")
        before = len(calls)
        assert (await client.post("/api/chat", json=body)).json() == first.json()
        assert len(calls) == before
        stored = (await client.get(f"/api/investigations/{desk['id']}/requests")).json()["items"]
        assert stored[0]["state"] == "done"
    finally:
        await client.aclose()


@pytest.mark.parametrize(
    "data,code",
    [
        ([{"index": 0, "embedding": [1.0]}, {"index": 0, "embedding": [2.0]}], "indices"),
        ([{"index": 0, "embedding": [1.0]}, {"index": 1, "embedding": [2.0, 3.0]}], "dimension"),
        ([{"index": 0, "embedding": [1.0]}, None], "indices"),
    ],
)
def test_embedding_response_requires_unique_complete_indices_and_dimensions(data, code):
    with pytest.raises(AgentError, match=code):
        checked_embeddings({"data": data}, 2)


@pytest.mark.anyio
async def test_exact_initial_budget_allows_cache_only_ingest_resume_and_checks_revocation(
    tmp_path, monkeypatch
):
    import ctrlf_video.api

    monkeypatch.setenv("CTRLF_DATA_DIR", str(tmp_path))
    monkeypatch.setattr(ctrlf_video.api, "load_runtime", configuration)
    app = create_app(Settings(mode="real"))
    calls = []
    app.state.agent.transport = httpx.MockTransport(handler(calls))
    client = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    session = (await client.get("/api/session")).json()
    owner = session["owner_id"]
    client.headers["x-ctrlf-csrf"] = session["csrf"]
    for scope in ("*", owner):
        app.state.agent.ledger.install_approved_record(
            ApprovedBudget(scope, "test_v1", "TEST ONLY", 1, 3, 3, "USD_MICRO")
        )
    real_publish = app.state.workspace.publish
    failures = []

    def fail_once(*args):
        if not failures:
            failures.append(True)
            raise OSError("synthetic publication failure")
        return real_publish(*args)

    monkeypatch.setattr(app.state.workspace, "publish", fail_once)
    try:
        upload = await client.post(
            "/api/videos",
            content=Path("src/ctrlf_video/static/demo/parcel.mp4").read_bytes(),
            headers={"content-type": "video/mp4"},
        )
        video = upload.json()["id"]
        for _ in range(100):
            detail = (await client.get(f"/api/videos/{video}")).json()
            if detail["job"]["state"] not in {"queued", "probing"}:
                break
            await asyncio.sleep(0.03)
        assert (await client.post(f"/api/videos/{video}/analyze")).status_code == 202
        for _ in range(150):
            detail = (await client.get(f"/api/videos/{video}")).json()
            if detail["job"]["state"] == "failed":
                break
            await asyncio.sleep(0.03)
        assert detail["job"]["state"] == "failed"
        before = len(calls)
        app.state.agent.admit_ingest(video, owner)
        response = await client.post(f"/api/videos/{video}/analyze")
        assert response.status_code == 202, response.text
        for _ in range(100):
            detail = (await client.get(f"/api/videos/{video}")).json()
            if detail["job"]["state"] == "ready":
                break
            await asyncio.sleep(0.03)
        assert detail["job"]["state"] == "ready", detail
        assert len(calls) == before == 2
        app.state.agent.ledger.restrict(owner, "test_v1")
        with pytest.raises(BudgetDenied):
            app.state.agent.admit_ingest(video, owner)
        assert len(calls) == before
    finally:
        await client.aclose()


@pytest.mark.anyio
async def test_cancelled_analysis_can_start_new_generation_without_overwriting_old_artifacts(
    tmp_path, monkeypatch
):
    calls = []
    app, client, video, _ = await setup_real(tmp_path, monkeypatch, calls)
    owner = app.state.workspace.authenticate(client.cookies.get("ctrlf_session"))["id"]
    directory = tmp_path / video
    original = json.loads((directory / "segments-1.json").read_text())
    original_frames = {
        frame["file"]: (directory / "frames" / frame["file"]).read_bytes()
        for segment in original
        for frame in segment["frames"]
    }
    try:
        app.state.agent.settings = Settings(mode="real", coarse_frames=8)
        with pytest.raises(AgentError, match="index_configuration_changed"):
            app.state.agent.admit_ingest(video, owner)
        assert (await client.post(f"/api/videos/{video}/cancel")).status_code == 202
        response = await client.post(f"/api/videos/{video}/analyze")
        assert response.status_code == 202, response.text
        for _ in range(150):
            detail = (await client.get(f"/api/videos/{video}")).json()
            if detail["job"]["state"] in {"ready", "failed"}:
                break
            await asyncio.sleep(0.03)
        assert detail["job"]["state"] == "ready", detail
        assert (directory / "segments-2.json").is_file()
        assert (directory / "run-config-2.json").is_file()
        assert json.loads((directory / "segments-1.json").read_text()) == original
        assert all(
            (directory / "frames" / name).read_bytes() == data
            for name, data in original_frames.items()
        )
        current = json.loads(app.state.workspace.owned("videos", video, owner)["manifest"])
        assert current["generation"] == 2
        assert all(
            "g2_" in frame["file"] for segment in current["segments"] for frame in segment["frames"]
        )
        assert (await client.post(f"/api/videos/{video}/cancel")).status_code == 202
        attempt = f"{video}_3_coarse_0"
        app.state.agent.ledger.reserve(
            attempt_id=attempt,
            owner=owner,
            version="test_v1",
            payload_hash="synthetic-timeout",
            kind="coarse",
            money_units=1,
            currency_unit="USD_MICRO",
        )
        app.state.agent.ledger.transition(attempt, "dispatched")
        app.state.agent.ledger.transition(attempt, "unknown")
        before = len(calls)
        response = await client.post(f"/api/videos/{video}/analyze")
        assert response.status_code == 409
        assert response.json()["detail"] == "unknown_attempt_do_not_resend"
        assert len(calls) == before
    finally:
        await client.aclose()


@pytest.mark.anyio
async def test_task_brief_reaches_gemini_and_is_bound_to_idempotent_request(tmp_path, monkeypatch):
    calls = []
    app, client, _, desk = await setup_real(tmp_path, monkeypatch, calls)
    try:
        brief = "Inspect the participant's invitation attempt; do not assume success."
        body = {
            "investigation_id": desk["id"],
            "request_id": "research_context",
            "generation": 0,
            "question": "What is visible?",
            "task_brief": brief,
            "study_type": "technical_sample",
        }
        before = len(calls)
        response = await client.post("/api/chat", json=body)
        assert response.status_code == 200, response.text
        assert response.json()["task_brief"] == brief
        assert response.json()["study_type"] == "technical_sample"
        # Retrieval, relevance, planning, visual verification and synthesis all see the brief.
        assert len(calls[before:]) >= 5
        assert all(brief in json.dumps(payload) for _, payload in calls[before:])
        count = len(calls)
        assert (await client.post("/api/chat", json=body)).json() == response.json()
        assert (
            await client.post("/api/chat", json={**body, "task_brief": "Changed"})
        ).status_code == 409
        assert len(calls) == count
        requests = (await client.get(f"/api/investigations/{desk['id']}/requests")).json()["items"]
        assert requests[0]["input"]["task_brief"] == brief
        assert (
            await client.post("/api/chat/prepare", json={**body, "task_brief": "x" * 2001})
        ).status_code == 422
    finally:
        await client.aclose()
