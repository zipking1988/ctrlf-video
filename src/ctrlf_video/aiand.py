"""ai& Gemma generation adapter; bounded decoded JPEGs, no video/file uploads.

All dispatch, ownership checks and reservations remain in Provider. Google
embeddings use the existing native Gemini adapter and backend credential.
"""

import json

from ctrlf_video.agent import AgentError
from ctrlf_video.gemini import MAX_REQUEST_BYTES
from ctrlf_video.gemini import prepare_request as gemini_request

BASE_URL = "https://api.aiand.com/v1"
MODEL = "google/gemma-4-31b-it"


def json_schema(value):
    """Translate the existing Gemini schema dialect without changing field names."""
    if isinstance(value, list):
        return [json_schema(item) for item in value]
    if not isinstance(value, dict):
        return value
    result = {key: json_schema(item) for key, item in value.items()}
    if isinstance(result.get("type"), str):
        result["type"] = result["type"].lower()
    if result.get("type") == "object":
        result["additionalProperties"] = False
    return result


def prepare_request(role, route, payload, category):
    if payload.get("model") != MODEL:
        raise AgentError("invalid_aiand_model")
    if role not in {"vision", "text", "rerank"}:
        raise AgentError("aiand_route_not_supported")
    # Reuse the established text/image validation and hard bounds before any
    # reservation. The surrogate ID is only for validating the shared contract;
    # the actual request and its fingerprint always identify the Gemma model.
    _, checked = gemini_request(role, route, {**payload, "model": "validated"}, category)
    content = []
    for part in checked["contents"][0]["parts"]:
        if "text" in part:
            content.append({"type": "text", "text": part["text"]})
        else:
            content.append(
                {
                    "type": "image_url",
                    "image_url": {"url": "data:image/jpeg;base64," + part["inlineData"]["data"]},
                }
            )
    schema = checked["generationConfig"].get("responseSchema")
    wire = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": checked["systemInstruction"]["parts"][0]["text"]},
            {"role": "user", "content": content},
        ],
        "temperature": 0,
        "max_completion_tokens": 4096,
        "reasoning_effort": "none",
        "stream": False,
        "response_format": (
            {
                "type": "json_schema",
                "json_schema": {
                    "name": "video_evidence",
                    "strict": True,
                    "schema": json_schema(schema),
                },
            }
            if schema is not None
            else {"type": "json_object"}
        ),
    }
    if len(json.dumps(wire, ensure_ascii=False).encode()) > MAX_REQUEST_BYTES:
        raise AgentError("aiand_request_limit")
    return "/chat/completions", wire


def normalize_response(role, response):
    choices = response.get("choices") if isinstance(response, dict) else None
    if not isinstance(choices, list) or len(choices) != 1 or not isinstance(choices[0], dict):
        raise AgentError("invalid_aiand_response")
    choice = choices[0]
    if choice.get("finish_reason") != "stop":
        raise AgentError("aiand_incomplete_response")
    message = choice.get("message")
    if not isinstance(message, dict) or message.get("tool_calls") or message.get("refusal"):
        raise AgentError("invalid_aiand_response")
    # Never promote reasoning_content/reasoning to visible evidence.
    text = message.get("content")
    if not isinstance(text, str) or not 0 < len(text) <= 100000:
        raise AgentError("invalid_aiand_response")
    if role == "rerank":
        result = json.loads(text)
        if not isinstance(result, dict):
            raise AgentError("invalid_rerank")
        return result
    return {"choices": [{"message": {"content": text}}]}
