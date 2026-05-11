import { GENERATED_QUICKDRAW_EXAMPLES } from '../data/quickdrawGenerated'

const QUICKDRAW_BASE_URLS = [
  'https://storage.googleapis.com/quickdraw_dataset/full/simplified'
]
const QUICKDRAW_API_HOST = 'https://quickdrawfiles.appspot.com'
const QUICKDRAW_DEMO_API_KEY = 'AIzaSyC0U3yLy_m6u7aOMi9YJL2w1vWG4oI5mj0'
const USE_REMOTE_QUICKDRAW_FETCH = false

const exampleCache = new Map()
const inflightCache = new Map()

function stroke(points = []) {
  return [points.map((p) => p[0]), points.map((p) => p[1])]
}

function drawing(...strokes) {
  return strokes
}

const LOCAL_QUICKDRAW_EXAMPLES = {
  square: [drawing(stroke([[30, 30], [220, 30], [220, 220], [30, 220], [30, 30]]))],
  triangle: [drawing(stroke([[128, 24], [230, 220], [26, 220], [128, 24]]))],
  circle: [drawing(stroke([[128, 24], [190, 40], [230, 100], [230, 160], [190, 220], [128, 236], [66, 220], [26, 160], [26, 100], [66, 40], [128, 24]]))],
  door: [drawing(stroke([[70, 30], [186, 30], [186, 232], [70, 232], [70, 30]]), stroke([[164, 130], [164, 130]]))],
  sun: [drawing(stroke([[128, 56], [160, 64], [184, 88], [192, 120], [184, 152], [160, 176], [128, 184], [96, 176], [72, 152], [64, 120], [72, 88], [96, 64], [128, 56]]), stroke([[128, 18], [128, 0]]), stroke([[128, 238], [128, 256]]), stroke([[18, 128], [0, 128]]), stroke([[238, 128], [256, 128]]))],
  house: [drawing(stroke([[32, 120], [128, 36], [224, 120]]), stroke([[52, 120], [52, 230], [204, 230], [204, 120]]), stroke([[110, 230], [110, 160], [146, 160], [146, 230]]))],
  tree: [drawing(stroke([[128, 28], [176, 74], [156, 130], [100, 130], [80, 74], [128, 28]]), stroke([[118, 130], [138, 130], [138, 230], [118, 230], [118, 130]]))],
  flower: [drawing(stroke([[128, 114], [152, 114], [164, 128], [152, 142], [128, 142], [116, 128], [128, 114]]), stroke([[128, 86], [150, 98], [128, 114], [106, 98], [128, 86]]), stroke([[156, 128], [170, 106], [184, 128], [170, 150], [156, 128]]), stroke([[128, 142], [150, 156], [128, 170], [106, 156], [128, 142]]), stroke([[100, 128], [86, 106], [72, 128], [86, 150], [100, 128]]), stroke([[128, 170], [128, 234]]))],
  star: [drawing(stroke([[128, 22], [154, 92], [230, 92], [168, 138], [192, 214], [128, 168], [64, 214], [88, 138], [26, 92], [102, 92], [128, 22]]))],
  cat: [drawing(stroke([[54, 102], [82, 60], [110, 96], [146, 96], [174, 60], [202, 102], [202, 186], [54, 186], [54, 102]]), stroke([[92, 130], [92, 130]]), stroke([[164, 130], [164, 130]]), stroke([[108, 158], [146, 158]]))],
  dog: [drawing(stroke([[54, 112], [72, 76], [110, 96], [162, 96], [194, 122], [194, 184], [54, 184], [54, 112]]), stroke([[72, 116], [58, 140]]), stroke([[180, 140], [194, 116]]))],
  fish: [drawing(stroke([[24, 128], [84, 84], [164, 84], [220, 128], [164, 172], [84, 172], [24, 128]]), stroke([[220, 128], [248, 96], [248, 160], [220, 128]]), stroke([[96, 118], [96, 118]]))],
  moon: [drawing(stroke([[166, 34], [130, 34], [92, 58], [74, 92], [74, 140], [98, 186], [132, 210], [172, 210], [146, 188], [130, 162], [124, 130], [128, 98], [142, 64], [166, 34]]))],
  car: [drawing(stroke([[34, 168], [62, 130], [190, 130], [222, 168], [222, 196], [34, 196], [34, 168]]), stroke([[82, 196], [82, 196]]), stroke([[176, 196], [176, 196]]))],
  bicycle: [drawing(stroke([[64, 186], [64, 186]]), stroke([[194, 186], [194, 186]]), stroke([[64, 186], [112, 128], [146, 186], [94, 186], [128, 140], [168, 140]]))],
  boat: [drawing(stroke([[36, 170], [220, 170], [178, 214], [78, 214], [36, 170]]), stroke([[118, 170], [118, 68], [182, 118], [118, 118]]))],
  airplane: [drawing(stroke([[20, 128], [236, 128]]), stroke([[96, 128], [146, 82], [146, 174], [96, 128]]), stroke([[186, 128], [220, 98], [220, 158], [186, 128]]))],
  bird: [drawing(stroke([[32, 146], [80, 104], [126, 146], [174, 104], [224, 146]]))],
  rabbit: [drawing(stroke([[92, 62], [82, 12], [108, 56]]), stroke([[146, 62], [160, 10], [166, 62]]), stroke([[70, 114], [90, 88], [156, 88], [186, 120], [176, 176], [130, 206], [82, 184], [70, 114]]))],
  bridge: [drawing(stroke([[24, 182], [232, 182]]), stroke([[42, 182], [72, 138], [106, 118], [146, 118], [184, 138], [214, 182]]), stroke([[84, 182], [84, 230]]), stroke([[170, 182], [170, 230]]))],
  castle: [drawing(stroke([[36, 78], [96, 78], [96, 58], [132, 58], [132, 78], [220, 78], [220, 230], [36, 230], [36, 78]]), stroke([[82, 230], [82, 170], [118, 170], [118, 230]]), stroke([[160, 230], [160, 158], [192, 158], [192, 230]]))],
  octopus: [drawing(stroke([[128, 74], [172, 92], [190, 130], [182, 164], [74, 164], [66, 130], [84, 92], [128, 74]]), stroke([[82, 164], [56, 198], [46, 232]]), stroke([[102, 164], [88, 200], [84, 232]]), stroke([[124, 164], [122, 198], [126, 232]]), stroke([[146, 164], [154, 198], [168, 232]]), stroke([[168, 164], [188, 198], [210, 232]]))],
  dragon: [drawing(stroke([[28, 164], [78, 132], [120, 92], [178, 88], [224, 116], [198, 146], [164, 154], [178, 176], [162, 198], [118, 196], [94, 170], [70, 186], [28, 164]]), stroke([[196, 120], [226, 100], [214, 130]]))],
  helicopter: [drawing(stroke([[58, 146], [198, 146], [222, 166], [198, 186], [58, 186], [58, 146]]), stroke([[126, 146], [126, 98]]), stroke([[60, 98], [196, 98]]), stroke([[38, 204], [220, 204]]))],
  saxophone: [drawing(stroke([[176, 34], [142, 70], [146, 108], [176, 132], [168, 168], [142, 190], [116, 212], [114, 236]]), stroke([[176, 132], [212, 120], [232, 138]])), drawing(stroke([[170, 42], [190, 58], [174, 74], [154, 58], [170, 42]]))]
}

function hashWord(input = '') {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function createFallbackDrawing(category = '') {
  const seed = hashWord(category)
  const cx = 128
  const cy = 128
  const radius = 72 + (seed % 28)
  const points = []
  const sides = 5 + (seed % 4)
  for (let i = 0; i < sides; i += 1) {
    const angle = (Math.PI * 2 * i) / sides
    points.push([
      Math.round(cx + Math.cos(angle) * radius),
      Math.round(cy + Math.sin(angle) * radius)
    ])
  }
  points.push(points[0])
  return drawing(stroke(points))
}

function toStrokePoints(stroke = []) {
  const xPoints = Array.isArray(stroke[0]) ? stroke[0] : []
  const yPoints = Array.isArray(stroke[1]) ? stroke[1] : []
  const count = Math.min(xPoints.length, yPoints.length)
  const points = []
  for (let i = 0; i < count; i += 1) {
    points.push({ x: Number(xPoints[i]) || 0, y: Number(yPoints[i]) || 0 })
  }
  return points
}

function perpendicularDistance(point, start, end) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  if (dx === 0 && dy === 0) {
    const px = point.x - start.x
    const py = point.y - start.y
    return Math.hypot(px, py)
  }
  const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)
  const projX = start.x + t * dx
  const projY = start.y + t * dy
  return Math.hypot(point.x - projX, point.y - projY)
}

function rdp(points, tolerance) {
  if (points.length <= 2) return points

  let maxDist = -1
  let splitIndex = -1
  const start = points[0]
  const end = points[points.length - 1]

  for (let i = 1; i < points.length - 1; i += 1) {
    const dist = perpendicularDistance(points[i], start, end)
    if (dist > maxDist) {
      maxDist = dist
      splitIndex = i
    }
  }

  if (maxDist <= tolerance || splitIndex < 0) {
    return [start, end]
  }

  const left = rdp(points.slice(0, splitIndex + 1), tolerance)
  const right = rdp(points.slice(splitIndex), tolerance)
  return [...left.slice(0, -1), ...right]
}

export function isAlmostLine(points = [], tolerance = 2.5) {
  if (points.length < 3) return true
  const start = points[0]
  const end = points[points.length - 1]
  const segmentLength = Math.hypot(end.x - start.x, end.y - start.y)
  if (segmentLength < 2) return false

  let maxDist = 0
  for (let i = 1; i < points.length - 1; i += 1) {
    maxDist = Math.max(maxDist, perpendicularDistance(points[i], start, end))
  }
  return maxDist <= tolerance
}

export function simplifyStroke(points = [], tolerance = 2.2) {
  if (points.length <= 2) return points
  if (isAlmostLine(points, tolerance)) {
    return [points[0], points[points.length - 1]]
  }
  return rdp(points, tolerance)
}

export function simplifyDrawing(drawing = [], tolerance = 2.2) {
  return drawing
    .map(toStrokePoints)
    .filter((stroke) => stroke.length >= 2)
    .map((stroke) => simplifyStroke(stroke, tolerance))
}

export function normalizeStrokesToBox(strokes = [], size = 64, padding = 4) {
  const allPoints = strokes.flat()
  if (allPoints.length === 0) return []

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of allPoints) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }

  const width = Math.max(1, maxX - minX)
  const height = Math.max(1, maxY - minY)
  const drawable = Math.max(1, size - padding * 2)
  const scale = Math.min(drawable / width, drawable / height)
  const offsetX = (size - width * scale) / 2
  const offsetY = (size - height * scale) / 2

  return strokes.map((stroke) =>
    stroke.map((p) => ({
      x: (p.x - minX) * scale + offsetX,
      y: (p.y - minY) * scale + offsetY
    }))
  )
}

async function fetchExamplesFromUrl(url, count) {
  const response = await fetch(url)
  if (!response.ok || !response.body) {
    throw new Error(`Failed to load examples (${response.status})`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  const examples = []

  while (examples.length < count) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const parsed = JSON.parse(line)
        if (parsed?.recognized === true && Array.isArray(parsed?.drawing)) {
          examples.push(parsed.drawing)
          if (examples.length >= count) break
        }
      } catch {
        // Skip malformed line and keep parsing.
      }
    }
  }

  try {
    await reader.cancel()
  } catch {
    // Ignore cancellation errors.
  }

  return examples
}

async function fetchExamplesFromQuickDrawApi(category, count) {
  const safeCategory = encodeURIComponent((category || '').trim())
  if (!safeCategory) return []

  const examples = []
  const seen = new Set()
  const attempts = Math.max(count * 3, count)

  for (let i = 0; i < attempts && examples.length < count; i += 1) {
    const url = `${QUICKDRAW_API_HOST}/drawing/${safeCategory}?id=random&key=${QUICKDRAW_DEMO_API_KEY}&isAnimated=false&format=json`
    const response = await fetch(url)
    if (!response.ok) continue

    let parsed = null
    try {
      parsed = await response.json()
    } catch {
      parsed = null
    }
    if (!parsed) continue

    const candidate = Array.isArray(parsed?.drawing) ? parsed : (Array.isArray(parsed) ? { drawing: parsed } : null)
    if (!candidate || !Array.isArray(candidate.drawing)) continue

    const key = String(candidate.key_id || candidate.id || `${candidate.word || ''}-${i}`)
    if (seen.has(key)) continue
    seen.add(key)
    examples.push(candidate.drawing)
  }

  return examples
}

async function fetchExamplesInternal(category, count) {
  const safeCategory = encodeURIComponent((category || '').trim())
  if (!safeCategory) return []
  const key = decodeURIComponent(safeCategory).toLowerCase()

  if (LOCAL_QUICKDRAW_EXAMPLES[key]) {
    return LOCAL_QUICKDRAW_EXAMPLES[key].slice(0, count)
  }
  if (GENERATED_QUICKDRAW_EXAMPLES[key]) {
    return GENERATED_QUICKDRAW_EXAMPLES[key].slice(0, count)
  }
  if (!USE_REMOTE_QUICKDRAW_FETCH) {
    return [createFallbackDrawing(key)]
  }

  try {
    const apiExamples = await fetchExamplesFromQuickDrawApi(category, count)
    if (apiExamples.length > 0) return apiExamples
  } catch {
    // Fall through to additional sources.
  }

  let lastError = null
  for (const baseUrl of QUICKDRAW_BASE_URLS) {
    const url = `${baseUrl}/${safeCategory}.ndjson`
    try {
      const examples = await fetchExamplesFromUrl(url, count)
      if (examples.length > 0) {
        return examples
      }
    } catch (error) {
      lastError = error
    }
  }

  throw lastError || new Error('Failed to load QuickDraw examples from all sources')
}

export async function fetchQuickDrawExamples(category, count = 2) {
  const key = (category || '').trim().toLowerCase()
  if (!key) return []

  const cached = exampleCache.get(key) || []
  if (cached.length >= count) {
    return cached.slice(0, count)
  }

  if (inflightCache.has(key)) {
    const pending = await inflightCache.get(key)
    return pending.slice(0, count)
  }

  const request = fetchExamplesInternal(category, Math.max(1, count)).then((examples) => {
    const merged = [...cached, ...examples].slice(0, Math.max(1, count))
    exampleCache.set(key, merged)
    return merged
  })

  inflightCache.set(key, request)
  try {
    return (await request).slice(0, count)
  } finally {
    inflightCache.delete(key)
  }
}

export function drawingToGhostPreview(drawing, options = {}) {
  if (!Array.isArray(drawing) || drawing.length === 0) return null
  const tolerance = Number.isFinite(options.tolerance) ? options.tolerance : 2.6
  const targetSize = Number.isFinite(options.size) ? options.size : 220

  const simplified = simplifyDrawing(drawing, tolerance)
  if (!simplified.length) return null

  const normalized = normalizeStrokesToBox(simplified, targetSize, 10)
  const half = targetSize / 2
  const lines = normalized
    .filter((stroke) => stroke.length >= 2)
    .map((stroke) => ({
      points: stroke.map((p) => ({
        x: Number((p.x - half).toFixed(2)),
        y: Number((half - p.y).toFixed(2))
      })),
      close: false
    }))

  if (!lines.length) return null
  return { lines, circles: [] }
}
