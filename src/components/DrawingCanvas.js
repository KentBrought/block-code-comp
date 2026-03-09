import React, { useRef, useEffect, useState } from 'react'
import { classifyCanvas } from '../utils/imageClassifier'

const DrawingCanvas = ({ commands, runSequence, onHighlight, onGuessComplete }) => {
  const bgCanvasRef = useRef(null)
  const markerCanvasRef = useRef(null)
  const drawingCanvasRef = useRef(null) // offscreen canvas with drawing only
  const containerRef = useRef(null)
  const [classifying, setClassifying] = useState(false)
  const [classificationResult, setClassificationResult] = useState(null)
  const [classificationError, setClassificationError] = useState(null)

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
      resetAndDraw()
      setClassifying(true)
      setClassificationError(null)
      setClassificationResult(null)

      const commandList = commands.split('\n')

      for (let cmd of commandList) {
        if (!cmd || !cmd.trim()) continue

        const match = cmd.trim().match(/^(\w+)\((.*)\);?$/)
        if (!match) continue

        const action = match[1]
        const argsStr = match[2]
        const args = argsStr.split(',').map((arg) => {
          const trimmed = arg.trim()
          if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
            return trimmed.slice(1, -1)
          }
          return parseFloat(trimmed)
        })

        if (action === 'highlightBlock') {
          const rawId = argsStr.trim()
          const id = rawId.startsWith("'") ? rawId.slice(1, -1) : rawId
          if (onHighlight) onHighlight(id)
          await new Promise((r) => setTimeout(r, 200))
          continue
        } else if (action === 'moveForward') {
          const val = args[0] || 0
          const rad = (curAngle * Math.PI) / 180
          curX += Math.cos(rad) * val
          curY += Math.sin(rad) * val
          if (curPenDown) bgCtx.lineTo(curX, curY)
          else bgCtx.moveTo(curX, curY)
          if (drawCtx) {
            if (curPenDown) drawCtx.lineTo(curX, curY)
            else drawCtx.moveTo(curX, curY)
          }
        } else if (action === 'moveBackward') {
          const val = args[0] || 0
          const rad = (curAngle * Math.PI) / 180
          curX -= Math.cos(rad) * val
          curY -= Math.sin(rad) * val
          if (curPenDown) bgCtx.lineTo(curX, curY)
          else bgCtx.moveTo(curX, curY)
          if (drawCtx) {
            if (curPenDown) drawCtx.lineTo(curX, curY)
            else drawCtx.moveTo(curX, curY)
          }
        } else if (action === 'turnRight') {
          curAngle += args[0] || 0
        } else if (action === 'turnLeft') {
          curAngle -= args[0] || 0
        } else if (action === 'setHeading') {
          curAngle = args[0] || 0
        } else if (action === 'jumpTo') {
          curX = bgCanvas.width / 2 + (args[0] || 0)
          curY = bgCanvas.height / 2 - (args[1] || 0)
          if (curPenDown) bgCtx.lineTo(curX, curY)
          else bgCtx.moveTo(curX, curY)
          if (drawCtx) {
            if (curPenDown) drawCtx.lineTo(curX, curY)
            else drawCtx.moveTo(curX, curY)
          }
        } else if (action === 'goToCenter') {
          curX = bgCanvas.width / 2
          curY = bgCanvas.height / 2
          if (curPenDown) bgCtx.lineTo(curX, curY)
          else bgCtx.moveTo(curX, curY)
          if (drawCtx) {
            if (curPenDown) drawCtx.lineTo(curX, curY)
            else drawCtx.moveTo(curX, curY)
          }
        } else if (action === 'penUp') {
          curPenDown = false
        } else if (action === 'penDown') {
          curPenDown = true
        } else if (action === 'setColor') {
          const color = args[0] || curColor
          bgCtx.stroke()
          bgCtx.beginPath()
          bgCtx.strokeStyle = color
          curColor = color
          bgCtx.moveTo(curX, curY)
          if (drawCtx) {
            drawCtx.stroke()
            drawCtx.beginPath()
            drawCtx.strokeStyle = color
            drawCtx.moveTo(curX, curY)
          }
        } else if (action === 'setPenSize') {
          bgCtx.stroke()
          bgCtx.beginPath()
          bgCtx.lineWidth = args[0] || 3
          curSize = args[0] || 3
          bgCtx.moveTo(curX, curY)
          if (drawCtx) {
            drawCtx.stroke()
            drawCtx.beginPath()
            drawCtx.lineWidth = args[0] || 3
            drawCtx.moveTo(curX, curY)
          }
        } else if (action === 'clear') {
          bgCtx.stroke()
          resetAndDraw()
          continue
        } else if (action === 'setRandomColor') {
          const randomColor =
            '#' +
            Math.floor(Math.random() * 16777215)
              .toString(16)
              .padStart(6, '0')
          bgCtx.stroke()
          bgCtx.beginPath()
          bgCtx.strokeStyle = randomColor
          curColor = randomColor
          bgCtx.moveTo(curX, curY)
          if (drawCtx) {
            drawCtx.stroke()
            drawCtx.beginPath()
            drawCtx.strokeStyle = randomColor
            drawCtx.moveTo(curX, curY)
          }
        } else if (action === 'drawCircle') {
          const radius = args[0] || 50
          if (curPenDown) {
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
          }
        } else if (action === 'drawPolygon') {
          const sides = args[0] || 3
          const length = args[1] || 50
          if (curPenDown) {
            for (let i = 0; i < sides; i++) {
              const rad = (curAngle * Math.PI) / 180
              curX += Math.cos(rad) * length
              curY += Math.sin(rad) * length
              bgCtx.lineTo(curX, curY)
              if (drawCtx) {
                drawCtx.lineTo(curX, curY)
              }
              curAngle += 360 / sides
            }
          }
        }

        bgCtx.stroke()
        if (drawCtx) {
          drawCtx.stroke()
        }
        drawMarkerAt(markerCanvas, markerCtx, curX, curY, curAngle) // Draw marker in real-time
      }

      if (onHighlight) onHighlight(null)
      bgCtx.stroke()
      if (drawCtx) {
        drawCtx.stroke()
      }

      try {
        const canvasForClassification = drawingCanvas || bgCanvas
        if (!canvasForClassification) {
          setClassificationError('No canvas available for classification.')
          setClassificationResult(null)
        } else {
          const result = await classifyCanvas(canvasForClassification)
          setClassificationResult(result)

          if (onGuessComplete) {
            const categories =
              result &&
              result.classifications &&
              result.classifications[0] &&
              result.classifications[0].categories
                ? result.classifications[0].categories
                : null

            const primary = categories && categories.length > 0 ? categories[0] : null
            const guessName =
              primary && (primary.displayName || primary.categoryName)
                ? (primary.displayName || primary.categoryName).toString()
                : ''

            onGuessComplete({ guess: guessName, result, categories })
          }
        }
      } catch (err) {
        setClassificationError(err?.message || 'Failed to classify drawing.')
        setClassificationResult(null)
      } finally {
        setClassifying(false)
      }
    }

    if (runSequence > 0) {
      runCommandsAsync()
    } else {
      resetAndDraw()
      drawMarkerAt(markerCanvas, markerCtx, curX, curY, curAngle)
    }
  }, [runSequence])

  const topCategories =
    classificationResult &&
    classificationResult.classifications &&
    classificationResult.classifications[0] &&
    classificationResult.classifications[0].categories
      ? classificationResult.classifications[0].categories
      : null

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
                {topCategories[0].displayName ||
                  topCategories[0].categoryName ||
                  'Unknown'}{' '}
                ({(topCategories[0].score * 100).toFixed(1)}%)
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
