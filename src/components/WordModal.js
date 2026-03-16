import React, { useState } from 'react'
import './WordModal.css'
import { getRandomWordsFromPool } from '../constants/wordPool'

function WordModal({ onSelect }) {
  const [words] = useState(getRandomWordsFromPool)

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
          {words.map((word) => (
            <button
              key={word}
              className='word-choice-btn'
              onClick={() => onSelect(word)}
            >
              {word}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default WordModal
