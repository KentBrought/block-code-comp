import { ImageClassifier, FilesetResolver } from '@mediapipe/tasks-vision'

let imageClassifier
let initPromise

async function getImageClassifier() {
  if (imageClassifier) return imageClassifier
  if (!initPromise) {
    initPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
      )

      imageClassifier = await ImageClassifier.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/image_classifier/efficientnet_lite0/float32/1/efficientnet_lite0.tflite'
        },
        maxResults: 5
      })

      return imageClassifier
    })()
  }
  return initPromise
}

export async function classifyCanvas(canvasElement) {
  if (!canvasElement) {
    throw new Error('Canvas element is not available for classification.')
  }

  const classifier = await getImageClassifier()
  const result = await classifier.classify(canvasElement)

  return result
}
