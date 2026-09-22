const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const PII = [
  /\b\d{4}\s?\d{4}\s?\d{4}\b/g,              // Aadhaar-like
  /\b[6-9]\d{9}\b/g,                         // Indian mobile
  /\b[A-Z]{5}\d{4}[A-Z]\b/g,                 // PAN
  /[\w.+-]+@[\w-]+\.[\w.]+/g,                // e-mail
  /\b\d{6}\b/g                               // PIN code
];

export function redact(text: string, extracted: any, keys: string[], extraTerms: string[] = []) {
  let n = 0; 
  const fields = extracted?.fields ?? {};
  
  const terms = [...keys.flatMap(k => {
      const val = fields[k];
      if (Array.isArray(val)) return val;
      if (val) return [val];
      return [];
    }), ...extraTerms]
    .filter((v): v is string => typeof v === "string" && v.trim().length > 2);
  
  for (const t of terms) {
    text = text.replace(new RegExp(esc(t), "gi"), () => {
      n++;
      return "[REDACTED]";
    });
  }
  
  for (const re of PII) {
    text = text.replace(re, () => {
      n++;
      return "[REDACTED]";
    });
  }
  
  return { text, count: n };
}
