/* one-time generator: fetches official QuickDraw simplified NDJSON and writes local data */
const fs = require('fs')
const path = require('path')

const modelLabelsPath = path.join(process.cwd(), 'src/constants/modelLabels.js')
const outPath = path.join(process.cwd(), 'src/data/quickdrawGenerated.js')
const BASE_URL = 'https://storage.googleapis.com/quickdraw_dataset/full/simplified'
const CONCURRENCY = 6
const MAX_SCAN_LINES = 5000

function parseModelLabels(fileText) {
  const match = fileText.match(/export const MODEL_LABELS = \[((.|\r|\n)*?)\]/m)
  if (!match) throw new Error('Could not parse MODEL_LABELS')
  const arrText = `[${match[1]}]`
  // eslint-disable-next-line no-eval
  return eval(arrText)
}

function toStrokePoints(stroke) {
  const xs = Array.isArray(stroke?.[0]) ? stroke[0] : []
  const ys = Array.isArray(stroke?.[1]) ? stroke[1] : []
  const n = Math.min(xs.length, ys.length)
  const points = []
  for (let i = 0; i < n; i += 1) points.push({ x: Number(xs[i]) || 0, y: Number(ys[i]) || 0 })
  return points
}

function perpendicularDistance(point, start, end) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  if (dx === 0 && dy === 0) return Math.hypot(point.x - start.x, point.y - start.y)
  const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)
  const projX = start.x + t * dx
  const projY = start.y + t * dy
  return Math.hypot(point.x - projX, point.y - projY)
}

function rdp(points, tolerance) {
  if (points.length <= 2) return points
  let maxDist = -1
  let split = -1
  const start = points[0]
  const end = points[points.length - 1]
  for (let i = 1; i < points.length - 1; i += 1) {
    const d = perpendicularDistance(points[i], start, end)
    if (d > maxDist) {
      maxDist = d
      split = i
    }
  }
  if (maxDist <= tolerance || split < 0) return [start, end]
  const left = rdp(points.slice(0, split + 1), tolerance)
  const right = rdp(points.slice(split), tolerance)
  return [...left.slice(0, -1), ...right]
}

function isAlmostLine(points, tolerance = 2.5) {
  if (points.length < 3) return true
  const start = points[0]
  const end = points[points.length - 1]
  const length = Math.hypot(end.x - start.x, end.y - start.y)
  if (length < 2) return false
  let maxDist = 0
  for (let i = 1; i < points.length - 1; i += 1) {
    maxDist = Math.max(maxDist, perpendicularDistance(points[i], start, end))
  }
  return maxDist <= tolerance
}

function simplifyDrawing(drawing, tolerance = 2.2) {
  return (drawing || [])
    .map(toStrokePoints)
    .filter((stroke) => stroke.length >= 2)
    .map((stroke) => (isAlmostLine(stroke, tolerance) ? [stroke[0], stroke[stroke.length - 1]] : rdp(stroke, tolerance)))
}

function clampStrokePoints(stroke, maxPoints = 24) {
  if (!Array.isArray(stroke) || stroke.length <= maxPoints) return stroke
  const keep = []
  const last = stroke.length - 1
  for (let i = 0; i < maxPoints; i += 1) {
    const idx = Math.round((i / (maxPoints - 1)) * last)
    keep.push(stroke[idx])
  }
  return keep
}

function simplifyDrawingAggressive(drawing) {
  const simplified = simplifyDrawing(drawing, 4.4)
    .map((stroke) => clampStrokePoints(stroke, 22))
    .filter((stroke) => stroke.length >= 2)
  return simplified
}

function pointsToQuickDrawStroke(points) {
  return [
    points.map((p) => Math.round(p.x)),
    points.map((p) => Math.round(p.y))
  ]
}

function scoreComplexity(drawing) {
  const simplified = simplifyDrawingAggressive(drawing)
  const strokeCount = simplified.length
  const pointCount = simplified.reduce((sum, s) => sum + s.length, 0)
  const changes = simplified.reduce((sum, s) => {
    if (s.length < 3) return sum
    let c = 0
    for (let i = 2; i < s.length; i += 1) {
      const a = s[i - 2]
      const b = s[i - 1]
      const d = s[i]
      const ab = Math.atan2(b.y - a.y, b.x - a.x)
      const bc = Math.atan2(d.y - b.y, d.x - b.x)
      const delta = Math.abs(ab - bc)
      if (delta > 0.5) c += 1
    }
    return sum + c
  }, 0)
  return strokeCount * 2 + pointCount * 0.35 + changes * 0.8
}

function difficultyFromScore(score) {
  if (score < 14) return 'very easy'
  if (score < 22) return 'easy'
  if (score < 32) return 'medium'
  if (score < 46) return 'hard'
  return 'very hard'
}

async function fetchOneDrawing(word) {
  const url = `${BASE_URL}/${encodeURIComponent(word)}.ndjson`
  const res = await fetch(url)
  if (!res.ok || !res.body) throw new Error(`${word}: HTTP ${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let scanned = 0

  while (scanned < MAX_SCAN_LINES) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      scanned += 1
      if (!line.trim()) continue
      try {
        const parsed = JSON.parse(line)
        if (parsed?.recognized === true && Array.isArray(parsed?.drawing)) {
          try { await reader.cancel() } catch {}
          return parsed.drawing
        }
      } catch {}
      if (scanned >= MAX_SCAN_LINES) break
    }
  }

  try { await reader.cancel() } catch {}
  throw new Error(`${word}: no recognized drawing in first ${MAX_SCAN_LINES} lines`)
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length)
  let index = 0
  let active = 0
  return new Promise((resolve) => {
    const next = () => {
      if (index >= items.length && active === 0) {
        resolve(results)
        return
      }
      while (active < limit && index < items.length) {
        const i = index++
        active += 1
        Promise.resolve(worker(items[i], i))
          .then((value) => { results[i] = value })
          .catch((error) => { results[i] = { error: error?.message || String(error) } })
          .finally(() => { active -= 1; next() })
      }
    }
    next()
  })
}

function toJsModule(dataMap, difficultyMap, failed) {
  return `/* auto-generated by scripts/generate-quickdraw-local.cjs */\n` +
`export const GENERATED_QUICKDRAW_EXAMPLES = ${JSON.stringify(dataMap, null, 2)}\n\n` +
`export const GENERATED_WORD_DIFFICULTY = ${JSON.stringify(difficultyMap, null, 2)}\n\n` +
`export const GENERATED_QUICKDRAW_FAILED = ${JSON.stringify(failed, null, 2)}\n`
}

async function main() {
  const modelLabelsSrc = fs.readFileSync(modelLabelsPath, 'utf8')
  const words = parseModelLabels(modelLabelsSrc).map((w) => String(w || '').trim()).filter(Boolean)

  console.log(`Fetching QuickDraw examples for ${words.length} words...`)
  const rows = await mapLimit(words, CONCURRENCY, async (word, idx) => {
    const drawing = await fetchOneDrawing(word)
    const simplified = simplifyDrawingAggressive(drawing)
    const compactDrawing = simplified.map(pointsToQuickDrawStroke)
    const score = scoreComplexity(compactDrawing)
    const difficulty = difficultyFromScore(score)
    console.log(`[${idx + 1}/${words.length}] ${word} -> ${difficulty}`)
    return { word, drawing: compactDrawing, difficulty }
  })

  const dataMap = {}
  const difficultyMap = {}
  const failed = []

  for (const row of rows) {
    if (!row || row.error) {
      failed.push(row?.error || 'unknown error')
      continue
    }
    dataMap[row.word.toLowerCase()] = [row.drawing]
    difficultyMap[row.word.toLowerCase()] = row.difficulty
  }

  fs.writeFileSync(outPath, toJsModule(dataMap, difficultyMap, failed), 'utf8')
  console.log(`Wrote: ${outPath}`)
  console.log(`Success: ${Object.keys(dataMap).length}, Failed: ${failed.length}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
