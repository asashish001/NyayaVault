import Tesseract from "tesseract.js";

type ExtractedFields = {
  caseNumber?: string;
  date?: string;
  policeStation?: string;
  accusedNames?: string[];
  sections?: string[];
};

type FieldConfidence = {
  [K in keyof ExtractedFields]: number;
};

export type OcrResult = {
  rawText: string;
  confidence: number;
  extractedData: ExtractedFields;
  fieldConfidence: FieldConfidence;
};

// Simple heuristic field extraction (simulating an NER model)
function extractFields(text: string): { data: ExtractedFields; confidence: FieldConfidence } {
  const data: ExtractedFields = {};
  const conf: FieldConfidence = {
    caseNumber: 0.9,
    date: 0.85,
    policeStation: 0.95,
    accusedNames: 0.6,
    sections: 0.8,
  };

  // Mock regex extractions
  const firMatch = text.match(/FIR\s*No\.?\s*[:\-]\s*([A-Z0-9\/\-]+)/i);
  if (firMatch) data.caseNumber = firMatch[1].trim();

  const dateMatch = text.match(/Date\s*[:\-]\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
  if (dateMatch) data.date = dateMatch[1].trim();

  const psMatch = text.match(/Police Station\s*[:\-]\s*([A-Za-z\s]+)/i);
  if (psMatch) data.policeStation = psMatch[1].trim();

  const secMatch = text.match(/Section[s]?\s*[:\-]\s*([0-9A-Za-z,\s]+)/i);
  if (secMatch) data.sections = secMatch[1].split(",").map((s) => s.trim());

  // Simulate low confidence on handwritten/tricky names
  const nameMatch = text.match(/Accused\s*[:\-]\s*([A-Za-z\s,]+)/i);
  if (nameMatch) {
    data.accusedNames = nameMatch[1].split(",").map((n) => n.trim());
    conf.accusedNames = 0.55; // Deliberately low to trigger manual review
  }

  // If we found nothing, let's just populate some demo data to show the UI
  if (Object.keys(data).length === 0) {
    data.caseNumber = "FIR-Unknown";
    data.date = "DD-MM-YYYY";
    data.policeStation = "Unknown PS";
    data.accusedNames = ["Unidentified"];
    conf.accusedNames = 0.45;
  }

  return { data, confidence: conf };
}

export async function processDocument(
  buffer: Buffer,
  mimeType: string,
  docType: string
): Promise<OcrResult> {
  let rawText = "";
  let overallConfidence = 0.8;

  if (mimeType.startsWith("image/")) {
    try {
      const { data } = await Tesseract.recognize(buffer, "eng");
      rawText = data.text;
      overallConfidence = data.confidence / 100;
    } catch (error) {
      console.error("Tesseract error:", error);
      rawText = "[OCR Engine Error - Falling back to mock extraction]";
    }
  } else {
    // For PDFs or unsupported types in this MVP, we fall back to a simulated extraction
    rawText = `[Simulated OCR for PDF]
Document Type: ${docType}
FIR No: FIR-2026/089
Date: 10-09-2026
Police Station: Cyber Cell North
Sections: 420, 468, 471 IPC
Accused: Rajesh Kumar, Sunil Verma (Suspicious spelling)
... (further text) ...`;
  }

  const { data: extractedData, confidence: fieldConfidence } = extractFields(rawText);

  // Randomize some confidence if it's the mock PDF to still show the review UI
  if (!mimeType.startsWith("image/")) {
    fieldConfidence.accusedNames = 0.51; // Low confidence triggers review
  }

  return {
    rawText,
    confidence: overallConfidence,
    extractedData,
    fieldConfidence,
  };
}
