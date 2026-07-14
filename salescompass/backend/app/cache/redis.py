import importlib
import json
from functools import lru_cache
from typing import Any

from app.core.config import settings


@lru_cache
def get_redis_client() -> Any | None:
    if not settings.redis_url:
        return None

    try:
        redis_module = importlib.import_module("redis")
        return redis_module.Redis.from_url(settings.redis_url, decode_responses=True)
    except Exception:
        return None


def get_json(key: str) -> Any | None:
    client = get_redis_client()
    if client is None:
        return None

    try:
        value = client.get(key)
    except Exception:
        return None

    return json.loads(value) if value else None


def set_json(key: str, value: Any, ttl_seconds: int | None = None) -> None:
    client = get_redis_client()
    if client is None:
        return

    try:
        client.set(key, json.dumps(value), ex=ttl_seconds)
    except Exception:
        return
