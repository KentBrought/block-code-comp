import { useState, useEffect, useRef, useCallback } from 'react';

// Status values: 'idle' | 'loading' | 'ready' | 'generating' | 'error'

export function useTextGeneration() {
  const [status, setStatus] = useState('idle');
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadMessage, setLoadMessage] = useState('Initializing...');

  // Keep status accessible inside stable callbacks without adding it as a dep.
  const statusRef = useRef('idle');
  const workerRef = useRef(null);
  // Resolves/rejects the Promise returned by generate().
  const pendingRef = useRef(null);

  const updateStatus = (s) => {
    statusRef.current = s;
    setStatus(s);
  };

  useEffect(() => {
    const worker = new Worker(new URL('./modelWorker.js', import.meta.url), {
      type: 'module',
    });
    workerRef.current = worker;

    worker.onmessage = ({ data }) => {
      switch (data.type) {
        case 'LOAD_START':
          updateStatus('loading');
          setLoadProgress(0);
          setLoadMessage('Initializing model...');
          break;

        case 'LOAD_PROGRESS': {
          const p = data.payload;
          if (typeof p?.progress === 'number') {
            const value = p.progress <= 1 ? p.progress * 100 : p.progress;
            setLoadProgress(Math.max(0, Math.min(100, Math.round(value))));
          }
          if (typeof p?.text === 'string' && p.text.trim()) {
            setLoadMessage(p.text.trim());
          }
          break;
        }

        case 'LOAD_DONE':
          updateStatus('ready');
          setLoadProgress(100);
          setLoadMessage('Model ready');
          break;

        case 'GENERATE_DONE':
          updateStatus('ready');
          pendingRef.current?.resolve(data.payload);
          pendingRef.current = null;
          break;

        case 'ERROR':
          updateStatus('error');
          setLoadMessage('Failed to load model');
          pendingRef.current?.reject(new Error(data.payload));
          pendingRef.current = null;
          break;

        default:
          break;
      }
    };

    worker.postMessage({ type: 'LOAD' });

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // generate() is stable — no deps — because it reads status via ref.
  const generate = useCallback((messages, options) => {
    return new Promise((resolve, reject) => {
      if (statusRef.current !== 'ready' || !workerRef.current) {
        reject(new Error(`Model not ready (status: ${statusRef.current})`));
        return;
      }
      updateStatus('generating');
      pendingRef.current = { resolve, reject };
      workerRef.current.postMessage({ type: 'GENERATE', payload: { messages, options } });
    });
  }, []);

  return { status, loadProgress, loadMessage, generate };
}
