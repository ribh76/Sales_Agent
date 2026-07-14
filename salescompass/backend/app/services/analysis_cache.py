import hashlib
import json

from app.cache.redis import get_json, set_json
from app.core.config import settings
from app.schemas.analysis import AnalysisResult
from app.schemas.company import CompanyCreate
from app.services.analysis_pipeline import run_icp_analysis


def run_cached_icp_analysis(company: CompanyCreate, use_llm: bool = True) -> AnalysisResult:
    cache_key = _analysis_cache_key(company, use_llm)
    cached = get_json(cache_key)
    if cached is not None:
        return AnalysisResult.model_validate(cached)

    result = run_icp_analysis(company, use_llm=use_llm)
    set_json(cache_key, result.model_dump(mode="json"), settings.cache_ttl_seconds)
    return result


def _analysis_cache_key(company: CompanyCreate, use_llm: bool) -> str:
    payload = {
        "company": company.model_dump(mode="json"),
        "use_llm": use_llm,
    }
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()
    return f"icp_analysis:v1:{digest}"
