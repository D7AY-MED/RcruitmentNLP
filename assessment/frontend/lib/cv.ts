import pdfParse from "pdf-parse";
import { assertNonEmpty } from "./invariants";

const MAX_CV_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export async function extractCvTextFromFormData(formData: FormData): Promise<string> {
  const cvTextValue = formData.get("cvText");
  const cvFileValue = formData.get("cvFile");

  if (typeof cvTextValue === "string" && cvTextValue.trim()) {
    assertNonEmpty(cvTextValue, "cvText");
    return cvTextValue.trim();
  }

  if (!(cvFileValue instanceof File)) {
    throw new Error("Provide either cvText or cvFile.");
  }

  if (cvFileValue.size === 0) {
    throw new Error("Uploaded CV file is empty.");
  }

  if (cvFileValue.size > MAX_CV_FILE_SIZE_BYTES) {
    throw new Error("Uploaded CV is too large (max 5MB).");
  }

  const buffer = Buffer.from(await cvFileValue.arrayBuffer());
  const isPdf =
    cvFileValue.type === "application/pdf" ||
    cvFileValue.name.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    try {
      const parsed = await pdfParse(buffer);
      const text = parsed.text?.trim() ?? "";
      if (!text) {
        throw new Error("unreadable");
      }
      return text;
    } catch {
      throw new Error(
        "CV PDF could not be read. Please upload a text CV or paste CV text."
      );
    }
  }

  const text = buffer.toString("utf8").trim();
  if (!text) {
    throw new Error("Uploaded text CV is unreadable or empty.");
  }
  return text;
}
