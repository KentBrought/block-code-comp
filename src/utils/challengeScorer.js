// Tolerance zone around each ghost line/circle (px).
// A user stroke within this band counts as "on target".
const TOLERANCE_PX = 20

// Fraction of user's drawn pixels that must fall inside the tolerance zone.
const SCORE_THRESHOLD = 0.65
// Fraction of ghost target pixels that must be covered by user drawing.
// Note: ghost is rendered with a wide tolerance band (20px), while the
// turtle's default pen is much thinner (3px). A perfect thin stroke only
// covers a small fraction of that wide target band, so this threshold must
// be calibrated accordingly.
const GHOST_COVERAGE_THRESHOLD = 0.12

// Minimum drawn pixels before we attempt scoring (avoids divide-by-zero).
// Ghost coverage threshold already prevents trivial dot-wins, so this just
// needs to be above a literal single-pixel tap.
const MIN_USER_PIXELS = 50

function hasDrawnNearPixel(userData, width, height, px, py, radiusPx) {
  const x0 = Math.max(0, Math.floor(px - radiusPx))
  const x1 = Math.min(width - 1, Math.ceil(px + radiusPx))
  const y0 = Math.max(0, Math.floor(py - radiusPx))
  const y1 = Math.min(height - 1, Math.ceil(py + radiusPx))
  const r2 = radiusPx * radiusPx
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const dx = x - px
      const dy = y - py
      if (dx * dx + dy * dy > r2) continue
      const i = (y * width + x) * 4
      const r = userData[i]
      const g = userData[i + 1]
      const b = userData[i + 2]
      if (r < 240 || g < 240 || b < 240) return true
    }
  }
  return false
}

/**
 * Sample points along each edge of closed polylines and require user ink
 * near the centerline (prevents "missing side" wins on thick ghost tolerance).
 */
function closedPolylineEdgeHitRatio(ghostPreview, userData, width, height, toX, toY, samplesPerEdge) {
  const samples = []
  for (const line of ghostPreview.lines || []) {
    if (!line?.close || !line.points || line.points.length < 3) continue
    const pts = line.points
    const n = pts.length
    for (let i = 0; i < n; i += 1) {
      const a = pts[i]
      const b = pts[(i + 1) % n]
      for (let s = 0; s < samplesPerEdge; s += 1) {
        const t = (s + 0.5) / samplesPerEdge
        const gx = a.x + (b.x - a.x) * t
        const gy = a.y + (b.y - a.y) * t
        samples.push({ x: toX(gx), y: toY(gy) })
      }
    }
  }
  if (samples.length === 0) return null

  const nearRadius = TOLERANCE_PX + 6
  let hits = 0
  for (const p of samples) {
    if (hasDrawnNearPixel(userData, width, height, p.x, p.y, nearRadius)) hits += 1
  }
  return hits / samples.length
}

/**
 * Scores the user's drawing against the ghost preview shape.
 *
 * Strategy: render the ghost with a thick solid stroke (tolerance zone)
 * onto an offscreen canvas, then measure what fraction of the user's
 * drawn pixels land inside that zone.
 *
 * @param {HTMLCanvasElement} drawingCanvas  The hidden canvas with only
 *   the user's pen strokes (white background).
 * @param {object} ghostPreview  Challenge ghostPreview ({lines?, circles?}).
 * @returns {{ score: number, pass: boolean }}
 */
export function scoreDrawingAgainstGhost(drawingCanvas, ghostPreview) {
  if (!drawingCanvas || !ghostPreview) return { score: 0, pass: false }

  const w = drawingCanvas.width
  const h = drawingCanvas.height
  if (w === 0 || h === 0) return { score: 0, pass: false }

  // Coordinate helpers — same transform used in DrawingCanvas.
  const toX = (x) => w / 2 + x
  const toY = (y) => h / 2 - y

  // Build an offscreen canvas with a thick solid ghost zone.
  const ghostCanvas = document.createElement('canvas')
  ghostCanvas.width = w
  ghostCanvas.height = h
  const gCtx = ghostCanvas.getContext('2d')

  gCtx.fillStyle = '#ffffff'
  gCtx.fillRect(0, 0, w, h)
  gCtx.strokeStyle = '#000000'
  gCtx.lineWidth = TOLERANCE_PX
  gCtx.lineCap = 'round'
  gCtx.lineJoin = 'round'
  gCtx.setLineDash([]) // solid for pixel comparison

  for (const line of ghostPreview.lines || []) {
    if (!line?.points || line.points.length < 2) continue
    gCtx.beginPath()
    gCtx.moveTo(toX(line.points[0].x), toY(line.points[0].y))
    for (let i = 1; i < line.points.length; i++) {
      gCtx.lineTo(toX(line.points[i].x), toY(line.points[i].y))
    }
    if (line.close) gCtx.closePath()
    gCtx.stroke()
  }

  for (const circle of ghostPreview.circles || []) {
    if (typeof circle?.r !== 'number') continue
    gCtx.beginPath()
    gCtx.arc(toX(circle.x ?? 0), toY(circle.y ?? 0), circle.r, 0, 2 * Math.PI)
    gCtx.stroke()
  }

  const ghostData = gCtx.getImageData(0, 0, w, h).data
  const userData = drawingCanvas.getContext('2d').getImageData(0, 0, w, h).data

  let userPixels = 0
  let ghostPixels = 0
  let overlap = 0

  for (let i = 0; i < ghostData.length; i += 4) {
    if (ghostData[i] < 128) ghostPixels++
  }

  for (let i = 0; i < userData.length; i += 4) {
    const r = userData[i]
    const g = userData[i + 1]
    const b = userData[i + 2]
    // Any non-white pixel counts as drawn.
    const isDrawn = r < 240 || g < 240 || b < 240
    if (!isDrawn) continue

    userPixels++
    // Ghost zone pixel: we drew black on white, so R < 128 = inside zone.
    if (ghostData[i] < 128) overlap++
  }

  if (userPixels < MIN_USER_PIXELS) return { score: 0, pass: false }

  const score = overlap / userPixels
  const ghostCoverage = ghostPixels > 0 ? overlap / ghostPixels : 0
  const basePass = score >= SCORE_THRESHOLD && ghostCoverage >= GHOST_COVERAGE_THRESHOLD

  const ec = ghostPreview.edgeCoverage
  if (!ec || basePass === false) {
    return { score, pass: basePass, ghostCoverage }
  }

  const samplesPerEdge = Number.isFinite(ec.samplesPerEdge) ? ec.samplesPerEdge : 12
  const minHit = Number.isFinite(ec.minHitRatio) ? ec.minHitRatio : 0.82
  const edgeHitRatio = closedPolylineEdgeHitRatio(ghostPreview, userData, w, h, toX, toY, samplesPerEdge)
  if (edgeHitRatio == null) {
    return { score, pass: basePass, ghostCoverage }
  }

  const edgePass = edgeHitRatio >= minHit
  return {
    score,
    pass: basePass && edgePass,
    ghostCoverage,
    edgeHitRatio
  }
}
