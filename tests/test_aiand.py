"""ai& transport regressions. Mock output is not live video acceptance."""

import base64
import json

import httpx
import pytest
from test_agent import approve, setup_real
from test_gemini import configuration as gemini_configuration
from test_gemini import kwargs
from test_gemini import response as gemini_response

from ctrlf_video.agent import AgentError, Endpoint, Provider
from ctrlf_video.aiand import BASE_URL, MODEL, normalize_response, prepare_request
from ctrlf_video.attempts import AttemptLedger, BudgetDenied
from ctrlf_video.schema import Answer


@pytest.fixture
def anyio_backend():
    return "asyncio"


def configuration(mode="aiand"):
    config = gemini_configuration()
    config.provider = mode
    config.allow_google_media = mode == "gemini_aiand"
    config.allow_aiand_media = True
    endpoint = Endpoint(
        base_url=BASE_URL,
        model=MODEL,
        revision="MOCK NOT LIVE",
        key_env="TEST_AIAND_KEY",
        max_cost_micro=1,
    )
    config.vision = config.rerank = config.text = endpoint
    if mode == "gemini_aiand":
        config.vision = gemini_configuration().vision
    return config


def response(result, finish="stop"):
    return httpx.Response(
        200,
        json={
            "choices": [
                {
                    "finish_reason": finish,
                    "message": {
                        "content": json.dumps(result),
                        "reasoning_content": "Never evidence",
                    },
                }
            ]
        },
    )


def handler(calls):
    def respond(req):
        payload = json.loads(req.content)
        calls.append((req, payload))
        if req.url.host == "generativelanguage.googleapis.com":
            assert "authorization" not in req.headers
            assert req.headers["x-goog-api-key"] == "google-test-secret"
            if req.url.path.endswith(":generateContent"):
                parts = payload["contents"][0]["parts"]
                assert any("inlineData" in part for part in parts)
                ids = [json.loads(part["text"])["frame_id"] for part in parts[1:] if "text" in part]
                if parts[0]["text"].startswith("Describe"):
                    return gemini_response(
                        {"frames": [{"frame_id": f, "caption": "A parcel on a table"} for f in ids]}
                    )
                return gemini_response(
                    {
                        "observations": [
                            {"frame_ids": [ids[0]], "statement": "A parcel is visible"}
                        ],
                        "unresolved": [],
                    }
                )
            assert req.url.path.endswith(":batchEmbedContents")
            assert "inlineData" not in json.dumps(payload)
            return httpx.Response(
                200, json={"embeddings": [{"values": [1.0, 0.0]} for _ in payload["requests"]]}
            )
        assert str(req.url) == BASE_URL + "/chat/completions"
        assert req.headers["authorization"] == "Bearer aiand-test-secret"
        assert "x-goog-api-key" not in req.headers
        assert payload["model"] == MODEL
        assert payload["max_completion_tokens"] == 4096
        assert payload["reasoning_effort"] == "none" and payload["stream"] is False
        parts = payload["messages"][1]["content"]
        prompt = parts[0]["text"]
        if any(p["type"] == "image_url" for p in parts):
            ids = [json.loads(p["text"])["frame_id"] for p in parts[1:] if p["type"] == "text"]
            assert all(
                p["image_url"]["url"].startswith("data:image/jpeg;base64,")
                for p in parts
                if p["type"] == "image_url"
            )
            if prompt.startswith("Describe"):
                return response(
                    {"frames": [{"frame_id": f, "caption": "A parcel on a table"} for f in ids]}
                )
            return response(
                {
                    "observations": [{"frame_ids": [ids[0]], "statement": "A parcel is visible"}],
                    "unresolved": [],
                }
            )
        query = json.loads(prompt)
        if "documents" in query:
            return response({"results": [{"index": i} for i in range(len(query["documents"]))]})
        if "candidates" in query:
            assert payload["response_format"]["json_schema"]["schema"]["type"] == "object"
            return response({"inspect": [0]})
        return response(
            {
                "answer": "A parcel is visible in the cited frames.",
                "unresolved": [],
                "followups": ["What changes?"],
            }
        )

    return respond


@pytest.mark.anyio
@pytest.mark.parametrize("mode", ["aiand", "gemini_aiand"])
async def test_aiand_ingestion_whole_video_three_followups_and_owned_evidence(
    tmp_path, monkeypatch, mode
):
    monkeypatch.setenv("TEST_AIAND_KEY", "aiand-test-secret")
    monkeypatch.setenv("TEST_GEMINI_KEY", "google-test-secret")

    def factory():
        return configuration(mode)

    monkeypatch.setattr("ctrlf_video.agent.load_runtime", factory)
    calls = []
    app, client, video, desk = await setup_real(
        tmp_path,
        monkeypatch,
        calls,
        runtime_factory=factory,
        response_handler=handler(calls),
    )
    try:
        assert (await client.get("/api/session")).json()["provider"] == mode
        status = (await client.get("/api/runtime/status")).json()
        assert status["provider"] == mode and not status["live_verified"]
        assert "aiand-test-secret" not in json.dumps(status)
        assert (await client.get("/health")).json()["provider"] == mode
        body = {
            "investigation_id": desk["id"],
            "request_id": "req_aiand_whole",
            "generation": 0,
            "question": "Break down the whole video.",
        }
        for turn in range(4):
            result = await client.post("/api/chat", json=body)
            assert result.status_code == 200, result.text
            answer = Answer.model_validate(result.json()["response"])
            assert answer.events and "Never evidence" not in answer.answer
            if turn:
                assert result.json()["usedContext"]
            for event in answer.events:
                for frame in event.evidence:
                    assert (await client.get(frame.uri)).status_code == 200
            before = len(calls)
            assert (await client.post("/api/chat", json=body)).json() == result.json()
            assert len(calls) == before
            body = {
                **body,
                "request_id": f"req_aiand_follow_{turn}",
                "parent_request_id": body["request_id"],
                "question": "What happened next?",
            }
        with app.state.agent.ledger._connect() as conn:
            rows = conn.execute("SELECT state FROM attempts").fetchall()
        assert len(rows) == len(calls) and all(r["state"] == "completed" for r in rows)
        contextual = [
            json.dumps(payload)
            for _, payload in calls
            if "Selected prior question" in json.dumps(payload)
        ]
        assert contextual and all(
            "untrusted prior model claims" in payload for payload in contextual
        )
        assert all(
            "Selected prior question and verified evidence" not in payload for payload in contextual
        )
        visual = [
            json.dumps(payload)
            for _, payload in calls
            if "inlineData" in json.dumps(payload) or "data:image" in json.dumps(payload)
        ]
        assert any(
            "correct contradictions" in payload and "before" in payload for payload in visual
        )
        if mode == "gemini_aiand":
            assert all(
                "data:image" not in json.dumps(payload)
                for req, payload in calls
                if req.url.host == "api.aiand.com"
            )
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://test"
        ) as foreign:
            await foreign.get("/api/session")
            assert (await foreign.get(answer.events[0].evidence[0].uri)).status_code == 404
    finally:
        await client.aclose()


def test_aiand_consent_origin_and_model_are_separate_gates(monkeypatch):
    monkeypatch.setenv("TEST_AIAND_KEY", "aiand-test-secret")
    monkeypatch.setenv("TEST_GEMINI_KEY", "google-test-secret")
    config = configuration()
    assert not config.blockers()
    config.allow_aiand_media = False
    assert "aiand_media_not_enabled" in config.blockers()
    config.allow_google_media = True
    assert "aiand_media_not_enabled" in config.blockers()
    config.vision = config.vision.model_copy(update={"base_url": "https://api.aiand.com.evil/v1"})
    assert "aiand_endpoint_not_allowed" in config.blockers()
    config.vision = config.vision.model_copy(update={"base_url": BASE_URL, "model": "auto"})
    assert "invalid_aiand_model" in config.blockers()


def provider(tmp_path, monkeypatch, respond):
    monkeypatch.setenv("TEST_AIAND_KEY", "aiand-test-secret")
    monkeypatch.setenv("TEST_GEMINI_KEY", "google-test-secret")
    return Provider(
        configuration(),
        AttemptLedger(tmp_path / "attempts.sqlite3"),
        lambda: None,
        httpx.MockTransport(respond),
    )


def test_aiand_no_approval_and_external_media_never_dispatch(tmp_path, monkeypatch):
    calls = []
    p = provider(tmp_path, monkeypatch, lambda req: calls.append(req))
    with pytest.raises(BudgetDenied):
        p.chat("text", "{}", **kwargs())
    approve(p.ledger, "owner")
    with pytest.raises(AgentError, match="gemini_inline_jpeg_required"):
        p.chat(
            "vision",
            [{"type": "image_url", "image_url": {"url": "https://example.com/private.mp4"}}],
            **kwargs(),
        )
    with pytest.raises(AgentError, match="gemini_text_input_limit"):
        p.chat("text", "x" * 65537, **kwargs())
    assert not calls
    with p.ledger._connect() as conn:
        assert conn.execute("SELECT count(*) FROM attempts").fetchone()[0] == 0


@pytest.mark.parametrize("finish", ["length", "content_filter", "tool_calls", None])
def test_aiand_incomplete_output_is_unknown_without_resend(tmp_path, monkeypatch, finish):
    calls = []

    def respond(req):
        calls.append(req)
        return response({"answer": "cut off"}, finish)

    p = provider(tmp_path, monkeypatch, respond)
    approve(p.ledger, "owner")
    args = kwargs()
    with pytest.raises(AgentError, match="model_unknown"):
        p.chat("text", "{}", **args)
    assert p.ledger.read_attempt(args["attempt"], "owner")["state"] == "unknown"
    with pytest.raises(AgentError, match="unknown_attempt_do_not_resend"):
        p.chat("text", "{}", **args)
    assert len(calls) == 1


def test_aiand_response_never_uses_reasoning_as_answer():
    with pytest.raises(AgentError, match="invalid_aiand_response"):
        normalize_response(
            "text",
            {
                "choices": [
                    {
                        "finish_reason": "stop",
                        "message": {"content": None, "reasoning_content": "{}"},
                    }
                ]
            },
        )


def test_aiand_request_translates_schema_and_keeps_actual_frame_timestamp():
    image = base64.b64encode(b"\xff\xd8\xfftest").decode()
    _, wire = prepare_request(
        "vision",
        "/chat/completions",
        {
            "model": MODEL,
            "messages": [
                {"role": "system", "content": "Return JSON"},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": '{"frame_id":"f1","t":12.345}'},
                        {
                            "type": "image_url",
                            "image_url": {"url": "data:image/jpeg;base64," + image},
                        },
                    ],
                },
            ],
            "response_schema": {
                "type": "OBJECT",
                "required": ["inspect"],
                "properties": {"inspect": {"type": "ARRAY", "items": {"type": "INTEGER"}}},
            },
        },
        "query",
    )
    assert "12.345" in json.dumps(wire)
    schema = wire["response_format"]["json_schema"]["schema"]
    assert schema["properties"]["inspect"]["items"]["type"] == "integer"
