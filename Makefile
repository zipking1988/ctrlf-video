.PHONY: setup test check preflight run demo eval-fixture eval-check agent-check schema

setup:
	uv sync --python 3.13

test:
	uv run --frozen pytest

check:
	uv run --frozen ruff check .
	uv run --frozen ruff format --check .
	uv run --frozen python scripts/export_contracts.py --check

schema:
	uv run --frozen python scripts/export_contracts.py

preflight:
	uv run --frozen python -m ctrlf_video.preflight

run:
	uv run --frozen uvicorn ctrlf_video.api:create_app --factory --host 127.0.0.1 --port 8765

demo: run

eval-fixture:
	uv run --frozen python -m ctrlf_video.fixtures

eval-check:
	uv run --frozen python -m ctrlf_video.evaluation validate --dataset eval/diagnostics.template.json
	uv run --frozen python -m ctrlf_video.evaluation score --dataset eval/diagnostics.template.json --run eval/run.template.json

agent-check:
	uv run --frozen python -m ctrlf_video.readiness
