const { createWorker } = require('tesseract.js');
const fs = require('fs');

async function test() {
  console.log("Creating worker...");
  const worker = await createWorker('eng');
  console.log("Worker created. Terminating...");
  await worker.terminate();
  console.log("Terminated.");
}
test().catch(console.error);
