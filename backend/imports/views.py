"""
Views for file text extraction and preview in Stardrift.
"""
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from dreams.models import UserProfile
from imports.extractors import extract_text, ExtractionError
from imports.serializers import FileImportUploadSerializer, FileImportResponseSerializer
from imports.throttles import ImportRateThrottle


class FileImportView(APIView):
    """
    POST /api/import/
    Extracts text, guesses title and date from .txt, .docx, or .pdf files.
    Returns preview data without persisting anything to the database.
    """
    parser_classes = [MultiPartParser]
    permission_classes = [IsAuthenticated]
    throttle_classes = [ImportRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = FileImportUploadSerializer(data=request.data)
        if not serializer.is_valid():
            # Format error response according to spec: {"error": ..., "code": ...}
            first_err = serializer.errors.get("file", [])
            code = "no_file"
            message = "No file was uploaded."

            if first_err:
                detail = first_err[0]
                message = str(detail)
                code = getattr(detail, "code", "invalid_upload")
                if code in ("required", "null"):
                    code = "no_file"
                elif code == "empty":
                    code = "empty_file"
            elif "error" in serializer.errors:
                message = str(serializer.errors["error"][0])
                code = getattr(serializer.errors["error"][0], "code", "invalid_upload")

            return Response(
                {"error": message, "code": code},
                status=status.HTTP_400_BAD_REQUEST,
            )

        uploaded_file = serializer.validated_data["file"]

        # Resolve user date_format preference if available
        user_date_format = "locale"
        try:
            user_id = getattr(request.user, "id", None) or getattr(request.user, "pk", None)
            if user_id:
                profile = UserProfile.objects.filter(supabase_id=str(user_id)).first()
                if profile and profile.date_format:
                    user_date_format = profile.date_format
        except Exception:
            user_date_format = "locale"

        try:
            preview_data = extract_text(
                uploaded_file,
                uploaded_file.name,
                user_date_format=user_date_format,
            )
        except ExtractionError as e:
            return Response(
                {"error": e.message, "code": e.code},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception:
            return Response(
                {
                    "error": "Could not extract text from this file. Ensure it is a valid, uncorrupted document.",
                    "code": "extraction_failed",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        finally:
            try:
                uploaded_file.close()
            except Exception:
                pass

        resp_serializer = FileImportResponseSerializer(preview_data)
        return Response(resp_serializer.data, status=status.HTTP_200_OK)
