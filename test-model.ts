import { pipeline, env } from '@xenova/transformers';

// Disable remote downloads and point to the public folder where we copied the files
env.allowRemoteModels = false;
env.localModelPath = './public/models/';

async function run() {
  console.log("Loading model (this may take a minute to download ~80MB on first run)...");
  
  // Initialize the exact model we used in the prototype
  const generator = await pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-77M');
  
  console.log("\n✅ Model loaded successfully!");
  console.log("-----------------------------------------");

  const prompt = `System Context: You are a secure AI Case Assistant. Rely ONLY on the provided documents.
User Query: What items were stolen?
Context Documents:
--- DOCUMENT [ID: 123 | TITLE: FIR Report] ---
On the night of July 14th, an unidentified suspect broke into the main warehouse. The inventory check confirmed that 5 laptops and a digital projector were stolen from the premises.`;

  console.log("Prompt:");
  console.log(prompt);
  console.log("-----------------------------------------");
  console.log("Generating response locally...\n");
  
  const startTime = Date.now();
  const output = await generator(prompt, {
    max_new_tokens: 50,
    temperature: 0.7,
  });
  const endTime = Date.now();

  console.log(`🤖 AI Response (Generated in ${((endTime - startTime) / 1000).toFixed(2)} seconds):`);
  console.log(output[0].generated_text);
  console.log("-----------------------------------------");
}

run().catch(console.error);
