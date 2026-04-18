import React, { useEffect, useRef } from 'react'
import './HomePage.css'

const PARTICLES = 60

function HomePage({ onPlay, onHowToPlay, onChallengeMode }) {
  const canvasRef = useRef(null)

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

  return (
    <div className='home-page'>
      <canvas ref={canvasRef} className='home-bg-canvas' />

      <div className='home-ring home-ring-1' />
      <div className='home-ring home-ring-2' />
      <div className='home-ring home-ring-3' />

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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <button className='home-play-btn' onClick={onPlay}>
            <span className='home-play-icon'>⏵️</span>
            <span className='home-play-label'>Play Now</span>
          </button>

          <button className='home-play-btn' onClick={onChallengeMode}>
            <span className='home-play-icon'>🐞</span>
            <span className='home-play-label'>Challenge Mode</span>
          </button>

          <button
            type='button'
            onClick={onHowToPlay}
            style={{
              alignSelf: 'center',
              padding: '0.6rem 1.4rem',
              borderRadius: 999,
              border: '1.5px solid #6366f1',
              background: 'rgba(129,140,248,0.06)',
              color: '#3730a3',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(79,70,229,0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 20,
                height: 20,
                borderRadius: '999px',
                backgroundColor: '#ffffff',
                color: '#4f46e5',
                fontSize: '0.9rem',
                boxShadow: '0 1px 3px rgba(15,23,42,0.25)'
              }}
            >
              ?
            </span>
            How to Play
          </button>
        </div>

        <p className='home-hint'>
          Pick a secret word or try challenge mode to hunt down a drawing bug.
        </p>
      </div>
    </div>
  )
}

export default HomePage
