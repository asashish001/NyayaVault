import { createWorker } from 'tesseract.js';
import * as fs from 'fs';

async function test() {
  console.log("Creating worker...");
  const worker = await createWorker('eng');
  console.log("Worker created. Terminating...");
  await worker.terminate();
  console.log("Terminated.");
}
test().catch(console.error);
