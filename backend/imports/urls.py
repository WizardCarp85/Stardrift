from django.urls import path
from imports.views import FileImportView

urlpatterns = [
    path("", FileImportView.as_view(), name="file-import"),
]

