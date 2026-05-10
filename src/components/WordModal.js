import React, { useState } from 'react'
import './WordModal.css'
import { getWordChoiceOptions } from '../constants/wordPool'
import WordChoiceList from './WordChoiceList'

const DIFFICULTY_STEPS = ['very easy', 'easy', 'medium', 'hard', 'very hard']

function getDisplayedDifficulty(difficulty, timerEnabled) {
  const index = DIFFICULTY_STEPS.indexOf(difficulty)
  if (!timerEnabled || index < 0) return difficulty
  return DIFFICULTY_STEPS[Math.min(index + 1, DIFFICULTY_STEPS.length - 1)]
}

function WordModal({ onSelect, onBack, timerEnabled = false, onTimerToggle = null }) {
  const [wordOptions] = useState(getWordChoiceOptions)
  const displayedOptions = wordOptions.map(({ word, difficulty }) => ({
    word,
    difficulty: getDisplayedDifficulty(difficulty, timerEnabled)
  }))

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

        <WordChoiceList
          options={displayedOptions}
          onSelect={onSelect}
        />

        <div className='word-modal-controls-row'>
          <button
            type='button'
            className='word-modal-back-btn'
            onClick={onBack}
          >
            ← Back
          </button>

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
        </div>
        {timerEnabled && (
          <p className='word-timer-warning'>
            Timer is on. This may be more challenging.
          </p>
        )}
      </div>
    </div>
  )
}

export default WordModal
