/* eslint-disable no-restricted-globals */
import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;

const MODEL_ID = 'HuggingFaceTB/SmolLM2-135M-Instruct';

const GENERATION_DEFAULTS = {
  max_new_tokens: 150,
  do_sample: true,
  temperature: 0.8,
  top_p: 0.9,
  repetition_penalty: 1.15,
};

let pipe = null;

async function loadModel() {
  self.postMessage({ type: 'LOAD_START' });

  pipe = await pipeline('text-generation', MODEL_ID, {
    dtype: 'q4',
    progress_callback: (progress) => {
      self.postMessage({ type: 'LOAD_PROGRESS', payload: progress });
    },
  });

  self.postMessage({ type: 'LOAD_DONE' });
}

async function generate({ messages, options = {} }) {
  const output = await pipe(messages, { ...GENERATION_DEFAULTS, ...options });
  // For chat-template models, generated_text is an array of message objects.
  // The last element is the new assistant reply.
  const reply = output?.[0]?.generated_text?.at(-1)?.content ?? '';
  self.postMessage({ type: 'GENERATE_DONE', payload: reply });
}

self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'LOAD') await loadModel();
    if (data.type === 'GENERATE') await generate(data.payload);
  } catch (err) {
    self.postMessage({ type: 'ERROR', payload: err.message });
  }
};
