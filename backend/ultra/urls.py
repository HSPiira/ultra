"""
URL configuration for ultra project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework.routers import DefaultRouter

from apps.claims.api.urls import router as claims_router
from apps.companies.api.urls import router as companies_router
from apps.core.views import APILoginView, APILogoutView, content_types_view
from apps.medical_catalog.api.urls import router as medical_catalog_router
from apps.members.api.urls import router as members_router
from apps.providers.api.urls import router as providers_router
from apps.schemes.api.urls import router as schemes_router

router = DefaultRouter()
router.registry.extend(companies_router.registry)
router.registry.extend(schemes_router.registry)
router.registry.extend(members_router.registry)
router.registry.extend(providers_router.registry)
router.registry.extend(medical_catalog_router.registry)
router.registry.extend(claims_router.registry)

urlpatterns = [
    path("admin/", admin.site.urls),
    # API v1 routes with versioning
    path("api/v1/auth/login/", APILoginView.as_view(), name="api_login"),
    path("api/v1/auth/logout/", APILogoutView.as_view(), name="api_logout"),
    path("api/v1/content-types/", content_types_view, name="content_types"),
    path("api/v1/", include(router.urls)),
    # OpenAPI schema and docs
    path("api/v1/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/v1/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path("api/v1/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    # Legacy routes (backward compatibility - redirect to v1)
    path("api/login/", APILoginView.as_view(), name="api_login_legacy"),
    path("api/logout/", APILogoutView.as_view(), name="api_logout_legacy"),
    path("content-types/", content_types_view, name="content_types_legacy"),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema_legacy"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui-legacy"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc_legacy"),
    path("", include(router.urls)),  # Legacy unversioned routes
]
