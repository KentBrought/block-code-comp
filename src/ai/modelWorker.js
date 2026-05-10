/* eslint-disable no-restricted-globals */
import * as webllm from '@mlc-ai/web-llm';

const MODEL_ID = 'Llama-3.2-1B-Instruct-q4f32_1-MLC';

const GENERATION_DEFAULTS = {
  max_tokens: 150,
  temperature: 0.8,
  top_p: 0.9,
};

let engine = null;

async function loadModel() {
  if (engine) {
    self.postMessage({ type: 'LOAD_DONE' });
    return;
  }

  self.postMessage({ type: 'LOAD_START' });

  engine = await webllm.CreateMLCEngine(MODEL_ID, {
    initProgressCallback: (progress) => {
      self.postMessage({ type: 'LOAD_PROGRESS', payload: progress });
    },
  });

  self.postMessage({ type: 'LOAD_DONE' });
}

async function generate({ messages, options = {} }) {
  if (!engine) {
    throw new Error('Model is not loaded yet.');
  }

  const output = await engine.chat.completions.create({
    messages,
    ...GENERATION_DEFAULTS,
    ...options,
  });
  const reply = output?.choices?.[0]?.message?.content ?? '';
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
