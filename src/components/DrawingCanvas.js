import React, { useRef, useEffect, useState } from 'react'
import { scoreDrawingAgainstGhost } from '../utils/challengeScorer'

const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg'
const POINTER_TWEMOJI = {
  turtle: `${TWEMOJI_BASE}/1f422.svg`,
  paintbrush: `${TWEMOJI_BASE}/1f58c-fe0f.svg`,
  pencil: `${TWEMOJI_BASE}/270f-fe0f.svg`,
  crayon: `${TWEMOJI_BASE}/1f58d-fe0f.svg`,
  pen: `${TWEMOJI_BASE}/1f58a-fe0f.svg`,
  cat: `${TWEMOJI_BASE}/1f408.svg`,
  dog: `${TWEMOJI_BASE}/1f415.svg`,
  llama: `${TWEMOJI_BASE}/1f999.svg`,
  giraffe: `${TWEMOJI_BASE}/1f992.svg`,
  pig: `${TWEMOJI_BASE}/1f416.svg`,
  sheep: `${TWEMOJI_BASE}/1f411.svg`,
  tiger: `${TWEMOJI_BASE}/1f405.svg`
}

const DrawingCanvas = ({
  commands,
  runSequence,
  stopSequence,
  onHighlight,
  onChallengeScore,
  onRunStateChange,
  ghostPreview,
  scoreGhostPreview,
  defaultPointerStyle = 'arrow'
}) => {
  const bgCanvasRef = useRef(null)
  const markerCanvasRef = useRef(null)
  const drawingCanvasRef = useRef(null) // offscreen canvas with drawing only
  const containerRef = useRef(null)
  const runIdRef = useRef(0)
  const executedRunSequenceRef = useRef(0)
  const commandsRef = useRef(commands)
  const onHighlightRef = useRef(onHighlight)
  const onChallengeScoreRef = useRef(onChallengeScore)
  const onRunStateChangeRef = useRef(onRunStateChange)
  const ghostPreviewRef = useRef(ghostPreview)
  const scoreGhostPreviewRef = useRef(scoreGhostPreview)
  const gridVisibleRef = useRef(true)
  const viewScaleRef = useRef(1)
  const pointerImageCacheRef = useRef(new Map())
  const markerStateRef = useRef({ x: 0, y: 0, angle: 0, pointerStyle: 'arrow' })

  useEffect(() => {
    commandsRef.current = commands
    onHighlightRef.current = onHighlight
    onChallengeScoreRef.current = onChallengeScore
    onRunStateChangeRef.current = onRunStateChange
    ghostPreviewRef.current = ghostPreview
    scoreGhostPreviewRef.current = scoreGhostPreview
  }, [commands, onHighlight, onChallengeScore, onRunStateChange, ghostPreview, scoreGhostPreview])

  useEffect(() => {
    runIdRef.current += 1
    if (onHighlightRef.current) onHighlightRef.current(null)
    if (onRunStateChangeRef.current) onRunStateChangeRef.current(false)
  }, [stopSequence])

  // Resize both canvases to match their container whenever container size changes
  useEffect(() => {
    const bgCanvas = bgCanvasRef.current
    const markerCanvas = markerCanvasRef.current
    let drawingCanvas = drawingCanvasRef.current
    const container = containerRef.current
    const resize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      if (bgCanvas.width !== w || bgCanvas.height !== h) {
        bgCanvas.width = w
        bgCanvas.height = h
        markerCanvas.width = w
        markerCanvas.height = h

        if (!drawingCanvas) {
          drawingCanvas = document.createElement('canvas')
          drawingCanvasRef.current = drawingCanvas
        }
        drawingCanvas.width = w
        drawingCanvas.height = h

        const drawingCtx = drawingCanvas.getContext('2d')
        drawingCtx.clearRect(0, 0, w, h)
        drawingCtx.fillStyle = '#ffffff'
        drawingCtx.fillRect(0, 0, w, h)

        const bgCtx = bgCanvas.getContext('2d')
        drawGrid(bgCanvas, bgCtx)
        drawGhostPreview(bgCanvas, bgCtx, ghostPreviewRef.current)
        drawMarkerAt(
          markerCanvas,
          markerCanvas.getContext('2d'),
          w / 2,
          h / 2,
          0,
          defaultPointerStyle
        )
        applyViewScale()
      }
    }
    const ro = new ResizeObserver(resize)
    ro.observe(container)
    resize()
    return () => ro.disconnect()
  }, [])

  // Helpers defined outside the run effect so resize can call them
  function drawGrid(canvas, ctx) {
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    if (!gridVisibleRef.current) return

    const step = 50
    const cx = Math.round(w / 2)
    const cy = Math.round(h / 2)

    ctx.save()
    ctx.strokeStyle = '#e8ecf0'
    ctx.lineWidth = 1
    // Vertical lines
    for (let x = cx % step; x <= w; x += step) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    // Horizontal lines
    for (let y = cy % step; y <= h; y += step) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    // Axis lines
    ctx.strokeStyle = '#c8ced6'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(cx, 0)
    ctx.lineTo(cx, h)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, cy)
    ctx.lineTo(w, cy)
    ctx.stroke()

    // Axis labels
    ctx.fillStyle = '#9ba8b5'
    ctx.font = '10px Inter, sans-serif'
    ctx.textAlign = 'center'
    // X-axis numbers
    for (let x = cx + step; x < w; x += step) {
      ctx.fillText(x - cx, x, cy - 4)
    }
    for (let x = cx - step; x >= 0; x -= step) {
      ctx.fillText(x - cx, x, cy - 4)
    }
    // Y-axis numbers (inverted, y grows down on canvas)
    ctx.textAlign = 'right'
    for (let y = cy - step; y >= 0; y -= step) {
      ctx.fillText(cy - y, cx - 4, y + 3)
    }
    for (let y = cy + step; y <= h; y += step) {
      ctx.fillText(cy - y, cx - 4, y + 3)
    }

    ctx.restore()
  }

  function applyViewScale() {
    const scale = viewScaleRef.current
    const transform = `scale(${scale})`
    const origin = '50% 50%'
    if (bgCanvasRef.current) {
      bgCanvasRef.current.style.transform = transform
      bgCanvasRef.current.style.transformOrigin = origin
    }
    if (markerCanvasRef.current) {
      markerCanvasRef.current.style.transform = transform
      markerCanvasRef.current.style.transformOrigin = origin
    }
  }

  function drawGhostPreview(canvas, ctx, preview) {
    if (!preview) return
    const w = canvas.width
    const h = canvas.height
    const toCanvasX = (x) => w / 2 + x
    const toCanvasY = (y) => h / 2 - y

    ctx.save()
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.28)'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.setLineDash([10, 8])

    const lines = preview.lines || []
    for (const line of lines) {
      if (!line || !line.points || line.points.length < 2) continue
      ctx.beginPath()
      ctx.moveTo(toCanvasX(line.points[0].x), toCanvasY(line.points[0].y))
      for (let i = 1; i < line.points.length; i += 1) {
        const p = line.points[i]
        ctx.lineTo(toCanvasX(p.x), toCanvasY(p.y))
      }
      if (line.close) {
        ctx.closePath()
      }
      ctx.stroke()
    }

    const circles = preview.circles || []
    for (const circle of circles) {
      if (!circle || typeof circle.r !== 'number') continue
      ctx.beginPath()
      ctx.arc(toCanvasX(circle.x || 0), toCanvasY(circle.y || 0), circle.r, 0, 2 * Math.PI)
      ctx.stroke()
    }

    ctx.restore()
  }
  // Draws marker exclusively on the clear overlay canvas
  function getPointerTwemojiImage(pointerStyle, onReady) {
    const src = POINTER_TWEMOJI[pointerStyle]
    if (!src) return null

    const cached = pointerImageCacheRef.current.get(src)
    if (cached) {
      return cached.complete ? cached : null
    }

    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.src = src
    img.onload = () => {
      if (typeof onReady === 'function') onReady()
    }
    pointerImageCacheRef.current.set(src, img)
    return null
  }

  function drawMarkerAt(canvas, ctx, x, y, angle, pointerStyle = 'arrow') {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    markerStateRef.current = { x, y, angle, pointerStyle }
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((angle * Math.PI) / 180)

    const image = getPointerTwemojiImage(pointerStyle, () => {
      const markerCanvas = markerCanvasRef.current
      if (!markerCanvas) return
      const markerCtx = markerCanvas.getContext('2d')
      const marker = markerStateRef.current
      drawMarkerAt(markerCanvas, markerCtx, marker.x, marker.y, marker.angle, marker.pointerStyle)
    })

    if (image) {
      const size = 26
      ctx.scale(-1, 1)
      ctx.drawImage(image, -size / 2, -size / 2, size, size)
    } else {
      ctx.fillStyle = '#e63946'
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(14, 0)
      ctx.lineTo(-7, -7)
      ctx.lineTo(-4, 0)
      ctx.lineTo(-7, 7)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }
    ctx.restore()
  }
  useEffect(() => {
    const runId = ++runIdRef.current
    const isStale = () => runIdRef.current !== runId
    const assertActive = () => {
      if (isStale()) throw new Error('__RUN_CANCELLED__')
    }

    const bgCanvas = bgCanvasRef.current
    const bgCtx = bgCanvas.getContext('2d')
    const markerCanvas = markerCanvasRef.current
    const markerCtx = markerCanvas.getContext('2d')
    const drawingCanvas = drawingCanvasRef.current
    const drawCtx = drawingCanvas
      ? drawingCanvas.getContext('2d')
      : null

    let curX = bgCanvas.width / 2
    let curY = bgCanvas.height / 2
    let curAngle = 0
    let curPenDown = true
    let curColor = '#4361ee'
    let curSize = 3
    let curPointerStyle = defaultPointerStyle

    const resetAndDraw = () => {
      drawGrid(bgCanvas, bgCtx)
      drawGhostPreview(bgCanvas, bgCtx, ghostPreviewRef.current)

      if (drawCtx) {
        drawCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height)
        drawCtx.fillStyle = '#ffffff'
        drawCtx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height)
      }
      curX = bgCanvas.width / 2
      curY = bgCanvas.height / 2
      curAngle = 0
      curPenDown = true
      curColor = '#4361ee'
      curSize = 3
      curPointerStyle = defaultPointerStyle
      bgCtx.strokeStyle = curColor
      bgCtx.lineWidth = curSize
      bgCtx.lineCap = 'round'
      bgCtx.lineJoin = 'round'
      bgCtx.beginPath()
      bgCtx.moveTo(curX, curY)

      if (drawCtx) {
        drawCtx.strokeStyle = curColor
        drawCtx.lineWidth = curSize
        drawCtx.lineCap = 'round'
        drawCtx.lineJoin = 'round'
        drawCtx.beginPath()
        drawCtx.moveTo(curX, curY)
      }
    }

    const runCommandsAsync = async () => {
      try {
        assertActive()
        resetAndDraw()
        if (onRunStateChangeRef.current) onRunStateChangeRef.current(true)

      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
      const STEP_MS = 300
      let activeStepStartedAt = Date.now()
      let activeStepBlockId = null

      const syncCanvases = () => {
        assertActive()
        bgCtx.stroke()
        if (drawCtx) {
          drawCtx.stroke()
        }
        drawMarkerAt(markerCanvas, markerCtx, curX, curY, curAngle, curPointerStyle)
      }

      const moveTo = (x, y) => {
        if (curPenDown) bgCtx.lineTo(x, y)
        else bgCtx.moveTo(x, y)

        if (drawCtx) {
          if (curPenDown) drawCtx.lineTo(x, y)
          else drawCtx.moveTo(x, y)
        }

        curX = x
        curY = y
        syncCanvases()
      }

      const animateTo = async (targetX, targetY, targetAngle, animateMove, animateRotate) => {
        if (!animateMove && !animateRotate) {
          curX = targetX
          curY = targetY
          curAngle = targetAngle
          bgCtx.moveTo(curX, curY)
          if (drawCtx) {
            drawCtx.moveTo(curX, curY)
          }
          syncCanvases()
          return
        }

        const startX = curX
        const startY = curY
        const startAngle = curAngle
        const durationMs = STEP_MS
        const steps = 12

        for (let i = 1; i <= steps; i++) {
          assertActive()
          const t = i / steps
          const nextX = animateMove ? startX + (targetX - startX) * t : targetX
          const nextY = animateMove ? startY + (targetY - startY) * t : targetY
          const nextAngle = animateRotate
            ? startAngle + (targetAngle - startAngle) * t
            : targetAngle

          if (animateMove && curPenDown) {
            bgCtx.lineTo(nextX, nextY)
            if (drawCtx) drawCtx.lineTo(nextX, nextY)
          } else {
            bgCtx.moveTo(nextX, nextY)
            if (drawCtx) drawCtx.moveTo(nextX, nextY)
          }

          curX = nextX
          curY = nextY
          curAngle = nextAngle
          syncCanvases()
          await sleep(durationMs / steps)
        }

        bgCtx.moveTo(curX, curY)
        if (drawCtx) {
          drawCtx.moveTo(curX, curY)
        }
      }

      const recenterPathHeads = () => {
        bgCtx.moveTo(curX, curY)
        if (drawCtx) {
          drawCtx.moveTo(curX, curY)
        }
      }

      const finishStep = async () => {
        const elapsed = Date.now() - activeStepStartedAt
        const remaining = STEP_MS - elapsed
        if (remaining > 0) {
          await sleep(remaining)
        }
      }

      const redrawComposite = () => {
        drawGrid(bgCanvas, bgCtx)
        drawGhostPreview(bgCanvas, bgCtx, ghostPreviewRef.current)
        if (drawingCanvas) {
          bgCtx.drawImage(drawingCanvas, 0, 0)
        }
      }

      const api = {
        highlightBlock: (id) => {
          if (onHighlightRef.current) {
            onHighlightRef.current(id == null ? null : String(id))
          }
        },
        moveForward: async (value = 0) => {
          assertActive()
          const rad = (curAngle * Math.PI) / 180
          const targetX = curX + Math.cos(rad) * value
          const targetY = curY + Math.sin(rad) * value
          await animateTo(targetX, targetY, curAngle, true, false)
          await finishStep()
        },
        moveBackward: async (value = 0) => {
          assertActive()
          const rad = (curAngle * Math.PI) / 180
          const targetX = curX - Math.cos(rad) * value
          const targetY = curY - Math.sin(rad) * value
          await animateTo(targetX, targetY, curAngle, true, false)
          await finishStep()
        },
        turnRight: async (value = 0) => {
          assertActive()
          await animateTo(curX, curY, curAngle + value, false, true)
          await finishStep()
        },
        turnLeft: async (value = 0) => {
          assertActive()
          await animateTo(curX, curY, curAngle - value, false, true)
          await finishStep()
        },
        setHeading: async (value = 0) => {
          assertActive()
          await animateTo(curX, curY, value, false, true)
          await finishStep()
        },
        jumpTo: async (x = 0, y = 0) => {
          assertActive()
          moveTo(bgCanvas.width / 2 + x, bgCanvas.height / 2 - y)
          await finishStep()
        },
        goToCenter: async () => {
          assertActive()
          moveTo(bgCanvas.width / 2, bgCanvas.height / 2)
          await finishStep()
        },
        penUp: async () => {
          assertActive()
          curPenDown = false
          recenterPathHeads()
          syncCanvases()
          await finishStep()
        },
        penDown: async () => {
          assertActive()
          curPenDown = true
          recenterPathHeads()
          syncCanvases()
          await finishStep()
        },
        setColor: async (color) => {
          assertActive()
          const parsedColor =
            color == null ? curColor : String(color).trim()
          const nextColor = parsedColor || curColor
          bgCtx.stroke()
          bgCtx.beginPath()
          bgCtx.strokeStyle = nextColor
          curColor = nextColor
          bgCtx.moveTo(curX, curY)

          if (drawCtx) {
            drawCtx.stroke()
            drawCtx.beginPath()
            drawCtx.strokeStyle = nextColor
            drawCtx.moveTo(curX, curY)
          }

          syncCanvases()
          await finishStep()
        },
        setRandomColor: async () => {
          assertActive()
          const randomColor =
            '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
          await api.setColor(randomColor)
        },
        setPenSize: async (size = 3) => {
          assertActive()
          bgCtx.stroke()
          bgCtx.beginPath()
          bgCtx.lineWidth = size
          curSize = size
          bgCtx.moveTo(curX, curY)

          if (drawCtx) {
            drawCtx.stroke()
            drawCtx.beginPath()
            drawCtx.lineWidth = size
            drawCtx.moveTo(curX, curY)
          }

          syncCanvases()
          await finishStep()
        },
        clear: async () => {
          assertActive()
          bgCtx.stroke()
          resetAndDraw()
          syncCanvases()
          await finishStep()
        },
        drawCircle: async (radius = 50) => {
          assertActive()
          if (!curPenDown) return

          bgCtx.stroke()
          bgCtx.beginPath()
          bgCtx.arc(curX, curY, radius, 0, 2 * Math.PI)
          bgCtx.stroke()
          bgCtx.beginPath()
          bgCtx.moveTo(curX, curY)

          if (drawCtx) {
            drawCtx.stroke()
            drawCtx.beginPath()
            drawCtx.arc(curX, curY, radius, 0, 2 * Math.PI)
            drawCtx.stroke()
            drawCtx.beginPath()
            drawCtx.moveTo(curX, curY)
          }

          syncCanvases()
          await finishStep()
        },
        drawPolygon: async (sides = 3, length = 50) => {
          assertActive()
          if (!curPenDown) return

          for (let i = 0; i < sides; i++) {
            const rad = (curAngle * Math.PI) / 180
            const nextX = curX + Math.cos(rad) * length
            const nextY = curY + Math.sin(rad) * length
            await animateTo(nextX, nextY, curAngle, true, false)
            curAngle += 360 / sides
            syncCanvases()
          }

          syncCanvases()
          await finishStep()
        },
        drawLine: async (length = 50) => {
          assertActive()
          const rad = (curAngle * Math.PI) / 180
          const targetX = curX + Math.cos(rad) * length
          const targetY = curY + Math.sin(rad) * length
          await animateTo(targetX, targetY, curAngle, true, false)
          await finishStep()
        },
        drawRectangle: async (width = 80, height = 50) => {
          assertActive()
          if (!curPenDown) return
          const rectW = Number(width) || 0
          const rectH = Number(height) || 0
          const corners = [
            [curX + rectW, curY],
            [curX + rectW, curY + rectH],
            [curX, curY + rectH],
            [curX, curY]
          ]
          for (const [nextX, nextY] of corners) {
            await animateTo(nextX, nextY, curAngle, true, false)
          }
          syncCanvases()
          await finishStep()
        },
        drawArc: async (radius = 50, angle = 90) => {
          assertActive()
          const r = Math.max(1, Math.abs(Number(radius) || 0))
          const sweepDeg = Number(angle) || 0
          if (sweepDeg === 0) {
            await finishStep()
            return
          }

          const headingRad = (curAngle * Math.PI) / 180
          const rightNormalX = Math.sin(headingRad)
          const rightNormalY = -Math.cos(headingRad)
          const centerX = curX + rightNormalX * r
          const centerY = curY + rightNormalY * r
          const startAngle = Math.atan2(curY - centerY, curX - centerX)
          const endAngle = startAngle + (sweepDeg * Math.PI) / 180
          const steps = Math.max(8, Math.ceil(Math.abs(sweepDeg) / 12))

          for (let i = 1; i <= steps; i += 1) {
            const t = i / steps
            const a = startAngle + (endAngle - startAngle) * t
            const nextX = centerX + Math.cos(a) * r
            const nextY = centerY + Math.sin(a) * r

            if (curPenDown) {
              bgCtx.lineTo(nextX, nextY)
              if (drawCtx) drawCtx.lineTo(nextX, nextY)
            } else {
              bgCtx.moveTo(nextX, nextY)
              if (drawCtx) drawCtx.moveTo(nextX, nextY)
            }

            curX = nextX
            curY = nextY
            curAngle += sweepDeg / steps
            syncCanvases()
            await sleep(STEP_MS / steps)
          }

          await finishStep()
        },
        setPointerStyle: async (style = 'arrow') => {
          assertActive()
          const key = String(style || 'arrow')
          curPointerStyle = key === 'arrow' || Object.prototype.hasOwnProperty.call(POINTER_TWEMOJI, key)
            ? key
            : 'arrow'
          syncCanvases()
          await finishStep()
        },
        canvasZoomIn: async (amount = 10) => {
          assertActive()
          const step = Math.max(0, Number(amount) || 0) / 100
          viewScaleRef.current = Math.min(2, Number((viewScaleRef.current + step).toFixed(2)))
          applyViewScale()
          await finishStep()
        },
        canvasZoomOut: async (amount = 10) => {
          assertActive()
          const step = Math.max(0, Number(amount) || 0) / 100
          viewScaleRef.current = Math.max(0.5, Number((viewScaleRef.current - step).toFixed(2)))
          applyViewScale()
          await finishStep()
        },
        canvasResetZoom: async () => {
          assertActive()
          viewScaleRef.current = 1
          applyViewScale()
          await finishStep()
        },
        canvasToggleGrid: async () => {
          assertActive()
          gridVisibleRef.current = !gridVisibleRef.current
          redrawComposite()
          syncCanvases()
          await finishStep()
        },
        getMarkerX: () => curX - bgCanvas.width / 2,
        getMarkerY: () => bgCanvas.height / 2 - curY,
        getMarkerHeading: () => curAngle
      }

      try {
        assertActive()
        const startHandlers = []
        const eventHandlers = {}
        const waitSeconds = async (seconds = 0) => {
          assertActive()
          await sleep(Math.max(0, Number(seconds) || 0) * 1000)
        }
        const __registerStart = (handler) => {
          startHandlers.push(handler)
        }
        const __registerEvent = (name, handler) => {
          if (!eventHandlers[name]) eventHandlers[name] = []
          eventHandlers[name].push(handler)
        }
        const __emitEvent = async (name) => {
          assertActive()
          const handlers = eventHandlers[name] || []
          for (const handler of handlers) {
            assertActive()
            await handler()
          }
        }
        const __step = async (id) => {
          assertActive()
          const nextId = id == null ? null : String(id)
          const now = Date.now()

          // In dev/runtime edge-cases, the same block step can be emitted twice
          // while one visual action is already in progress. Ignore duplicates so
          // one block = one highlight window.
          if (
            nextId &&
            activeStepBlockId === nextId &&
            now - activeStepStartedAt < STEP_MS
          ) {
            return
          }

          activeStepBlockId = nextId
          activeStepStartedAt = now
          if (onHighlightRef.current) {
            onHighlightRef.current(nextId)
          }
        }

        const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
        const argNames = Object.keys(api)
        const argValues = Object.values(api)
        const program = new AsyncFunction(
          ...argNames,
          '__step',
          '__registerStart',
          '__registerEvent',
          '__emitEvent',
          'waitSeconds',
          commandsRef.current || ''
        )
        await program(
          ...argValues,
          __step,
          __registerStart,
          __registerEvent,
          __emitEvent,
          waitSeconds
        )

        for (const startHandler of startHandlers) {
          assertActive()
          await startHandler()
        }
      } catch (err) {
        if (!isStale() && err?.message !== '__RUN_CANCELLED__') {
          // keep canvas responsive even when user code errors
        }
      }

      if (!isStale() && onHighlightRef.current) onHighlightRef.current(null)
      activeStepBlockId = null
      bgCtx.stroke()
      if (drawCtx) {
        drawCtx.stroke()
      }

      if (!isStale() && onChallengeScoreRef.current && scoreGhostPreviewRef.current && drawingCanvas) {
        const ghostScore = scoreDrawingAgainstGhost(drawingCanvas, scoreGhostPreviewRef.current)
        onChallengeScoreRef.current(ghostScore)
      }

      } catch (err) {
        // no-op
      } finally {
        if (!isStale()) {
          if (onRunStateChangeRef.current) onRunStateChangeRef.current(false)
        }
      }
    }

    if (runSequence > 0) {
      if (executedRunSequenceRef.current === runSequence) {
        return () => {
          runIdRef.current += 1
        }
      }
      executedRunSequenceRef.current = runSequence
      runCommandsAsync()
    } else {
      resetAndDraw()
      drawMarkerAt(markerCanvas, markerCtx, curX, curY, curAngle, defaultPointerStyle)
      if (onRunStateChangeRef.current) onRunStateChangeRef.current(false)
    }
    return () => {
      runIdRef.current += 1
    }
  }, [runSequence, ghostPreview, defaultPointerStyle])


  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <canvas
          ref={bgCanvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'block',
            zIndex: 1
          }}
        />
        <canvas
          ref={markerCanvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'block',
            zIndex: 2,
            pointerEvents: 'none'
          }}
        />
      </div>

    </div>
  )
}

export default DrawingCanvas




