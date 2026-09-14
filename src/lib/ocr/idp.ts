import Tesseract, { createWorker, Worker } from "tesseract.js";

// Keep a global worker instance alive to drastically reduce OCR latency on subsequent uploads
let tesseractWorkerPromise: Promise<Worker> | null = null;

async function getTesseractWorker(): Promise<Worker> {
  if (!tesseractWorkerPromise) {
    tesseractWorkerPromise = (async () => {
      console.log("Initializing persistent Tesseract worker...");
      const worker = await createWorker("eng");
      return worker;
    })();
  }
  return tesseractWorkerPromise;
}

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
function extractFields(text: string, docType: string): { data: ExtractedFields; confidence: FieldConfidence } {
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
    conf.accusedNames = 0.55; 
  }

  if (docType === "WITNESS_STATEMENT") {
    // Try to find "My name is [Name]" or "Statement of [Name]" or "Signed, [Name]"
    const witnessMatch = text.match(/(?:My name i[cs]|Statement of)\s+([A-Z][A-Za-z\s]+)(?:,|\.)/i) || text.match(/Signed,?\s*([A-Z][A-Za-z\s]+)/i) || text.match(/Cianed,?\s*([A-Z][A-Za-z\s]+)/i);
    if (witnessMatch) {
      data.accusedNames = [witnessMatch[1].trim()]; // reusing field for witness name
      conf.accusedNames = 0.75;
    }
    
    // Try to find Ref: or Case:
    const refMatch = text.match(/(?:Ref|Case|FIR)\s*[:\-]?\s*([A-Z0-9\/\-]+)/i);
    if (refMatch) {
      data.caseNumber = refMatch[1].trim();
      conf.caseNumber = 0.8;
    }
  }

  // If we couldn't find a date using "Date:", try to find any date pattern
  if (!data.date) {
    const looseDateMatch = text.match(/(\d{1,2}[\/\-\s][A-Za-z]+[\/\-\s]\d{2,4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    if (looseDateMatch) {
      data.date = looseDateMatch[1].trim();
      conf.date = 0.6;
    }
  }

  return { data, confidence: conf };
}

/**
 * Extract text from a PDF buffer using pdf-parse.
 * Returns the extracted text or null if extraction fails.
 */
async function extractPdfText(buffer: Buffer): Promise<string | null> {
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer);
    if (result.text && result.text.trim().length > 0) {
      return result.text.trim();
    }
    return null;
  } catch (error) {
    console.error("PDF text extraction error:", error);
    return null;
  }
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
      const worker = await getTesseractWorker();
      const { data } = await worker.recognize(buffer);
      rawText = data.text;
      overallConfidence = data.confidence / 100;
    } catch (error) {
      console.error("Tesseract error:", error);
      rawText = "[OCR Engine Error - Falling back to mock extraction]";
    }
  } else if (mimeType === "application/pdf") {
    // PDF files: extract embedded text directly (no OCR needed for typed/digital PDFs)
    const pdfText = await extractPdfText(buffer);
    if (pdfText) {
      rawText = pdfText;
      overallConfidence = 0.92; // High confidence for digitally-generated PDFs
    } else {
      // PDF had no extractable text (e.g., scanned image-only PDF)
      rawText = `[PDF contained no extractable text — likely a scanned image]\nDocument Type: ${docType}`;
      overallConfidence = 0.3;
    }
  } else {
    // Other unsupported types: fallback
    rawText = `[Unsupported file type: ${mimeType}]\nDocument Type: ${docType}`;
    overallConfidence = 0.2;
  }

  const { data: extractedData, confidence: fieldConfidence } = extractFields(rawText, docType);

  return {
    rawText,
    confidence: overallConfidence,
    extractedData,
    fieldConfidence,
  };
}
