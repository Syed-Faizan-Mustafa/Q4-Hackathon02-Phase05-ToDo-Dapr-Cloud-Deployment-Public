"""Application configuration using Pydantic Settings."""

import re
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Database
    database_url: str

    # JWT Authentication (RS256) - Optional, for backwards compatibility
    # Now using session-based auth with Better Auth
    jwt_public_key: str | None = None
    jwt_algorithm: str = "RS256"
    jwt_issuer: str | None = None

    # CORS
    frontend_url: str = "http://localhost:3000"

    # Rate Limiting
    rate_limit_per_minute: int = 100

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False

    # Dapr
    dapr_url: str = "http://localhost:3500"
    pubsub_name: str = "kafka-pubsub"

    @property
    def async_database_url(self) -> str:
        """Ensure database URL uses asyncpg driver with proper SSL config.

        asyncpg doesn't accept sslmode parameter - it uses ssl=require instead.
        Also removes channel_binding which asyncpg doesn't support.
        """
        url = self.database_url

        # Replace driver
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

        # Convert sslmode=require to ssl=require for asyncpg
        url = re.sub(r'[?&]sslmode=\w+', '', url)
        url = re.sub(r'[?&]channel_binding=\w+', '', url)

        # Add ssl=require if connecting to Neon (requires SSL)
        if 'neon.tech' in url:
            separator = '&' if '?' in url else '?'
            url = f"{url}{separator}ssl=require"

        return url


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
