from pathlib import Path
from rest_framework import serializers
from imports.extractors import MAX_FILE_SIZE, ALLOWED_EXTENSIONS


class FileImportUploadSerializer(serializers.Serializer):
    file = serializers.FileField(
        required=True,
        allow_empty_file=False,
        error_messages={
            "required": "No file was uploaded.",
            "empty": "The uploaded file is empty.",
            "null": "No file was uploaded.",
        },
    )

    def validate_file(self, value):
        filename = getattr(value, "name", "")
        ext = Path(filename).suffix.lower()

        if ext not in ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                "Unsupported file type. Only .txt, .docx, and .pdf files are accepted.",
                code="invalid_extension",
            )

        if value.size > MAX_FILE_SIZE:
            raise serializers.ValidationError(
                "File size exceeds the 5 MB limit.",
                code="file_too_large",
            )

        if value.size == 0:
            raise serializers.ValidationError(
                "The uploaded file is empty.",
                code="empty_file",
            )

        return value


class FileImportResponseSerializer(serializers.Serializer):
    title = serializers.CharField(allow_blank=True)
    body = serializers.CharField(allow_blank=True)
    date = serializers.CharField(allow_null=True)
    source = serializers.CharField()
    filename = serializers.CharField()
    truncated = serializers.BooleanField(default=False)
    warnings = serializers.ListField(child=serializers.CharField(), default=list)

