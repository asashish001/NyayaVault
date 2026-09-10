export const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export function validateUploadFile(file: { type: string; size: number }): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return "Invalid file type. Only PDF/JPG/PNG allowed.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "File exceeds 20MB limit.";
  }
  return null;
}
