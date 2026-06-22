import io
import logging

from pypdf import PdfReader

logger = logging.getLogger(__name__)

MAX_CV_FILE_SIZE_BYTES = 5 * 1024 * 1024


async def extract_cv_text(cv_text: str | None, cv_file: bytes | None, filename: str | None) -> str:
    if cv_text and cv_text.strip():
        return cv_text.strip()

    if not cv_file:
        raise ValueError("Provide either cvText or cvFile.")

    if len(cv_file) > MAX_CV_FILE_SIZE_BYTES:
        raise ValueError("Uploaded CV is too large (max 5MB).")

    if len(cv_file) == 0:
        raise ValueError("Uploaded CV file is empty.")

    is_pdf = (filename and filename.lower().endswith(".pdf")) or False

    if is_pdf:
        try:
            reader = PdfReader(io.BytesIO(cv_file))
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            text = text.strip()
            if not text:
                raise ValueError("unreadable")
            return text
        except Exception as e:
            logger.warning("PDF parse failed: %s", e)
            raise ValueError(
                "CV PDF could not be read. Please upload a text CV or paste CV text."
            ) from e

    text = cv_file.decode("utf-8", errors="replace").strip()
    if not text:
        raise ValueError("Uploaded text CV is unreadable or empty.")

    return text
