// Tolerance zone around each ghost line/circle (px).
// A user stroke within this band counts as "on target".
const TOLERANCE_PX = 20

// Fraction of user's drawn pixels that must fall inside the tolerance zone.
const SCORE_THRESHOLD = 0.65

// Minimum drawn pixels before we attempt scoring (avoids divide-by-zero
// and trivial wins from a single dot inside the ghost zone).
const MIN_USER_PIXELS = 300

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
  let overlap = 0

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
  return { score, pass: score >= SCORE_THRESHOLD }
}
