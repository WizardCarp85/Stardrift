from django.urls import path, include
from django.http import JsonResponse


def root_status(request):
    return JsonResponse({
        "status": "ok",
        "service": "stardrift-backend",
        "health": "/api/health/",
    })


urlpatterns = [
    path("", root_status, name="root-status"),
    path("api/", include("dreams.urls")),
    path("api/import/", include("imports.urls")),
]

