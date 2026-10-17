"""The browser sees the enforced upload cap without a model call or upload."""

import httpx
import pytest

from ctrlf_video.api import create_app
from ctrlf_video.config import Settings
from ctrlf_video.gateway import MAX_BODY_BYTES, create_gateway
from ctrlf_video.media import MAX_UPLOAD


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_local_and_gateway_sessions_advertise_enforced_upload_limits(monkeypatch, tmp_path):
    monkeypatch.setenv("CTRLF_DATA_DIR", str(tmp_path))
    monkeypatch.delenv("CTRLF_GATEWAY_TOKEN", raising=False)
    backend = create_app(Settings())
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=backend), base_url="http://localhost"
    ) as client:
        response = await client.get("/api/session")
        assert response.status_code == 200
        assert int(response.headers["X-CTRLF-Upload-Limit"]) == MAX_UPLOAD
        assert response.headers["cache-control"] == "no-store"

    monkeypatch.setenv("CTRLF_PUBLIC_ORIGIN", "https://public.example")
    monkeypatch.setenv("CTRLF_BACKEND_ORIGIN", "https://backend.example")
    monkeypatch.setenv("CTRLF_GATEWAY_TOKEN", "synthetic-upload-cap-token-not-a-secret-12345")
    monkeypatch.setenv("CTRLF_DATA_DIR", str(tmp_path / "gateway-backend"))
    backend = create_app(Settings())
    gateway = create_gateway(transport=httpx.ASGITransport(app=backend))
    async with gateway.router.lifespan_context(gateway):
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=gateway), base_url="https://public.example"
        ) as client:
            response = await client.get("/api/session")
            assert response.status_code == 200
            assert int(response.headers["X-CTRLF-Upload-Limit"]) == MAX_BODY_BYTES
            assert "HttpOnly" in response.headers["set-cookie"]
            rejected = await client.post(
                "/api/videos", content=b"", headers={"Content-Length": str(MAX_BODY_BYTES + 1)}
            )
            assert rejected.status_code == 413
