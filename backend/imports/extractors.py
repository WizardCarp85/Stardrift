"""
File text extractors and helpers for Stardrift.
Supports .txt, .docx, and .pdf with validation, security checks, and deterministic guessing.
"""
import calendar
import datetime
import io
import os
import re
import zipfile
from pathlib import Path
from typing import Optional, Tuple, List, Dict, Any

import charset_normalizer
import docx
import pypdf

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
MAX_BODY_LENGTH = 50000  # Safe upper bound for dream body
MAX_PDF_PAGES = 30
ALLOWED_EXTENSIONS = {".txt", ".docx", ".pdf"}


class ExtractionError(Exception):
    """Custom extraction error with user-friendly message and machine code."""

    def __init__(self, message: str, code: str):
        super().__init__(message)
        self.message = message
        self.code = code


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal or unsafe characters."""
    base = os.path.basename(filename or "uploaded_file")
    cleaned = re.sub(r'[\r\n\t\x00]', '', base).strip()
    return cleaned or "uploaded_file"


def verify_file_type(file_obj, extension: str) -> None:
    """
    Verify real file magic bytes / signatures to prevent extension spoofing.
    """
    ext = extension.lower()
    file_obj.seek(0)
    sample = file_obj.read(2048)
    file_obj.seek(0)

    if not sample:
        raise ExtractionError("The uploaded file is empty.", "empty_file")

    if ext == ".pdf":
        # Standard PDF files start with %PDF within the first 1024 bytes
        if b"%PDF" not in sample[:1024]:
            raise ExtractionError("File content does not match a valid PDF document.", "invalid_file_type")

    elif ext == ".docx":
        # A valid docx is a ZIP archive containing word/document.xml
        if not zipfile.is_zipfile(file_obj):
            file_obj.seek(0)
            raise ExtractionError("File content does not match a valid Word (.docx) document.", "invalid_file_type")
        file_obj.seek(0)
        try:
            with zipfile.ZipFile(file_obj) as zf:
                namelist = zf.namelist()
                if "word/document.xml" not in namelist:
                    raise ExtractionError("File content does not match a valid Word (.docx) document.", "invalid_file_type")
        except zipfile.BadZipFile:
            raise ExtractionError("File content does not match a valid Word (.docx) document.", "invalid_file_type")
        finally:
            file_obj.seek(0)

    elif ext == ".txt":
        # Plain text must not look like binary (no null bytes in sample)
        if b"\x00" in sample:
            raise ExtractionError("File content does not match a valid plain text document.", "invalid_file_type")


def clean_text(raw_text: str) -> str:
    """
    Normalize line endings, remove control characters, collapse 3+ blank lines to 2, and trim.
    """
    if not raw_text:
        return ""

    # Normalize line endings
    text = raw_text.replace("\r\n", "\n").replace("\r", "\n")

    # Strip null bytes & control chars except standard whitespace (\n, \t)
    text = "".join(
        ch for ch in text
        if ch in ("\n", "\t") or (ord(ch) >= 32 and ord(ch) != 127)
    )

    # Collapse 3+ consecutive newlines to 2
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def extract_txt(file_obj) -> str:
    """Extract and decode plain text with fallback encodings."""
    file_obj.seek(0)
    raw_bytes = file_obj.read()
    if not raw_bytes:
        raise ExtractionError("The uploaded file is empty.", "empty_file")

    # 1. Try UTF-8
    try:
        text = raw_bytes.decode("utf-8")
    except UnicodeDecodeError:
        # 2. Try charset-normalizer
        try:
            detected = charset_normalizer.from_bytes(raw_bytes).best()
            if detected and detected.encoding:
                text = raw_bytes.decode(detected.encoding, errors="replace")
            else:
                text = raw_bytes.decode("latin-1", errors="replace")
        except Exception:
            # 3. Fallback to latin-1
            text = raw_bytes.decode("latin-1", errors="replace")

    # Strip null bytes
    return text.replace("\x00", "")


def extract_docx(file_obj) -> str:
    """Extract paragraphs and table text from a docx file."""
    file_obj.seek(0)
    try:
        doc = docx.Document(file_obj)
    except Exception as e:
        raise ExtractionError("Could not read Word (.docx) document.", "extraction_failed") from e

    lines: List[str] = []

    # Read paragraphs
    for p in doc.paragraphs:
        if p.text:
            lines.append(p.text)

    # Read table cells
    for table in doc.tables:
        for row in table.rows:
            row_items = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if row_items:
                lines.append(" | ".join(row_items))

    return "\n".join(lines)


def extract_pdf(file_obj) -> Tuple[str, List[str]]:
    """Extract text page-by-page from a PDF, checking encryption, scanned PDFs, and page caps."""
    file_obj.seek(0)
    warnings: List[str] = []

    try:
        reader = pypdf.PdfReader(file_obj)
    except Exception as e:
        raise ExtractionError("Could not read PDF document.", "extraction_failed") from e

    if reader.is_encrypted:
        raise ExtractionError("This PDF is password protected.", "pdf_encrypted")

    total_pages = len(reader.pages)
    if total_pages == 0:
        raise ExtractionError("The PDF document has no pages.", "empty_file")

    if total_pages > MAX_PDF_PAGES:
        pages_to_process = reader.pages[:MAX_PDF_PAGES]
        warnings.append(f"Only the first {MAX_PDF_PAGES} pages were imported.")
    else:
        pages_to_process = reader.pages

    extracted_pages: List[str] = []
    for page in pages_to_process:
        try:
            page_text = page.extract_text() or ""
            if page_text.strip():
                extracted_pages.append(page_text.strip())
        except Exception:
            # Continue extracting remaining pages if a page has minor font/rendering error
            continue

    if not extracted_pages:
        raise ExtractionError(
            "No text found. This looks like a scanned PDF. Scanned files are not supported yet.",
            "no_text_found",
        )

    full_text = "\n\n".join(extracted_pages)
    return full_text, warnings


def guess_title(text: str, filename: str) -> Tuple[str, str]:
    """
    First non-empty line if under 80 characters and has no ending period.
    Otherwise use the filename without extension.
    If the title is taken from the first line, remove that line from the body.
    """
    lines = text.split("\n")
    first_non_empty_idx = -1

    for idx, line in enumerate(lines):
        if line.strip():
            first_non_empty_idx = idx
            break

    if first_non_empty_idx != -1:
        candidate = lines[first_non_empty_idx].strip()
        # Condition: under 80 chars, no ending period
        if len(candidate) < 80 and not candidate.endswith("."):
            title = candidate
            remaining_lines = lines[:first_non_empty_idx] + lines[first_non_empty_idx + 1:]
            updated_body = "\n".join(remaining_lines).strip()
            return title, updated_body

    # Fallback to filename without extension
    clean_stem = Path(filename).stem.strip()
    title = clean_stem[:500] if clean_stem else "Imported Dream"
    return title, text


MONTH_NAME_TO_INT = {
    "january": 1, "jan": 1,
    "february": 2, "feb": 2,
    "march": 3, "mar": 3,
    "april": 4, "apr": 4,
    "may": 5,
    "june": 6, "jun": 6,
    "july": 7, "jul": 7,
    "august": 8, "aug": 8,
    "september": 9, "sep": 9, "sept": 9,
    "october": 10, "oct": 10,
    "november": 11, "nov": 11,
    "december": 12, "dec": 12,
}


def _safe_date(year: int, month: int, day: int) -> Optional[datetime.date]:
    """Helper to validate date and ensure it is not in the future."""
    try:
        d = datetime.date(year, month, day)
        if d > datetime.date.today():
            return None
        return d
    except (ValueError, OverflowError):
        return None


def guess_date(text: str, user_date_format: str = "locale") -> Optional[str]:
    """
    Look for a date in the first 3 lines (YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, 'March 5, 2026').
    Uses the user's date-format setting to resolve ambiguity.
    Never returns a future date. If unsure, returns None.
    """
    if not text:
        return None

    # Check the first 3 lines of text
    candidate_lines = [line.strip() for line in text.split("\n")[:3] if line.strip()]
    search_block = "  ".join(candidate_lines)

    # 1. ISO format: YYYY-MM-DD or YYYY/MM/DD
    iso_pattern = re.compile(r'\b(19\d\d|20\d\d)[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b')
    iso_match = iso_pattern.search(search_block)
    if iso_match:
        y, m, d = int(iso_match.group(1)), int(iso_match.group(2)), int(iso_match.group(3))
        dt = _safe_date(y, m, d)
        if dt:
            return dt.isoformat()

    # 2. Written month: "March 5, 2026", "March 5th 2026", "5 March 2026", "5th of March, 2026"
    month_names = "|".join(MONTH_NAME_TO_INT.keys())
    # Format: Month Day, Year
    mdy_named = re.compile(
        rf'\b({month_names})\s+(\d{{1,2}})(?:st|nd|rd|th)?(?:,)?\s+(\d{{4}})\b',
        re.IGNORECASE,
    )
    m_match = mdy_named.search(search_block)
    if m_match:
        month_str, day_str, year_str = m_match.group(1), m_match.group(2), m_match.group(3)
        m = MONTH_NAME_TO_INT.get(month_str.lower())
        if m:
            dt = _safe_date(int(year_str), m, int(day_str))
            if dt:
                return dt.isoformat()

    # Format: Day Month Year (e.g. "5 March 2026", "5th of March 2026")
    dmy_named = re.compile(
        rf'\b(\d{{1,2}})(?:st|nd|rd|th)?(?:\s+of)?\s+({month_names})(?:,)?\s+(\d{{4}})\b',
        re.IGNORECASE,
    )
    d_match = dmy_named.search(search_block)
    if d_match:
        day_str, month_str, year_str = d_match.group(1), d_match.group(2), d_match.group(3)
        m = MONTH_NAME_TO_INT.get(month_str.lower())
        if m:
            dt = _safe_date(int(year_str), m, int(day_str))
            if dt:
                return dt.isoformat()

    # 3. Numeric formats: DD/MM/YYYY or MM/DD/YYYY or with hyphens
    num_pattern = re.compile(r'\b(0?[1-9]|[12]\d|3[01])[-/](0?[1-9]|[12]\d|3[01])[-/](19\d\d|20\d\d)\b')
    for match in num_pattern.finditer(search_block):
        part1 = int(match.group(1))
        part2 = int(match.group(2))
        year = int(match.group(3))

        # Check unambiguous cases first:
        if part1 > 12 and part2 <= 12:
            # part1 must be day, part2 must be month (DMY)
            dt = _safe_date(year, part2, part1)
            if dt:
                return dt.isoformat()
        elif part2 > 12 and part1 <= 12:
            # part1 must be month, part2 must be day (MDY)
            dt = _safe_date(year, part1, part2)
            if dt:
                return dt.isoformat()
        elif part1 <= 12 and part2 <= 12:
            # Both <= 12: ambiguous
            if part1 == part2:
                # Same day and month
                dt = _safe_date(year, part1, part2)
                if dt:
                    return dt.isoformat()

            # Ambiguity resolution using user_date_format
            fmt = (user_date_format or "").lower().strip()
            if fmt == "dmy":
                dt = _safe_date(year, part2, part1)
                if dt:
                    return dt.isoformat()
            elif fmt == "mdy":
                dt = _safe_date(year, part1, part2)
                if dt:
                    return dt.isoformat()
            else:
                # Ambiguous without explicit preference -> return None
                return None

    return None


def extract_text(file_obj, filename: str, user_date_format: str = "locale") -> Dict[str, Any]:
    """
    Main dispatcher: validates file, extracts text, cleans, truncates,
    and guesses title and date. Returns preview payload dict.
    """
    safe_filename = sanitize_filename(filename)
    ext = Path(safe_filename).suffix.lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise ExtractionError(
            "Unsupported file type. Only .txt, .docx, and .pdf files are accepted.",
            "invalid_extension",
        )

    # Size check
    file_obj.seek(0, io.SEEK_END)
    file_size = file_obj.tell()
    file_obj.seek(0)

    if file_size == 0:
        raise ExtractionError("The uploaded file is empty.", "empty_file")
    if file_size > MAX_FILE_SIZE:
        raise ExtractionError("File size exceeds the 5 MB limit.", "file_too_large")

    # Real type check (prevent spoofed extensions)
    verify_file_type(file_obj, ext)

    warnings: List[str] = []
    source_type = ext.lstrip(".")

    # Extraction by type
    if ext == ".txt":
        raw_text = extract_txt(file_obj)
    elif ext == ".docx":
        raw_text = extract_docx(file_obj)
    elif ext == ".pdf":
        raw_text, pdf_warnings = extract_pdf(file_obj)
        warnings.extend(pdf_warnings)
    else:
        raise ExtractionError("Unsupported file type.", "invalid_extension")

    # Clean text
    cleaned_text = clean_text(raw_text)
    if not cleaned_text:
        raise ExtractionError("The file contains no readable text.", "empty_file")

    # Guess date from the first lines of the full text
    guessed_date = guess_date(cleaned_text, user_date_format=user_date_format)

    # Guess title and strip it from body if taken from line 1
    title, body = guess_title(cleaned_text, safe_filename)

    # Truncate body if it exceeds maximum limit
    truncated = False
    if len(body) > MAX_BODY_LENGTH:
        body = body[:MAX_BODY_LENGTH]
        truncated = True
        warnings.append(f"Text was truncated to {MAX_BODY_LENGTH:,} characters.")

    return {
        "title": title,
        "body": body,
        "date": guessed_date,
        "source": source_type,
        "filename": safe_filename,
        "truncated": truncated,
        "warnings": warnings,
    }

