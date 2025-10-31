import json

from django.contrib.auth import authenticate, login
from django.contrib.contenttypes.models import ContentType
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import ensure_csrf_cookie


@method_decorator(ensure_csrf_cookie, name="dispatch")
class APILoginView(View):
    """
    API login view that works with JSON requests and session authentication.

    CSRF Protection:
    - This view uses @ensure_csrf_cookie to set the CSRF token cookie
    - Frontend must include the CSRF token in the X-CSRFToken header
    - The CSRF token can be read from the 'csrftoken' cookie

    GET request returns the CSRF token for the frontend to use in subsequent requests.
    POST request performs the login.
    """

    def get(self, request):
        """
        Return CSRF token for the frontend.
        This allows the frontend to get a CSRF token before attempting login.
        """
        return JsonResponse(
            {
                "success": True,
                "csrfToken": get_token(request),
            }
        )

    def post(self, request):
        try:
            data = json.loads(request.body)
            username = data.get("username")
            password = data.get("password")

            if not username or not password:
                return JsonResponse(
                    {"success": False, "error": "Username and password are required"},
                    status=400,
                )

            user = authenticate(request, username=username, password=password)

            if user is not None:
                login(request, user)
                # Get CSRF token for subsequent requests
                csrf_token = get_token(request)
                return JsonResponse(
                    {
                        "success": True,
                        "message": "Login successful",
                        "csrfToken": csrf_token,
                        "user": {
                            "id": user.id,
                            "username": user.username,
                            "email": user.email,
                            "is_superuser": user.is_superuser,
                        },
                    }
                )
            else:
                return JsonResponse(
                    {"success": False, "error": "Invalid username or password"},
                    status=401,
                )

        except json.JSONDecodeError:
            return JsonResponse(
                {"success": False, "error": "Invalid JSON data"}, status=400
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=500)


class APILogoutView(View):
    """
    API logout view.

    CSRF Protection:
    - This view requires CSRF token in the X-CSRFToken header
    - The CSRF token should be obtained from the login response or 'csrftoken' cookie
    """

    def post(self, request):
        from django.contrib.auth import logout

        logout(request)
        return JsonResponse({"success": True, "message": "Logout successful"})


def content_types_view(request):
    """
    API endpoint to get ContentType mapping for frontend.
    Returns ContentTypes for schemes, providers, and medical_catalog apps.
    """
    content_types = ContentType.objects.filter(
        app_label__in=['schemes', 'providers', 'medical_catalog']
    ).values('id', 'app_label', 'model')
    
    return JsonResponse(list(content_types), safe=False)
