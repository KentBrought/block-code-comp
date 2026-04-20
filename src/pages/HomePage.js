import React, { useEffect, useRef, useState } from 'react'
import * as Blockly from 'blockly'
import { customTheme, initBlocks } from '../components/BlocklyEditor'
import './HomePage.css'

const PARTICLES = 40
const BLOCK_LIBRARY = [
  { type: 'when_run_clicked', category: 'events' },
  { type: 'on_event_message', category: 'events' },
  { type: 'move_forward', category: 'motion' },
  { type: 'turn_right', category: 'motion' },
  { type: 'repeat_times', category: 'control' },
  { type: 'forever_loop', category: 'control' },
  { type: 'if_condition', category: 'logic' },
  { type: 'op_compare', category: 'logic' },
  { type: 'draw_circle', category: 'shapes' },
  { type: 'draw_polygon', category: 'shapes' },
  { type: 'set_color', category: 'pen' },
  { type: 'set_pen_size', category: 'pen' }
]

function HomePage({ onPlay, onHowToPlay, onChallengeMode, onAbout, onLessons }) {
  const canvasRef = useRef(null)
  const [floatingBlocks, setFloatingBlocks] = useState([])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animId

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const particles = Array.from({ length: PARTICLES }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 18 + 6,
      dx: (Math.random() - 0.5) * 0.6,
      dy: (Math.random() - 0.5) * 0.6,
      hue: Math.floor(Math.random() * 360),
      alpha: Math.random() * 0.25 + 0.05
    }))

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        p.x += p.dx
        p.y += p.dy
        if (p.x < -p.r) p.x = canvas.width + p.r
        if (p.x > canvas.width + p.r) p.x = -p.r
        if (p.y < -p.r) p.y = canvas.height + p.r
        if (p.y > canvas.height + p.r) p.y = -p.r
        p.hue = (p.hue + 0.15) % 360

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r)
        grad.addColorStop(0, `hsla(${p.hue},85%,60%,${p.alpha})`)
        grad.addColorStop(1, `hsla(${p.hue},85%,60%,0)`)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      })
      animId = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  useEffect(() => {
    initBlocks()
    const host = document.createElement('div')
    host.style.position = 'fixed'
    host.style.left = '-10000px'
    host.style.top = '-10000px'
    host.style.width = '900px'
    host.style.height = '500px'
    document.body.appendChild(host)

    const workspace = Blockly.inject(host, {
      renderer: 'zelos',
      theme: customTheme,
      toolbox: { kind: 'flyoutToolbox', contents: [] },
      move: { scrollbars: false, drag: false, wheel: false },
      zoom: { controls: false, wheel: false, startScale: 1, maxScale: 1, minScale: 1 }
    })

    const byCategory = new Map()
    BLOCK_LIBRARY.forEach((entry) => {
      if (!byCategory.has(entry.category)) byCategory.set(entry.category, [])
      byCategory.get(entry.category).push(entry)
    })
    const picked = Array.from(byCategory.values()).map((items) => items[Math.floor(Math.random() * items.length)])
    const shuffled = picked.sort(() => Math.random() - 0.5)
    const anchorSlots = [
      { top: 8, left: 7 },
      { top: 12, left: 72 },
      { top: 30, left: 4 },
      { top: 36, left: 77 },
      { top: 66, left: 8 },
      { top: 70, left: 70 }
    ]
    const serializer = new XMLSerializer()

    const usedPositions = []
    const generated = shuffled.map((entry, idx) => {
      const block = workspace.newBlock(entry.type)
      block.initSvg()
      block.render()
      const root = block.getSvgRoot()
      const bbox = root.getBBox()
      const padding = 8
      const width = Math.max(80, Math.ceil(bbox.width + padding * 2))
      const height = Math.max(46, Math.ceil(bbox.height + padding * 2))
      const clone = root.cloneNode(true)
      clone.querySelectorAll('text').forEach((node) => node.setAttribute('fill', '#ffffff'))
      clone.setAttribute('transform', `translate(${padding - bbox.x}, ${padding - bbox.y})`)
      const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${serializer.serializeToString(clone)}</svg>`
      block.dispose(false)
      const slot = anchorSlots[idx % anchorSlots.length]
      let top = slot.top
      let left = slot.left
      let placed = false

      for (let attempt = 0; attempt < 14; attempt += 1) {
        const jitterTop = Math.floor(Math.random() * 8) - 4
        const jitterLeft = Math.floor(Math.random() * 10) - 5
        const candidateTop = slot.top + jitterTop
        const candidateLeft = slot.left + jitterLeft

        const tooClose = usedPositions.some((pos) => {
          const dy = candidateTop - pos.top
          const dx = candidateLeft - pos.left
          return (dx * dx + dy * dy) < 130
        })

        if (!tooClose) {
          top = candidateTop
          left = candidateLeft
          placed = true
          break
        }
      }

      if (!placed) {
        top = slot.top
        left = slot.left
      }
      usedPositions.push({ top, left })

      return {
        id: `bg-block-${idx}`,
        markup,
        top: `${top}%`,
        left: `${left}%`,
        dx: `${Math.floor(Math.random() * 320) - 160}px`,
        dy: `${Math.floor(Math.random() * 220) - 110}px`,
        rot: `${Math.floor(Math.random() * 20) - 10}deg`,
        duration: `${16 + Math.floor(Math.random() * 10)}s`,
        delay: `${(Math.random() * 5).toFixed(2)}s`
      }
    })

    setFloatingBlocks(generated)
    workspace.dispose()
    document.body.removeChild(host)
  }, [])

  return (
    <div className='home-page'>
      <canvas ref={canvasRef} className='home-bg-canvas' />

      <div className='home-ring home-ring-1' />
      <div className='home-ring home-ring-2' />
      <div className='home-ring home-ring-3' />
      <div className='home-floating-field' aria-hidden='true'>
        {floatingBlocks.map((item) => (
          <div
            key={item.id}
            className='home-floating-block'
            style={{
              top: item.top,
              left: item.left,
              '--dx': item.dx,
              '--dy': item.dy,
              '--rot': item.rot,
              '--duration': item.duration,
              '--delay': item.delay
            }}
          >
            <div className='home-floating-block-svg' dangerouslySetInnerHTML={{ __html: item.markup }} />
          </div>
        ))}
      </div>

      <div className='home-content'>
        <div className='home-logo-wrap'>
          <div className='home-logo-icon'>🎨</div>
          <h1 className='home-title'>
            <span className='ht-block'>Block</span>
            <span className='ht-comma'>,</span>
            <span className='ht-code'> Code</span>
            <span className='ht-comma'>,</span>
            <span className='ht-draw'> Draw!</span>
          </h1>
        </div>

        <p className='home-tagline'>
          Use colorful code blocks to guide your marker and create art.
          <br />
          Can your AI bot guess your drawing in under <strong>15 minutes</strong>?
        </p>

        <div className='home-cta-stack'>
          <div className='home-primary-row'>
            <button className='home-play-btn' onClick={onPlay}>
              <span className='home-play-icon'>🎮</span>
              <span className='home-play-label'>Play Now</span>
            </button>
            <button
              type='button'
              onClick={onHowToPlay}
              className='home-help-circle'
              data-tooltip='How to Play'
              title='How to Play'
              aria-label='How to Play'
            >
              ?
            </button>
          </div>

          <button className='home-play-btn' onClick={onLessons}>
            <span className='home-play-icon'>🧭</span>
            <span className='home-play-label'>Learning Path</span>
          </button>

          <button className='home-play-btn home-challenge-btn' onClick={onChallengeMode}>
            <span className='home-play-icon'>🐞</span>
            <span className='home-play-label'>Challenge Mode</span>
          </button>
        </div>

        <p className='home-hint'>
          Pick a secret word, try the full lesson path, or hunt bugs in challenge mode.
        </p>
        <button type='button' onClick={onAbout} className='home-about-link'>
          About this project
        </button>
      </div>
    </div>
  )
}

export default HomePage
