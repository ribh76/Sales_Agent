from typing import Any

from app.core.config import settings
from app.schemas.company import CompanyCreate
from app.services.prompts import SYSTEM_PROMPT, build_icp_prompt
from app.utils.json_extract import extract_json_object


def get_anthropic_client() -> Any | None:
    if not settings.anthropic_api_key:
        return None

    try:
        from anthropic import Anthropic
    except ImportError:
        return None

    return Anthropic(api_key=settings.anthropic_api_key)


def call_claude_json(prompt: str, use_web_search: bool = False) -> dict[str, Any]:
    client = get_anthropic_client()
    if client is None:
        return {}

    request: dict[str, Any] = {
        "model": settings.anthropic_model,
        "max_tokens": 2500,
        "temperature": 0.2,
        "system": SYSTEM_PROMPT,
        "messages": [{"role": "user", "content": prompt}],
    }
    if use_web_search:
        request["tools"] = [
            {"type": "web_search_20250305", "name": "web_search", "max_uses": 3}
        ]

    try:
        response = client.messages.create(**request)
        return extract_json_object(_response_text(response))
    except Exception:
        return {}


def _response_text(response: Any) -> str:
    parts: list[str] = []
    for block in getattr(response, "content", []) or []:
        if isinstance(block, dict):
            if block.get("type") == "text":
                parts.append(str(block.get("text", "")))
            continue

        if getattr(block, "type", None) == "text":
            parts.append(str(getattr(block, "text", "")))
    return "\n".join(part for part in parts if part)


class AnthropicICPClient:
    def __init__(self) -> None:
        self.model = settings.anthropic_model

    @property
    def enabled(self) -> bool:
        return bool(settings.anthropic_api_key)

    def analyze(self, company: CompanyCreate) -> dict[str, Any] | None:
        result = call_claude_json(build_icp_prompt(company))
        return result or None
