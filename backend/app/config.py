import os
from datetime import timedelta


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "replace-with-secure-key")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///data/app.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "replace-with-jwt-secret")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)

    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "backend/app/static/uploads")
    MAX_CONTENT_LENGTH = 8 * 1024 * 1024  # 8 MB file upload limit

    GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY", "")
    LOCATION_DEFAULT_RADIUS = int(os.getenv("LOCATION_DEFAULT_RADIUS", 5000))

    # Logging configuration
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_DIR = os.getenv("LOG_DIR", "logs")

    # Rate limiting configuration
    RATELIMIT_ENABLED = os.getenv("RATELIMIT_ENABLED", "true").lower() == "true"
    RATELIMIT_DEFAULT = os.getenv("RATELIMIT_DEFAULT", "100/60")  # 100 per minute

    # Input validation
    MAX_STRING_LENGTH = int(os.getenv("MAX_STRING_LENGTH", 1000))
    MAX_PASSWORD_LENGTH = int(os.getenv("MAX_PASSWORD_LENGTH", 128))
    MIN_PASSWORD_LENGTH = int(os.getenv("MIN_PASSWORD_LENGTH", 8))


class DevelopmentConfig(Config):
    ENV = "development"
    DEBUG = True
    LOG_LEVEL = "DEBUG"


class ProductionConfig(Config):
    ENV = "production"
    DEBUG = False
    LOG_LEVEL = "INFO"
