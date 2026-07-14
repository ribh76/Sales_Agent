from typing import Any

from app.core.config import settings
from app.schemas.company import CompanyCreate
from app.services.prompts import SYSTEM_PROMPT, build_icp_prompt
from app.utils.json_extract import extract_json_object


class AnthropicICPClient:
    def __init__(self) -> None:
        self.model = settings.anthropic_model

    @property
    def enabled(self) -> bool:
        return bool(settings.anthropic_api_key)

    def analyze(self, company: CompanyCreate) -> dict[str, Any] | None:
        if not self.enabled:
            return None

        from anthropic import Anthropic

        client = Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model=self.model,
            max_tokens=1800,
            temperature=0.2,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": build_icp_prompt(company)}],
        )
        text = "\n".join(
            block.text for block in response.content if getattr(block, "type", None) == "text"
        )
        return extract_json_object(text)

