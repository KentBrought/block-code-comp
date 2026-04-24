import * as tf from '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-backend-cpu'
import modelAssetPath from '../model/quickdraw_model.tflite'
import modelAssetPathInt8 from '../model/quickdraw_model_int8.tflite'
import labelsAssetPath from '../model/labels.txt'

const INPUT_SIZE = 28
const MAX_RESULTS = 10
const PUBLIC_BASE = (process.env.PUBLIC_URL || '').replace(/\/$/, '')

function getRuntimeBasePath() {
  if (PUBLIC_BASE) return PUBLIC_BASE
  if (typeof window !== 'undefined' && window.location?.pathname) {
    const pathname = window.location.pathname
    const marker = '/block-code-comp/'
    const markerIndex = pathname.indexOf(marker)
    if (markerIndex >= 0) {
      return '/block-code-comp'
    }
  }
  return ''
}

const DEPLOY_BASE = getRuntimeBasePath()
const TFLITE_DIST_BASE =
  typeof window !== 'undefined'
    ? `${window.location.origin}${DEPLOY_BASE}/tflite-runtime/`
    : `${DEPLOY_BASE}/tflite-runtime/`
const TFLITE_BUNDLE_PATH =
  typeof window !== 'undefined'
    ? `${window.location.origin}${DEPLOY_BASE}/tflite-runtime/tf-tflite.es2017.js`
    : `${DEPLOY_BASE}/tflite-runtime/tf-tflite.es2017.js`

let model
let initPromise
let labels
let labelsPromise
let usingInt8Fallback = false
let runtimePromise
let backendReadyPromise

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-tflite-src="${src}"]`)
    if (existing) {
      if (existing.getAttribute('data-loaded') === 'true') {
        resolve()
      } else {
        existing.addEventListener('load', () => resolve(), { once: true })
        existing.addEventListener('error', () => reject(new Error(`Failed to load script: ${src}`)), {
          once: true
        })
      }
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.setAttribute('data-tflite-src', src)
    script.addEventListener('load', () => {
      script.setAttribute('data-loaded', 'true')
      resolve()
    })
    script.addEventListener('error', () => reject(new Error(`Failed to load script: ${src}`)))
    document.head.appendChild(script)
  })
}

async function ensureCpuBackendReady() {
  if (!backendReadyPromise) {
    backendReadyPromise = (async () => {
      await tf.setBackend('cpu')
      await tf.ready()
    })()
  }
  return backendReadyPromise
}

async function getTfliteRuntime() {
  if (!runtimePromise) {
    runtimePromise = (async () => {
      await ensureCpuBackendReady()
      if (typeof window === 'undefined') {
        throw new Error('TFLite runtime requires a browser environment.')
      }

      // UMD bundle expects tfjs-core on window.
      if (!window.tf) {
        window.tf = tf
      }

      await loadScript(TFLITE_BUNDLE_PATH)
      if (!window.tflite || typeof window.tflite.loadTFLiteModel !== 'function') {
        throw new Error('TFLite runtime did not initialize correctly.')
      }

      window.tflite.setWasmPath(TFLITE_DIST_BASE)
      return window.tflite
    })()
  }
  return runtimePromise
}

async function getModelLabels() {
  if (labels) return labels
  if (!labelsPromise) {
    labelsPromise = fetch(labelsAssetPath)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load model labels (${res.status}).`)
        }
        return res.text()
      })
      .then((text) => {
        labels = text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
        return labels
      })
  }
  return labelsPromise
}

function createInputTensorFromCanvas(canvasElement) {
  const resizedCanvas = document.createElement('canvas')
  resizedCanvas.width = INPUT_SIZE
  resizedCanvas.height = INPUT_SIZE
  const resizedCtx = resizedCanvas.getContext('2d', { willReadFrequently: true })

  resizedCtx.fillStyle = '#ffffff'
  resizedCtx.fillRect(0, 0, INPUT_SIZE, INPUT_SIZE)
  resizedCtx.drawImage(
    canvasElement,
    0,
    0,
    canvasElement.width,
    canvasElement.height,
    0,
    0,
    INPUT_SIZE,
    INPUT_SIZE
  )

  const { data } = resizedCtx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE)
  const grayscale = new Float32Array(INPUT_SIZE * INPUT_SIZE)

  for (let i = 0; i < INPUT_SIZE * INPUT_SIZE; i += 1) {
    const r = data[i * 4]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]
    grayscale[i] = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0
  }

  return tf.tensor4d(grayscale, [1, INPUT_SIZE, INPUT_SIZE, 1], 'float32')
}

function toScoreArray(outputTensor) {
  if (Array.isArray(outputTensor)) {
    if (outputTensor.length === 0) return []
    return toScoreArray(outputTensor[0])
  }

  if (!(outputTensor instanceof tf.Tensor)) return []

  const values = outputTensor.dataSync()
  if (!values) return []
  return Array.from(values)
}

function getTopCategories(scores = [], modelLabels = [], topK = MAX_RESULTS) {
  return scores
    .map((score, index) => ({
      score: Number(score),
      index,
      categoryName: modelLabels[index] || `class_${index}`,
      displayName: modelLabels[index] || `class_${index}`
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}

async function getImageClassifier() {
  if (model) return model
  if (!initPromise) {
    initPromise = (async () => {
      const tfliteRuntime = await getTfliteRuntime()

      try {
        model = await tfliteRuntime.loadTFLiteModel(modelAssetPath, { numThreads: 1 })
        usingInt8Fallback = false
      } catch {
        model = await tfliteRuntime.loadTFLiteModel(modelAssetPathInt8, { numThreads: 1 })
        usingInt8Fallback = true
      }

      return model
    })()
  }
  return initPromise
}

export async function classifyCanvas(canvasElement) {
  if (!canvasElement) {
    throw new Error('Canvas element is not available for classification.')
  }

  let classifier
  let modelLabels

  try {
    ;[classifier, modelLabels] = await Promise.all([
      getImageClassifier(),
      getModelLabels()
    ])
  } catch (err) {
    model = null
    initPromise = null
    runtimePromise = null
    backendReadyPromise = null
    usingInt8Fallback = false
    throw err
  }

  const inputTensor = createInputTensorFromCanvas(canvasElement)
  let outputTensor

  try {
    outputTensor = classifier.predict(inputTensor)
    const scores = toScoreArray(outputTensor)
    const categories = getTopCategories(scores, modelLabels, MAX_RESULTS)

    return {
      classifications: [
        {
          categories,
          metadata: {
            modelVariant: usingInt8Fallback ? 'int8' : 'float16'
          }
        }
      ]
    }
  } finally {
    inputTensor.dispose()

    if (Array.isArray(outputTensor)) {
      outputTensor.forEach((tensor) => {
        if (tensor instanceof tf.Tensor) tensor.dispose()
      })
    } else if (outputTensor instanceof tf.Tensor) {
      outputTensor.dispose()
    }
  }
}
