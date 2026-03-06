import React, { useState } from 'react';
import './WordModal.css';

// Large pool of simple, drawable words kids understand
const WORD_POOL = [
    // Animals
    'cat', 'dog', 'fish', 'bird', 'snake', 'turtle', 'rabbit', 'elephant',
    'spider', 'butterfly', 'crab', 'penguin', 'frog', 'whale', 'bee',
    // Nature
    'sun', 'moon', 'star', 'cloud', 'rainbow', 'lightning', 'mountain',
    'flower', 'tree', 'leaf', 'wave', 'island', 'river', 'lake', 'volcano',
    // Objects
    'house', 'door', 'window', 'car', 'boat', 'rocket', 'kite', 'ladder',
    'bridge', 'umbrella', 'key', 'hammer', 'clock', 'bell', 'crown',
    // Food
    'pizza', 'apple', 'banana', 'cake', 'ice cream', 'carrot', 'cupcake',
    'lollipop', 'cookie', 'sandwich',
    // Shapes / Fun
    'heart', 'spiral', 'castle', 'sword', 'flag', 'trophy', 'diamond',
    'arrow', 'smiley face', 'snowflake',
];

/** Pick 5 unique random words from the pool */
function getRandomWords() {
    const shuffled = [...WORD_POOL].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
}

function WordModal({ onSelect }) {
    const [words] = useState(getRandomWords);

    return (
        <div className="word-modal-overlay">
            <div className="word-modal">
                <div className="word-modal-icon">🎲</div>
                <h2 className="word-modal-title">Choose Your Word</h2>
                <p className="word-modal-desc">
                    Pick a word below, then use blocks to draw it on the canvas.<br />
                    The AI will try to guess what you drew!
                </p>

                <div className="word-choices">
                    {words.map(word => (
                        <button
                            key={word}
                            className="word-choice-btn"
                            onClick={() => onSelect(word)}
                        >
                            {word}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default WordModal;
