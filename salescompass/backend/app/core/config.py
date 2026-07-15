from functools import cached_property

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "SalesCompass"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "postgresql+psycopg://Sales_Compass_admin:ADMIN@localhost:5433/SalesCompass"
    secret_key: str = Field(min_length=32)
    access_token_expire_minutes: int = 60 * 24
    algorithm: str = "HS256"
    anthropic_api_key: str | None = None
    anthropic_model: str = "claude-3-5-sonnet-latest"
    cors_origins: str = Field(default="http://localhost:3000")
    redis_url: str | None = "redis://localhost:6379/0"
    cache_ttl_seconds: int = 60 * 60 * 24

    @cached_property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"


settings = Settings()
