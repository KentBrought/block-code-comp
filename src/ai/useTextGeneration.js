import { useState, useEffect, useRef, useCallback } from 'react';

// Status values: 'idle' | 'loading' | 'ready' | 'generating' | 'error'

const MAX_LOAD_ATTEMPTS = 3;
const LOAD_RETRY_BASE_MS = 1200;

let sharedWorker = null;
let sharedStatus = 'idle';
let sharedLoadProgress = 0;
let sharedLoadMessage = 'Initializing...';
let loadAttempts = 0;
let loadRetryTimer = null;
const subscribers = new Set();
const pendingBySubscriber = new Map();

function notifySubscribers() {
  subscribers.forEach((listener) => {
    listener({
      status: sharedStatus,
      loadProgress: sharedLoadProgress,
      loadMessage: sharedLoadMessage,
    });
  });
}

function setSharedStatus(status) {
  sharedStatus = status;
  notifySubscribers();
}

function setSharedLoadProgress(loadProgress) {
  sharedLoadProgress = loadProgress;
  notifySubscribers();
}

function setSharedLoadMessage(loadMessage) {
  sharedLoadMessage = loadMessage;
  notifySubscribers();
}

function clearLoadRetryTimer() {
  if (loadRetryTimer) {
    clearTimeout(loadRetryTimer);
    loadRetryTimer = null;
  }
}

function scheduleLoadRetry() {
  clearLoadRetryTimer();
  if (loadAttempts >= MAX_LOAD_ATTEMPTS) {
    setSharedStatus('error');
    setSharedLoadMessage('Failed to load model');
    return;
  }

  loadAttempts += 1;
  const delay = LOAD_RETRY_BASE_MS * loadAttempts;
  setSharedStatus('loading');
  setSharedLoadMessage(`Model load failed, retrying (${loadAttempts}/${MAX_LOAD_ATTEMPTS})...`);

  loadRetryTimer = setTimeout(() => {
    loadRetryTimer = null;
    ensureWorker();
    requestLoad();
  }, delay);
}

function requestLoad() {
  if (!sharedWorker) return;
  clearLoadRetryTimer();
  if (sharedStatus !== 'ready' && sharedStatus !== 'generating') {
    setSharedStatus('loading');
    setSharedLoadMessage('Initializing model...');
  }
  sharedWorker.postMessage({ type: 'LOAD' });
}

function ensureWorker() {
  if (sharedWorker) return sharedWorker;

  const worker = new Worker(new URL('./modelWorker.js', import.meta.url), {
    type: 'module',
  });
  sharedWorker = worker;

  worker.onmessage = ({ data }) => {
    switch (data.type) {
      case 'LOAD_START':
        clearLoadRetryTimer();
        setSharedStatus('loading');
        setSharedLoadProgress(0);
        setSharedLoadMessage('Initializing model...');
        break;

      case 'LOAD_PROGRESS': {
        const p = data.payload;
        if (typeof p?.progress === 'number') {
          const value = p.progress <= 1 ? p.progress * 100 : p.progress;
          setSharedLoadProgress(Math.max(0, Math.min(100, Math.round(value))));
        }
        if (typeof p?.text === 'string' && p.text.trim()) {
          setSharedLoadMessage(p.text.trim());
        }
        break;
      }

      case 'LOAD_DONE':
        clearLoadRetryTimer();
        loadAttempts = 0;
        setSharedStatus('ready');
        setSharedLoadProgress(100);
        setSharedLoadMessage('Model ready');
        break;

      case 'GENERATE_DONE':
        setSharedStatus('ready');
        pendingBySubscriber.forEach((pending) => {
          pending?.resolve(data.payload);
        });
        pendingBySubscriber.clear();
        break;

      case 'LOAD_ERROR':
        pendingBySubscriber.forEach((pending) => {
          pending?.reject(new Error(data.payload));
        });
        pendingBySubscriber.clear();
        scheduleLoadRetry();
        break;

      case 'GENERATE_ERROR':
        setSharedStatus('ready');
        pendingBySubscriber.forEach((pending) => {
          pending?.reject(new Error(data.payload));
        });
        pendingBySubscriber.clear();
        break;

      default:
        break;
    }
  };

  worker.onerror = () => {
    pendingBySubscriber.forEach((pending) => {
      pending?.reject(new Error('Model worker crashed'));
    });
    pendingBySubscriber.clear();
    sharedWorker = null;
    scheduleLoadRetry();
  };

  requestLoad();
  return worker;
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (sharedStatus !== 'error') return;
    loadAttempts = 0;
    ensureWorker();
    requestLoad();
  });
}

export function useTextGeneration() {
  const [status, setStatus] = useState(sharedStatus);
  const [loadProgress, setLoadProgress] = useState(sharedLoadProgress);
  const [loadMessage, setLoadMessage] = useState(sharedLoadMessage);

  const statusRef = useRef(sharedStatus);
  const subscriberRef = useRef(null);

  const updateStatus = (nextStatus) => {
    statusRef.current = nextStatus;
    setStatus(nextStatus);
  };

  useEffect(() => {
    const listener = ({ status: nextStatus, loadProgress: nextProgress, loadMessage: nextMessage }) => {
      statusRef.current = nextStatus;
      setStatus(nextStatus);
      setLoadProgress(nextProgress);
      setLoadMessage(nextMessage);
    };

    subscriberRef.current = listener;
    subscribers.add(listener);
    listener({
      status: sharedStatus,
      loadProgress: sharedLoadProgress,
      loadMessage: sharedLoadMessage,
    });

    ensureWorker();

    return () => {
      subscribers.delete(listener);
      subscriberRef.current = null;
      pendingBySubscriber.delete(listener);
    };
  }, []);

  const reload = useCallback(() => {
    loadAttempts = 0;
    ensureWorker();
    requestLoad();
  }, []);

  const generate = useCallback((messages, options) => {
    return new Promise((resolve, reject) => {
      const worker = ensureWorker();
      if (statusRef.current !== 'ready' || !worker) {
        reject(new Error(`Model not ready (status: ${statusRef.current})`));
        return;
      }

      const listener = subscriberRef.current;
      if (!listener) {
        reject(new Error('Model hook is not mounted'));
        return;
      }

      updateStatus('generating');
      pendingBySubscriber.set(listener, { resolve, reject });
      worker.postMessage({ type: 'GENERATE', payload: { messages, options } });
    });
  }, []);

  return { status, loadProgress, loadMessage, generate, reload };
}
