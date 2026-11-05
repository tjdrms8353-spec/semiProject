from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    app_env: str = "development"
    frontend_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    database_url: str = ""
    secret_key: str = "development-only-change-me"
    access_token_expire_minutes: int = Field(default=30, ge=1, le=1440)
    collection_interval_hours: int = 12

    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    @property
    def auth_configured(self) -> bool:
        return len(self.secret_key.encode("utf-8")) >= 32 and self.secret_key not in {
            "development-only-change-me", "replace-with-a-long-random-value"
        }


settings = Settings()
