const text1 = `
FIRST INFORMATION REPORT
FIR No: FIR-DEL-2026-0042
Date: 12-10-2026
Police Station: Connaught Place
Sections: 420, 468, 471 IPC
Accused: Rajesh Kumar, Sunil Verma
Details: The accused were found to be involved in a forgery scheme...
`;

const text2 = `
WITNESS STATEMENT
Ref: FIR-DEL-2026-0042
Date: 14/10/2026
My name is Kavita Sharma, and I reside at...
Signed Kavita Sharma
`;

function testRegex(text, docType) {
  const data = {};
  
  const firMatch = text.match(/FIR\s*No\.?\s*[:\-]\s*([A-Z0-9\/\-]+)/i);
  if (firMatch) data.caseNumber = firMatch[1].trim();

  const dateMatch = text.match(/Date\s*[:\-]\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
  if (dateMatch) data.date = dateMatch[1].trim();

  const psMatch = text.match(/Police Station\s*[:\-]\s*([^\n\r]+)/i);
  if (psMatch) data.policeStation = psMatch[1].trim();

  const secMatch = text.match(/Section[s]?\s*[:\-]\s*([^\n\r]+)/i);
  if (secMatch) data.sections = secMatch[1].split(",").map((s) => s.trim());

  const nameMatch = text.match(/Accused\s*[:\-]\s*([^\n\r]+)/i);
  if (nameMatch) data.accusedNames = nameMatch[1].split(",").map((n) => n.trim());

  if (docType === "WITNESS_STATEMENT") {
    const witnessMatch = text.match(/(?:My name i[cs]|Statement of)\s+([A-Z][A-Za-z\s]+)(?:,|\.)/i) || text.match(/Signed,?\s*([^\n\r]+)/i) || text.match(/Cianed,?\s*([^\n\r]+)/i);
    if (witnessMatch) {
      data.accusedNames = [witnessMatch[1].trim()]; // reusing field for witness name
    }
    
    const refMatch = text.match(/(?:Ref|Case|FIR)\s*[:\-]?\s*([A-Z0-9\/\-]+)/i);
    if (refMatch) {
      data.caseNumber = refMatch[1].trim();
    }
  }

  if (!data.date) {
    const looseDateMatch = text.match(/(\d{1,2}[\/\-\s][A-Za-z]+[\/\-\s]\d{2,4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    if (looseDateMatch) data.date = looseDateMatch[1].trim();
  }

  return data;
}

console.log("=== FIR TEST ===");
console.log(testRegex(text1, "FIR"));

console.log("\n=== WITNESS STATEMENT TEST ===");
console.log(testRegex(text2, "WITNESS_STATEMENT"));
