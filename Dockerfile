FROM python:3.13.12-slim-bookworm AS runtime

RUN pip install --no-cache-dir uv==0.10.12

WORKDIR /app
COPY pyproject.toml uv.lock README.md ./
COPY src/ctrlf_video ./src/ctrlf_video
RUN uv sync --frozen --no-dev --no-editable \
    && useradd --uid 10001 --create-home ctrlf-video \
    && mkdir /data \
    && chown ctrlf-video:ctrlf-video /data

ENV PATH="/app/.venv/bin:$PATH" \
    CTRLF_VIDEO_MODE=fixture \
    CTRLF_COMPONENT=workspace \
    CTRLF_DATA_DIR=/data \
    CTRLF_REQUIRE_DATA_MOUNT=1 \
    PORT=8080 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
EXPOSE 8080
CMD ["python", "-m", "ctrlf_video.server"]

# Public UI and same-origin proxy: no decoder, workspace or model runtime starts.
FROM runtime AS frontend
ENV CTRLF_COMPONENT=frontend
USER 10001:10001

# Default target preserves the existing durable backend container contract.
FROM runtime AS backend
RUN sed -i 's|http://deb.debian.org|https://deb.debian.org|g' /etc/apt/sources.list.d/debian.sources \
    && apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg bubblewrap \
    && rm -rf /var/lib/apt/lists/*
USER 10001:10001
