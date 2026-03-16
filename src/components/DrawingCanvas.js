import React, { useRef, useEffect, useState } from 'react'
import { classifyCanvas } from '../utils/imageClassifier'
import { findMatchingWordFromCandidates, WORD_POOL } from '../constants/wordPool'

const DrawingCanvas = ({ commands, runSequence, stopSequence, onHighlight, onGuessComplete }) => {
  const bgCanvasRef = useRef(null)
  const markerCanvasRef = useRef(null)
  const drawingCanvasRef = useRef(null) // offscreen canvas with drawing only
  const containerRef = useRef(null)
  const runIdRef = useRef(0)
  const executedRunSequenceRef = useRef(0)
  const commandsRef = useRef(commands)
  const onHighlightRef = useRef(onHighlight)
  const onGuessCompleteRef = useRef(onGuessComplete)
  const [classifying, setClassifying] = useState(false)
  const [classificationResult, setClassificationResult] = useState(null)
  const [classificationError, setClassificationError] = useState(null)

  useEffect(() => {
    commandsRef.current = commands
    onHighlightRef.current = onHighlight
    onGuessCompleteRef.current = onGuessComplete
  }, [commands, onHighlight, onGuessComplete])

  useEffect(() => {
    runIdRef.current += 1
    setClassifying(false)
    if (onHighlightRef.current) onHighlightRef.current(null)
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

        drawGrid(bgCanvas, bgCanvas.getContext('2d'))
        drawMarkerAt(
          markerCanvas,
          markerCanvas.getContext('2d'),
          w / 2,
          h / 2,
          0
        )
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

  // Draws marker exclusively on the clear overlay canvas
  function drawMarkerAt(canvas, ctx, x, y, angle) {
    ctx.clearRect(0, 0, canvas.width, canvas.height) // clear entire overlay
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((angle * Math.PI) / 180)
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

    const resetAndDraw = () => {
      drawGrid(bgCanvas, bgCtx)

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
      assertActive()
      resetAndDraw()
      setClassifying(true)
      setClassificationError(null)
      setClassificationResult(null)

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
        drawMarkerAt(markerCanvas, markerCtx, curX, curY, curAngle)
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
          setClassificationError(err?.message || 'Program execution failed.')
        }
      }

      if (!isStale() && onHighlightRef.current) onHighlightRef.current(null)
      activeStepBlockId = null
      bgCtx.stroke()
      if (drawCtx) {
        drawCtx.stroke()
      }

      try {
        assertActive()
        const canvasForClassification = drawingCanvas || bgCanvas
        if (!canvasForClassification) {
          if (!isStale()) {
            setClassificationError('No canvas available for classification.')
            setClassificationResult(null)
          }
        } else {
          const result = await classifyCanvas(canvasForClassification)
          if (!isStale()) {
            setClassificationResult(result)
          }

          if (!isStale() && onGuessCompleteRef.current) {
            const categories =
              result &&
              result.classifications &&
              result.classifications[0] &&
              result.classifications[0].categories
                ? result.classifications[0].categories
                : null

            const categoryNames = (categories || [])
              .map((c) =>
                c && (c.displayName || c.categoryName)
                  ? (c.displayName || c.categoryName).toString()
                  : ''
              )
              .filter(Boolean)

            const guessName =
              categoryNames
                .map((name) => findMatchingWordFromCandidates(name, WORD_POOL))
                .find(Boolean) || ''

            onGuessCompleteRef.current({ guess: guessName, result, categories })
          }
        }
      } catch (err) {
        if (!isStale()) {
          setClassificationError(err?.message || 'Failed to classify drawing.')
          setClassificationResult(null)
        }
      } finally {
        if (!isStale()) {
          setClassifying(false)
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
      drawMarkerAt(markerCanvas, markerCtx, curX, curY, curAngle)
    }
    return () => {
      runIdRef.current += 1
    }
  }, [runSequence])

  const topCategories =
    classificationResult &&
    classificationResult.classifications &&
    classificationResult.classifications[0] &&
    classificationResult.classifications[0].categories
      ? classificationResult.classifications[0].categories
      : null

  const topGuessFromWordPool =
    (topCategories || [])
      .map((c) =>
        c && (c.displayName || c.categoryName)
          ? findMatchingWordFromCandidates(
              (c.displayName || c.categoryName).toString(),
              WORD_POOL
            )
          : null
      )
      .find(Boolean) || null

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

      <div
        style={{
          padding: '8px 10px',
          borderTop: '1px solid #e0e4ea',
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          fontSize: 12,
          lineHeight: 1.4,
          zIndex: 3
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {classificationError && (
            <span style={{ color: '#b91c1c' }}>{classificationError}</span>
          )}
          {!classificationError &&
            topCategories &&
            topCategories.length > 0 && (
              <span style={{ color: '#111827' }}>
                <strong>Top guess:</strong>{' '}
                {topGuessFromWordPool || 'No word-list match yet'}
                {topCategories.length > 1 && (
                  <>
                    {' '}
                    ·{' '}
                    <span style={{ color: '#6b7280' }}>
                      also:{' '}
                      {topCategories
                        .slice(1)
                        .map(
                          (c) =>
                            `${c.displayName || c.categoryName || 'Unknown'} (${(
                              c.score * 100
                            ).toFixed(1)}%)`
                        )
                        .join(', ')}
                    </span>
                  </>
                )}
              </span>
            )}
          {!classificationError &&
            (!topCategories || topCategories.length === 0) &&
            !classifying && (
              <span style={{ color: '#6b7280' }}>
                Press “Run” to draw and let the AI guess.
              </span>
            )}
          {classifying && (
            <span style={{ color: '#6b7280' }}>Analyzing your drawing…</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default DrawingCanvas
