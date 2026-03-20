import logging
import time


logger = logging.getLogger("request_logger")


class RequestLoggingMiddleware:
    """Logs method, path, status, duration and user for each request."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.perf_counter()
        response = self.get_response(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 2)

        user_id = "anonymous"
        if getattr(request, "user", None) is not None and getattr(request.user, "is_authenticated", False):
            user_id = getattr(request.user, "id", "unknown")

        logger.info(
            "method=%s path=%s status=%s duration_ms=%s user_id=%s",
            request.method,
            request.path,
            response.status_code,
            duration_ms,
            user_id,
        )
        return response
