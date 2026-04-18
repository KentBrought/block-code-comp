import React from 'react'
import './WordModal.css'
import { CHALLENGES } from '../constants/challenges'

function ChallengeModal({ onSelect, onBack }) {
  return (
    <div className='word-modal-overlay'>
      <div className='word-modal'>
        <div className='word-modal-icon'>🐞</div>
        <h2 className='word-modal-title'>Bug Fix Challenges</h2>
        <p className='word-modal-desc'>
          Pick one challenge.
          <br />
          We give you a broken starter program. Find and fix the bug.
        </p>

        <div className='word-choices'>
          {CHALLENGES.map((challenge) => (
            <button
              key={challenge.id}
              className='word-choice-btn'
              onClick={() => onSelect(challenge)}
            >
              {challenge.title}
            </button>
          ))}
        </div>

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

export default ChallengeModal
