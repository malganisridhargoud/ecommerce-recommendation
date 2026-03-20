from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """Standardize error response shape across all API endpoints."""
    response = exception_handler(exc, context)

    if response is not None:
        response.data = {
            "success": False,
            "error": response.data,
            "status_code": response.status_code,
        }
    return response


def success_response(data, status_code=status.HTTP_200_OK):
    return Response({"success": True, "data": data}, status=status_code)


def error_response(message, status_code=status.HTTP_400_BAD_REQUEST):
    return Response({"success": False, "error": message}, status=status_code)