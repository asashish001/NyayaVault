import fs from 'fs';
import path from 'path';
import { processDocument } from '../src/lib/ocr/idp';

async function test() {
  console.log('Loading image buffer...');
  const filePath = path.join(__dirname, '../demo-files/ws_2026_0001_witness.jpg');
  const buffer = fs.readFileSync(filePath);
  
  console.log('Running processDocument (Tesseract + IDP)...');
  const result = await processDocument(buffer, 'image/jpeg', 'WITNESS_STATEMENT');
  
  console.log('\n=== RAW TEXT ===');
  console.log(result.rawText);
  console.log('\n=== EXTRACTED METADATA ===');
  console.log(result.extractedData);
  console.log('\n=== CONFIDENCE SCORES ===');
  console.log('Overall:', result.confidence);
  console.log('Field Confidence:', result.fieldConfidence);
}

test().catch(console.error);
