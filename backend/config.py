from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    from pydantic import Field
    supabase_url: str = Field(default="", env=None)
    supabase_anon_key: str = Field(default="", env=None)
    supabase_service_role_key: str = Field(default="", env=None)
    environment: str = "development"
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
