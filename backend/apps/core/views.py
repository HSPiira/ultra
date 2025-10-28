import json

from django.contrib.auth import authenticate, login
from django.contrib.contenttypes.models import ContentType
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt


@method_decorator(csrf_exempt, name="dispatch")
class APILoginView(View):
    """
    API login view that works with JSON requests and session authentication.
    """

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
                return JsonResponse(
                    {
                        "success": True,
                        "message": "Login successful",
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


@method_decorator(csrf_exempt, name="dispatch")
class APILogoutView(View):
    """
    API logout view.
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
