from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ProteccionDatos"
    environment: str = "local"
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 480
    database_url: str = "sqlite:///./sql_app.db"
    cors_origins: str = "*"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
