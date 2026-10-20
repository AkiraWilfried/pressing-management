from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./pressing.db"
    SECRET_KEY: str = "pressing-secret-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # Seed du premier compte — à changer via .env dès la mise en production
    SUPERADMIN_EMAIL: str = "superadmin@pressing.cm"
    SUPERADMIN_PASSWORD: str = "super123"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
