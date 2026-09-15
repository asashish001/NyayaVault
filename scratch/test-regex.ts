function extractFields(text: string, docType: string) {
  const data: Record<string, any> = {};
  const conf: Record<string, number> = {
    caseNumber: 0.9,
    date: 0.85,
    policeStation: 0.95,
    accusedNames: 0.6,
    sections: 0.8,
  };

  const firMatch = text.match(/FIR\s*No\.?\s*[:\-]\s*([A-Z0-9\/\-]+)/i);
  if (firMatch) data.caseNumber = firMatch[1].trim();

  const dateMatch = text.match(/Date\s*[:\-]\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
  if (dateMatch) data.date = dateMatch[1].trim();

  const psMatch = text.match(/Police Station\s*[:\-]\s*([A-Za-z\s]+)/i);
  if (psMatch) data.policeStation = psMatch[1].trim();

  const secMatch = text.match(/Section[s]?\s*[:\-]\s*([0-9A-Za-z,\s]+)/i);
  if (secMatch) data.sections = secMatch[1].split(",").map((s) => s.trim());

  const nameMatch = text.match(/Accused\s*[:\-]\s*([A-Za-z\s,]+)/i);
  if (nameMatch) {
    data.accusedNames = nameMatch[1].split(",").map((n) => n.trim());
    conf.accusedNames = 0.55; 
  }

  if (docType === "WITNESS_STATEMENT") {
    const witnessMatch = text.match(/(?:My name i[cs]|Statement of)\s+([A-Z][A-Za-z\s]+)(?:,|\.)/i) || text.match(/Signed,?\s*([A-Z][A-Za-z\s]+)/i) || text.match(/Cianed,?\s*([A-Z][A-Za-z\s]+)/i);
    if (witnessMatch) {
      data.accusedNames = [witnessMatch[1].trim()];
      conf.accusedNames = 0.75;
    }
    
    const refMatch = text.match(/(?:Ref|Case|FIR)\s*[:\-]?\s*([A-Z0-9\/\-]+)/i);
    if (refMatch) {
      data.caseNumber = refMatch[1].trim();
      conf.caseNumber = 0.8;
    }
  }

  if (!data.date) {
    const looseDateMatch = text.match(/(\d{1,2}[\/\-\s][A-Za-z]+[\/\-\s]\d{2,4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    if (looseDateMatch) {
      data.date = looseDateMatch[1].trim();
      conf.date = 0.6;
    }
  }

  return { data, confidence: conf };
}

const mockFir = `
FIRST INFORMATION REPORT
Police Station: Cyberabad Central
FIR No: FIR-CYB-2026/409
Date: 14-09-2026
Sections: 420, 468, 471 IPC
Accused: Rajesh Kumar, Sunil Verma
Incident Details: Fraudulent transactions...
`;

const mockWitness = `
WITNESS STATEMENT
Ref: FIR-CYB-2026/409
Date: 15-09-2026
My name is Priya Sharma. I saw the transaction happen...
Signed Priya Sharma
`;

console.log("=== FIR TEST ===");
console.log(JSON.stringify(extractFields(mockFir, "FIR"), null, 2));

console.log("\n=== WITNESS STATEMENT TEST ===");
console.log(JSON.stringify(extractFields(mockWitness, "WITNESS_STATEMENT"), null, 2));
