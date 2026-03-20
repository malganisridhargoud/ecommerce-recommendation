from urllib.parse import parse_qs

from channels.db import database_sync_to_async

from .clerk_auth import ClerkAuthentication


@database_sync_to_async
def authenticate_token(token):
    auth = ClerkAuthentication()
    if token.startswith("custom_admin_"):
        return auth._validate_admin_token(token[13:])[0]
    return auth._validate_token(token)[0]


class ClerkAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token = (params.get("token") or [""])[0]
        scope["user"] = None

        if token:
            try:
                scope["user"] = await authenticate_token(token)
            except Exception:
                scope["user"] = None

        return await self.inner(scope, receive, send)


def ClerkAuthMiddlewareStack(inner):
    return ClerkAuthMiddleware(inner)
