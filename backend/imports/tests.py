"""
Tests for the file import app in Stardrift.
Verifies file extraction, validation, title/date guessing, rate limiting, and zero DB writes.
"""
import io
import uuid
import datetime
from django.core.cache import cache
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status

import docx
import pypdf

from dreams.models import Dream, UserProfile
from dreams.authentication import SupabaseUser


def create_minimal_text_pdf(text: str) -> bytes:
    """Creates a minimal valid PDF containing readable text."""
    content_obj = f"BT /F1 12 Tf 50 250 Td ({text}) Tj ET"
    content_bytes = f"5 0 obj\n<< /Length {len(content_obj.encode('utf-8'))} >>\nstream\n{content_obj}\nendstream\nendobj\n".encode("utf-8")
    pdf_content = (
        b"%PDF-1.4\n"
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n"
        b"4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
        + content_bytes
        + b"xref\n0 6\n0000000000 65535 f \n"
        b"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n500\n%%EOF"
    )
    return pdf_content


def create_docx_bytes(paragraphs: list, tables: list = None) -> bytes:
    """Creates a valid in-memory DOCX byte string."""
    doc = docx.Document()
    for p in paragraphs:
        doc.add_paragraph(p)
    if tables:
        for t in tables:
            table = doc.add_table(rows=len(t), cols=len(t[0]))
            for r_idx, row_data in enumerate(t):
                for c_idx, cell_data in enumerate(row_data):
                    table.rows[r_idx].cells[c_idx].text = str(cell_data)
    bio = io.BytesIO()
    doc.save(bio)
    return bio.getvalue()


class FileImportAPITests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.user_id = f"test-user-{uuid.uuid4()}"
        self.user_email = f"{self.user_id}@stardrift.app"
        self.user = SupabaseUser({
            "sub": self.user_id,
            "email": self.user_email,
            "aud": "authenticated",
            "role": "authenticated",
        })
        self.profile, _ = UserProfile.objects.get_or_create(
            supabase_id=self.user_id,
            defaults={"email": self.user_email, "date_format": "locale"},
        )
        self.client.force_authenticate(user=self.user)

    def test_unauthenticated_request_rejected(self):
        """Unauthenticated requests must be rejected with 401 or 403."""
        anon_client = APIClient()
        file = SimpleUploadedFile("test.txt", b"Hello dream", content_type="text/plain")
        response = anon_client.post("/api/import/", {"file": file}, format="multipart")
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_valid_txt_extraction(self):
        """Valid .txt file returns 200 with extracted text and guessed metadata."""
        content = (
            "Night Flying Over City\n"
            "2026-03-05\n"
            "I could soar above the skyscrapers effortlessly."
        ).encode("utf-8")
        file = SimpleUploadedFile("my_dream.txt", content, content_type="text/plain")

        response = self.client.post("/api/import/", {"file": file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["title"], "Night Flying Over City")
        self.assertEqual(data["date"], "2026-03-05")
        self.assertEqual(data["source"], "txt")
        self.assertEqual(data["filename"], "my_dream.txt")
        self.assertIn("skyscrapers effortlessly", data["body"])
        self.assertNotIn("Night Flying Over City", data["body"])  # removed title line
        self.assertFalse(data["truncated"])

    def test_valid_docx_extraction(self):
        """Valid .docx file returns 200 with extracted paragraphs and tables."""
        docx_data = create_docx_bytes(
            paragraphs=["Forest of Whispers", "The trees were glowing in blue."],
            tables=[[["Lucid", "High Lucidity"]]],
        )
        file = SimpleUploadedFile("journal.docx", docx_data, content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")

        response = self.client.post("/api/import/", {"file": file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["title"], "Forest of Whispers")
        self.assertEqual(data["source"], "docx")
        self.assertIn("The trees were glowing in blue.", data["body"])
        self.assertIn("Lucid | High Lucidity", data["body"])

    def test_valid_pdf_extraction(self):
        """Valid .pdf file returns 200 with extracted text."""
        pdf_data = create_minimal_text_pdf("A Journey to Saturn")
        file = SimpleUploadedFile("saturn.pdf", pdf_data, content_type="application/pdf")

        response = self.client.post("/api/import/", {"file": file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["title"], "A Journey to Saturn")
        self.assertEqual(data["source"], "pdf")
        self.assertEqual(data["filename"], "saturn.pdf")

    def test_disallowed_extension_rejected(self):
        """Disallowed extensions like .png or .exe must return 400 with invalid_extension."""
        file = SimpleUploadedFile("avatar.png", b"\x89PNG\r\n\x1a\nfake", content_type="image/png")
        response = self.client.post("/api/import/", {"file": file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertEqual(data.get("code"), "invalid_extension")

    def test_spoofed_pdf_rejected(self):
        """Fake PDF (plain text renamed to .pdf) must return 400 with invalid_file_type."""
        file = SimpleUploadedFile("fake.pdf", b"Not a real PDF header", content_type="application/pdf")
        response = self.client.post("/api/import/", {"file": file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertEqual(data.get("code"), "invalid_file_type")

    def test_spoofed_docx_rejected(self):
        """Fake DOCX (not a zip with word/document.xml) must return 400 with invalid_file_type."""
        file = SimpleUploadedFile("fake.docx", b"Just some random binary bytes 12345", content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        response = self.client.post("/api/import/", {"file": file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertEqual(data.get("code"), "invalid_file_type")

    def test_binary_named_txt_rejected(self):
        """Binary file containing null bytes renamed to .txt must return 400 with invalid_file_type."""
        file = SimpleUploadedFile("binary.txt", b"Hello\x00\x01\x02World", content_type="text/plain")
        response = self.client.post("/api/import/", {"file": file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertEqual(data.get("code"), "invalid_file_type")

    def test_empty_file_rejected(self):
        """Zero-byte file must return 400 with empty_file code."""
        file = SimpleUploadedFile("empty.txt", b"", content_type="text/plain")
        response = self.client.post("/api/import/", {"file": file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertEqual(data.get("code"), "empty_file")

    def test_file_over_5mb_rejected(self):
        """File larger than 5 MB must return 400 with file_too_large code."""
        large_content = b"A" * (5 * 1024 * 1024 + 1)
        file = SimpleUploadedFile("large.txt", large_content, content_type="text/plain")
        response = self.client.post("/api/import/", {"file": file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertEqual(data.get("code"), "file_too_large")

    def test_scanned_pdf_returns_no_text_found(self):
        """Scanned/blank PDF with no text returns 400 with no_text_found."""
        writer = pypdf.PdfWriter()
        writer.add_blank_page(width=200, height=200)
        bio = io.BytesIO()
        writer.write(bio)

        file = SimpleUploadedFile("scanned.pdf", bio.getvalue(), content_type="application/pdf")
        response = self.client.post("/api/import/", {"file": file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertEqual(data.get("code"), "no_text_found")
        self.assertIn("scanned", data.get("error", "").lower())

    def test_encrypted_pdf_returns_pdf_encrypted(self):
        """Encrypted PDF returns 400 with pdf_encrypted."""
        writer = pypdf.PdfWriter()
        writer.add_blank_page(width=200, height=200)
        writer.encrypt("mypassword")
        bio = io.BytesIO()
        writer.write(bio)

        file = SimpleUploadedFile("locked.pdf", bio.getvalue(), content_type="application/pdf")
        response = self.client.post("/api/import/", {"file": file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertEqual(data.get("code"), "pdf_encrypted")

    def test_title_and_date_guessing(self):
        """Tests deterministic guessing of title, period in title, and date handling."""
        # Case 1: First line has period -> title should be filename stem, first line stays in body
        content_with_period = "This sentence ends with a period.\nDream body continues here."
        file1 = SimpleUploadedFile("lucid_ocean.txt", content_with_period.encode("utf-8"), content_type="text/plain")
        resp1 = self.client.post("/api/import/", {"file": file1}, format="multipart")
        self.assertEqual(resp1.status_code, status.HTTP_200_OK)
        d1 = resp1.json()
        self.assertEqual(d1["title"], "lucid_ocean")
        self.assertIn("This sentence ends with a period.", d1["body"])

        # Case 2: Future date -> returns null
        future_content = "Future Dream\n2029-12-31\nDream body."
        file2 = SimpleUploadedFile("future.txt", future_content.encode("utf-8"), content_type="text/plain")
        resp2 = self.client.post("/api/import/", {"file": file2}, format="multipart")
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        d2 = resp2.json()
        self.assertIsNone(d2["date"])

        # Case 3: Written date e.g. 'March 5, 2026'
        written_date_content = "Ancient Temple\nMarch 5, 2026\nDeep inside the temple walls."
        file3 = SimpleUploadedFile("temple.txt", written_date_content.encode("utf-8"), content_type="text/plain")
        resp3 = self.client.post("/api/import/", {"file": file3}, format="multipart")
        self.assertEqual(resp3.status_code, status.HTTP_200_OK)
        d3 = resp3.json()
        self.assertEqual(d3["date"], "2026-03-05")

        # Case 4: Ambiguous numeric date with dmy vs mdy preference
        self.profile.date_format = "dmy"
        self.profile.save()
        dmy_content = "Ambiguous Date\n05/06/2024\nBody here."
        file4 = SimpleUploadedFile("ambig.txt", dmy_content.encode("utf-8"), content_type="text/plain")
        resp4 = self.client.post("/api/import/", {"file": file4}, format="multipart")
        self.assertEqual(resp4.json()["date"], "2024-06-05")  # June 5th

        self.profile.date_format = "mdy"
        self.profile.save()
        file5 = SimpleUploadedFile("ambig2.txt", dmy_content.encode("utf-8"), content_type="text/plain")
        resp5 = self.client.post("/api/import/", {"file": file5}, format="multipart")
        self.assertEqual(resp5.json()["date"], "2024-05-06")  # May 6th

    def test_no_database_writes(self):
        """Crucial requirement: The import endpoint must NOT save anything to the database."""
        initial_dream_count = Dream.objects.count()

        content = "My Unsaved Dream\n2026-03-05\nThis must not touch the database."
        file = SimpleUploadedFile("test_db.txt", content.encode("utf-8"), content_type="text/plain")
        response = self.client.post("/api/import/", {"file": file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertEqual(
            Dream.objects.count(),
            initial_dream_count,
            "Import endpoint must NOT write to the Dream table!",
        )

    def test_rate_limiting_ten_per_minute(self):
        """Basic rate limit: 10 imports per minute per user (11th throttled with 429)."""
        content = b"Simple dream text here\nMore lines."
        for _ in range(10):
            file = SimpleUploadedFile("rate.txt", content, content_type="text/plain")
            resp = self.client.post("/api/import/", {"file": file}, format="multipart")
            self.assertEqual(resp.status_code, status.HTTP_200_OK)

        file = SimpleUploadedFile("rate_over.txt", content, content_type="text/plain")
        throttled_resp = self.client.post("/api/import/", {"file": file}, format="multipart")
        self.assertEqual(throttled_resp.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
