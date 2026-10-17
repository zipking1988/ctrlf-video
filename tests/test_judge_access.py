"""Anonymous recorded-demo access stays independent of private sessions and models."""

import httpx
import pytest

from ctrlf_video.gateway import create_gateway
from ctrlf_video.schema import Answer


@pytest.mark.anyio
async def test_public_judge_replays_without_backend_cookie_or_approval(monkeypatch):
    monkeypatch.setenv("CTRLF_PUBLIC_ORIGIN", "https://public.example")
    monkeypatch.setenv("CTRLF_BACKEND_ORIGIN", "https://backend.example")
    monkeypatch.setenv("CTRLF_GATEWAY_TOKEN", "synthetic-test-token-not-for-deployment-123456")

    def no_upstream(request):
        raise AssertionError("Public demo must not request a private session or model API")

    gateway = create_gateway(transport=httpx.MockTransport(no_upstream), serve_frontend=True)
    async with gateway.router.lifespan_context(gateway):
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=gateway), base_url="https://public.example"
        ) as visitor:
            page = await visitor.get("/static/judge/index.html")
            assert page.status_code == 200
            assert "/#example" in page.text
            assert "/static/judge/redirect.js" in page.text
            root = await visitor.get("/")
            assert root.status_code == 200
            assert 'href="#example"' in root.text
            assert "recorded-example-root" in root.text
            assert "set-cookie" not in page.headers
            data = (await visitor.get("/static/judge/basketball/results.json")).json()
            assert data["query"]["response"]["status"] == "partial"
            Answer.model_validate(data["query"]["response"])
            for event in data["query"]["response"]["events"]:
                for frame in event["evidence"]:
                    assert (await visitor.get(data["public_assets"][frame["frame_id"]])).headers[
                        "content-type"
                    ] == "image/jpeg"
            media = await visitor.get(data["source"]["url"], headers={"Range": "bytes=0-63"})
            assert media.status_code == 206
            assert len(media.content) == 64
            assert media.headers["content-type"] == "video/mp4"
            assert "set-cookie" not in media.headers
            assert (await visitor.get("/static/judge/%2e%2e/%2e%2e/%2e%2e/.env")).status_code == 404
