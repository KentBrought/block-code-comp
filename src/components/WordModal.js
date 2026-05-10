import React, { useState } from 'react'
import './WordModal.css'
import { getWordChoiceOptions } from '../constants/wordPool'

const DIFFICULTY_STEPS = ['very easy', 'easy', 'medium', 'hard', 'very hard']

function getDisplayedDifficulty(difficulty, timerEnabled) {
  const index = DIFFICULTY_STEPS.indexOf(difficulty)
  if (!timerEnabled || index < 0) return difficulty
  return DIFFICULTY_STEPS[Math.min(index + 1, DIFFICULTY_STEPS.length - 1)]
}

function WordModal({ onSelect, onBack, timerEnabled = false, onTimerToggle = null }) {
  const [wordOptions] = useState(getWordChoiceOptions)

  return (
    <div className='word-modal-overlay'>
      <div className='word-modal'>
        <div className='word-modal-icon'>🎲</div>
        <h2 className='word-modal-title'>Choose Your Word</h2>
        <p className='word-modal-desc'>
          Pick a word below, then use blocks to draw it on the canvas.
          <br />
          The AI will try to guess what you drew!
        </p>

        <div className='word-choices'>
          {wordOptions.map(({ word, difficulty }) => {
            const displayedDifficulty = getDisplayedDifficulty(difficulty, timerEnabled)
            return (
            <button
              key={word}
              className='word-choice-btn'
              onClick={() => onSelect(word)}
            >
              <span>{word}</span>
              <span className={`word-choice-difficulty word-choice-difficulty--${displayedDifficulty.replace(/\s+/g, '-')}`}>{displayedDifficulty}</span>
            </button>
            )
          })}
        </div>

        <div className='word-timer-toggle-row'>
          <span className='word-timer-toggle-label'>Timer challenge</span>
          <button
            type='button'
            className={`word-timer-toggle ${timerEnabled ? 'is-on' : 'is-off'}`}
            onClick={() => onTimerToggle && onTimerToggle(!timerEnabled)}
            aria-pressed={timerEnabled}
            aria-label='Enable timer challenge'
          >
            <span className='word-timer-toggle-knob' />
          </button>
        </div>
        {timerEnabled && (
          <p className='word-timer-warning'>
            Timer is ON. Words are shown one level harder.
          </p>
        )}

        <button
          type='button'
          className='word-modal-back-btn'
          onClick={onBack}
        >
          Back
        </button>
      </div>
    </div>
  )
}

export default WordModal
