import os
from pathlib import Path


def _prompt_filename() -> str:
    return os.environ.get("INTERVIEW_PROMPT_FILE", "interview_prompt_full.txt")


def build_interview_prompt(cv_content: str, job_content: str = "") -> str:
    template_path = Path(__file__).parent / _prompt_filename()
    template = template_path.read_text(encoding="utf-8")
    prompt = template.replace("{{CV_CONTENT}}", cv_content.strip())
    prompt = prompt.replace("{{JOB_CONTENT}}", job_content.strip() if job_content else "Not specified.")
    return prompt
