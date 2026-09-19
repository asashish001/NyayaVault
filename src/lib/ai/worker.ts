import { pipeline, env } from '@xenova/transformers';

// Configure for offline, local model usage
// The user will download the model to public/models/ for strict air-gap.
// We set allowRemoteModels to true for prototype purposes so it downloads on first run,
// but for production air-gap, it should be false.
env.allowRemoteModels = false; 
env.localModelPath = '/models/';

class MyPipeline {
  static task: any = 'text2text-generation';
  static model = 'Xenova/LaMini-Flan-T5-77M';
  static instance: any = null;

  static async getInstance(progress_callback: any = null) {
    if (this.instance === null) {
      this.instance = await pipeline(this.task, this.model, { progress_callback } as any);
    }
    return this.instance;
  }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event: MessageEvent) => {
  const { id, type, payload } = event.data;
  
  if (type === 'GENERATE') {
    const { prompt } = payload;
    
    try {
      // Retrieve the pipeline. It will download the model the first time (if online/allowRemote)
      const generator = await MyPipeline.getInstance((x: any) => {
        // Send progress updates back to the main thread
        self.postMessage({
          id,
          type: 'PROGRESS',
          payload: x,
        });
      });

      // Generate the text
      const output = await generator(prompt, {
        max_new_tokens: 150,
        temperature: 0.7,
      });

      // Send the result back
      self.postMessage({
        id,
        type: 'COMPLETE',
        payload: {
          result: output[0].generated_text
        }
      });
    } catch (error: any) {
      console.error(error);
      self.postMessage({
        id,
        type: 'ERROR',
        payload: {
          error: error.message
        }
      });
    }
  }
});
