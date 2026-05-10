import React from 'react'
import QuickDrawPreview from './QuickDrawPreview'

function WordChoiceList({ options = [], onSelect }) {
  return (
    <div className='word-choices'>
      <div className='word-choice-examples-label-row' aria-hidden='true'>
        <span />
        <span className='word-choice-examples-label'>Example</span>
      </div>
      {options.map(({ word, difficulty }) => (
        <button
          key={word}
          className='word-choice-btn'
          onClick={() => onSelect(word)}
        >
          <div className='word-choice-main'>
            <span>{word}</span>
            <span className={`word-choice-difficulty word-choice-difficulty--${difficulty.replace(/\s+/g, '-')}`}>
              {difficulty}
            </span>
          </div>
          <QuickDrawPreview category={word} count={1} />
        </button>
      ))}
    </div>
  )
}

export default WordChoiceList
