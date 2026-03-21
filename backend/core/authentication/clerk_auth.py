import requests
import jwt as pyjwt
from jose import jwt
from rest_framework import authentication, exceptions
from django.conf import settings
from django.core.cache import cache


class ClerkAuthentication(authentication.BaseAuthentication):
    """
    DRF authentication backend that validates Clerk-issued JWTs via JWKS.
    Injects a lightweight SimpleClerkUser into request.user.
    """
    JWKS_CACHE_KEY = "clerk_jwks_cache"
    JWKS_CACHE_TTL_SECONDS = 3600

    def authenticate(self, request):
        auth_header = authentication.get_authorization_header(request).split()

        if not auth_header or auth_header[0].lower() != b"bearer":
            return None

        if len(auth_header) != 2:
            raise exceptions.AuthenticationFailed("Invalid token header.")

        token = auth_header[1].decode()

        if token.startswith("custom_admin_"):
            return self._validate_admin_token(token[13:])

        return self._validate_token(token)

    def _validate_admin_token(self, token):
        try:
            payload = pyjwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except pyjwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed("Admin token expired. Please log in again.")
        except pyjwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed("Invalid admin token.")
            
        user = SimpleClerkUser(payload["sub"], payload)
        user._resolved_role = "admin"
        return (user, None)

    def _validate_token(self, token):
        if not settings.CLERK_JWKS_URL:
            raise exceptions.AuthenticationFailed("Clerk JWKS URL not configured.")

        jwks = cache.get(self.JWKS_CACHE_KEY)
        if jwks is None:
            try:
                jwks = requests.get(settings.CLERK_JWKS_URL, timeout=5).json()
                cache.set(self.JWKS_CACHE_KEY, jwks, timeout=self.JWKS_CACHE_TTL_SECONDS)
            except Exception:
                raise exceptions.AuthenticationFailed("Failed to fetch JWKS.")

        try:
            payload = jwt.decode(
                token,
                jwks,
                algorithms=["RS256"],
                issuer=settings.CLERK_ISSUER,
                options={"verify_aud": False},
            )
        except Exception as e:
            raise exceptions.AuthenticationFailed(f"Token validation failed: {str(e)}")

        user_id = payload.get("sub") or payload.get("user_id")
        if not user_id:
            raise exceptions.AuthenticationFailed("Token missing user identifier.")

        user = SimpleClerkUser(user_id, payload)
        return (user, None)

    def authenticate_header(self, request):
        return "Bearer"


class SimpleClerkUser:
    """Lightweight user object injected from Clerk JWT payload."""

    def __init__(self, user_id: str, payload: dict):
        self.id = user_id
        self.pk = user_id
        self.payload = payload
        self._resolved_role = None
        self.is_authenticated = True
        self.is_anonymous = False

    @property
    def role(self):
        if self._resolved_role is not None:
            return self._resolved_role

        fallback = self.payload.get("public_metadata", {}).get("role", "buyer")
        try:
            from apps.users.models import UserProfile

            profile = UserProfile.objects.filter(user_id=self.id).only("role").first()
            if profile:
                self._resolved_role = profile.role
            else:
                # First time accessing - create profile with buyer role
                profile, created = UserProfile.objects.get_or_create(
                    user_id=self.id,
                    defaults={"role": "buyer"}
                )
                self._resolved_role = profile.role if not created else "buyer"
        except Exception as e:
            import sys
            print(f"[Auth] Error resolving role for {self.id}: {e}", file=sys.stderr)
            self._resolved_role = fallback
        return self._resolved_role

    @property
    def is_vendor(self):
        return self.role == "vendor"

    @property
    def is_admin(self):
        return self.role == "admin"

    def __str__(self):
        return self.id
