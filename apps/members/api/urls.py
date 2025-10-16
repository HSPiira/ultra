from rest_framework.routers import DefaultRouter

from apps.members.api.views.person_views import PersonViewSet

router = DefaultRouter()
router.register(r"persons", PersonViewSet, basename="person")

urlpatterns = router.urls
