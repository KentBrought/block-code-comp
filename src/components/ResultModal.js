import React, { useEffect } from 'react'
import './WordModal.css'
import confetti from 'canvas-confetti'

function formatTimeFromSeconds(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function ResultModal({ word, timeTakenSeconds, status = 'win', runCount, onPlayAgain, onClose }) {
  const formattedTime = formatTimeFromSeconds(timeTakenSeconds || 0)
  const effectiveRunCount = typeof runCount === 'number' ? runCount : 0
  const runLabel = effectiveRunCount === 1 ? 'run' : 'runs'

  useEffect(() => {
    if (status !== 'win') return

    const duration = 1200
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 25,
        spread: 70,
        origin: { x: Math.random() * 0.2 + 0.1, y: Math.random() * 0.3 + 0.1 },
        zIndex: 2000
      })
      confetti({
        particleCount: 25,
        spread: 70,
        origin: { x: Math.random() * 0.2 + 0.7, y: Math.random() * 0.3 + 0.1 },
        zIndex: 2000
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()
  }, [status])

  return (
    <div className='word-modal-overlay'>
      <div className='word-modal'>
        <div className='word-modal-icon'>🎉</div>
        <h2 className='word-modal-title'>
          {status === 'win' ? 'Congratulations!' : "Time's up!"}
        </h2>
        {status === 'win' ? (
          <p className='word-modal-desc'>
            The AI guessed your drawing correctly as{' '}
            <strong>{word}</strong>.
            <br />
            You finished in <strong>{formattedTime}</strong> using{' '}
            <strong>{effectiveRunCount} {runLabel}</strong>.
          </p>
        ) : (
          <p className='word-modal-desc'>
            You used the full time of <strong>{formattedTime}</strong> and{' '}
            <strong>{effectiveRunCount} {runLabel}</strong>.
            <br />
            The secret word was <strong>{word}</strong>.
          </p>
        )}

        <div className='word-choices'>
          <button
            className='word-choice-btn'
            onClick={onPlayAgain}
          >
            Play Again
          </button>
          <button
            className='word-choice-btn'
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ResultModal

