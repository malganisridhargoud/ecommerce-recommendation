import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-secret-key-change-in-production")
DEBUG = os.getenv("DEBUG", "True") == "True"


def env_list(name, default=""):
    raw = os.getenv(name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "*" if DEBUG else "")
if not ALLOWED_HOSTS:
    ALLOWED_HOSTS = ["localhost", "127.0.0.1"] if DEBUG else []

INSTALLED_APPS = [
    "daphne",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "channels",
    "rest_framework",
    "corsheaders",
    "apps.users",
    "apps.vendors",
    "apps.equipment",
    "apps.bookings",
    "apps.payments",
    "apps.subscriptions",
    "apps.recommendations",
    "apps.analytics",
    "apps.communications",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "core.middleware.logging_middleware.RequestLoggingMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# Database — MySQL (reads from .env) with SQLite fallback
_db_name = os.getenv("DB_NAME", "")
if _db_name:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "NAME": _db_name,
            "USER": os.getenv("DB_USER", "root"),
            "PASSWORD": os.getenv("DB_PASSWORD", ""),
            "HOST": os.getenv("DB_HOST", "localhost"),
            "PORT": os.getenv("DB_PORT", "3306"),
            "OPTIONS": {
                "charset": "utf8mb4",
                "init_command": "SET sql_mode='STRICT_TRANS_TABLES'",
            },
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "core.authentication.clerk_auth.ClerkAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "EXCEPTION_HANDLER": "core.utils.helpers.custom_exception_handler",
}

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "taprent-local-cache",
    }
}

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
    },
    "loggers": {
        "request_logger": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}

cors_origins_raw = os.getenv("CORS_ALLOWED_ORIGINS", "")
if cors_origins_raw.strip():
    CORS_ALLOWED_ORIGINS = [origin.strip() for origin in cors_origins_raw.split(",") if origin.strip()]
else:
    CORS_ALLOWED_ORIGINS = list(
        {
            os.getenv("FRONTEND_URL", "http://localhost:3000").strip(),
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        }
    )
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS", ",".join(CORS_ALLOWED_ORIGINS))

# Stripe
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
STRIPE_PRICE_ID = os.getenv("STRIPE_PRICE_ID", "")
STRIPE_CURRENCY = os.getenv("STRIPE_CURRENCY", "inr")
REQUIRE_VENDOR_SUBSCRIPTION = os.getenv("REQUIRE_VENDOR_SUBSCRIPTION", "True") == "True"

# Clerk
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL", "")
CLERK_ISSUER = os.getenv("CLERK_ISSUER", "")
CLERK_WEBHOOK_SECRET = os.getenv("CLERK_WEBHOOK_SECRET", "")
CLERK_WEBHOOK_SECRET = os.getenv("CLERK_WEBHOOK_SECRET", "")

# Redis Cache (optional - falls back to local memory if not available)
REDIS_URL = os.getenv("REDIS_URL", "")
if REDIS_URL:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {
                "CLIENT_CLASS": "django.core.cache.backends.redis.RedisClient",
            },
            "KEY_PREFIX": "taprent",
            "TIMEOUT": 300,  # 5 minutes default
        }
    }

# Frontend URL for redirects
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

USE_X_FORWARDED_HOST = os.getenv("USE_X_FORWARDED_HOST", "True") == "True"
USE_X_FORWARDED_PORT = os.getenv("USE_X_FORWARDED_PORT", "True") == "True"
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "False") == "True"
SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "False") == "True"
CSRF_COOKIE_SECURE = os.getenv("CSRF_COOKIE_SECURE", "False") == "True"
SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "0") or 0)
SECURE_HSTS_INCLUDE_SUBDOMAINS = os.getenv("SECURE_HSTS_INCLUDE_SUBDOMAINS", "False") == "True"
SECURE_HSTS_PRELOAD = os.getenv("SECURE_HSTS_PRELOAD", "False") == "True"

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    }
}

if REDIS_URL:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {"hosts": [REDIS_URL]},
        }
    }
