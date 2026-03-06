import React, { useState, useEffect, useRef, useCallback } from 'react';
import BlocklyEditor from './components/BlocklyEditor';
import DrawingCanvas from './components/DrawingCanvas';
import ChatWindow from './components/ChatWindow';
import HomePage from './pages/HomePage';
import WordModal from './components/WordModal';
import './App.css';

const GAME_DURATION = 5 * 60; // 5 minutes in seconds

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function App() {
  // 'home' | 'word-select' | 'game'
  const [screen, setScreen] = useState('home');
  const [selectedWord, setSelectedWord] = useState(null);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeUp, setTimeUp] = useState(false);

  const [commands, setCommands] = useState('');
  const [runSequence, setRunSequence] = useState(0);
  const [highlightBlockId, setHighlightBlockId] = useState(null);

  const timerRef = useRef(null);

  // Start countdown when word is chosen
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            setTimerRunning(false);
            setTimeUp(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  const handlePlay = () => {
    setScreen('word-select');
  };

  const handleWordSelect = (word) => {
    setSelectedWord(word);
    setTimeLeft(GAME_DURATION);
    setTimeUp(false);
    setTimerRunning(true);
    setScreen('game');
  };

  const handleExit = useCallback(() => {
    clearInterval(timerRef.current);
    setTimerRunning(false);
    setSelectedWord(null);
    setTimeLeft(GAME_DURATION);
    setTimeUp(false);
    setCommands('');
    setRunSequence(0);
    setHighlightBlockId(null);
    setScreen('home');
  }, []);

  const handleRun = () => {
    setRunSequence(s => s + 1);
  };

  const timerClass = timeLeft <= 60
    ? 'game-timer game-timer--danger'
    : timeLeft <= 120
      ? 'game-timer game-timer--warn'
      : 'game-timer';

  if (screen === 'home') {
    return <HomePage onPlay={handlePlay} />;
  }

  return (
    <div className="app-container">
      {/* Word selection modal when screen === 'word-select' */}
      {screen === 'word-select' && <WordModal onSelect={handleWordSelect} />}

      <header className="app-header">
        {/* Left: title */}
        <h1 className="app-title" onClick={handleExit} style={{ cursor: 'pointer' }}>
          <span className="title-block">Block</span>
          <span className="title-comma">,</span>{' '}
          <span className="title-code">Code</span>
          <span className="title-comma">,</span>{' '}
          <span className="title-draw">Draw!</span>
        </h1>

        {/* Centre: word + timer */}
        <div className="header-centre">
          {selectedWord && (
            <div className="word-badge">
              <span className="word-badge-label">Drawing:</span>
              <span className="word-badge-word">{selectedWord}</span>
            </div>
          )}
          {selectedWord && (
            <div className={timerClass}>
              ⏱ {formatTime(timeLeft)}
              {timeUp && <span className="timer-up-tag">Time's up!</span>}
            </div>
          )}
        </div>

        {/* Right: Run + Exit */}
        <div className="header-actions">
          <button className="run-button" onClick={handleRun}>
            <span className="run-icon">▶</span> Run
          </button>
          <button className="exit-button" onClick={handleExit} title="Exit to home">
            <span>✕</span> Exit
          </button>
        </div>
      </header>

      <main className="main-layout">
        <section className="editor-section">
          <BlocklyEditor onCodeChange={setCommands} highlightBlockId={highlightBlockId} />
        </section>

        <aside className="right-column">
          <section className="canvas-section">
            <DrawingCanvas
              commands={commands}
              runSequence={runSequence}
              onHighlight={setHighlightBlockId}
            />
          </section>
          <section className="chat-section">
            <ChatWindow />
          </section>
        </aside>
      </main>
    </div>
  );
}

export default App;
