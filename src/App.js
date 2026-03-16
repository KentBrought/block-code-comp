import React, { useState, useEffect, useRef, useCallback } from 'react'
import { TourProvider, useTour } from '@reactour/tour'
import BlocklyEditor from './components/BlocklyEditor'
import DrawingCanvas from './components/DrawingCanvas'
import ChatWindow from './components/ChatWindow'
import HomePage from './pages/HomePage'
import WordModal from './components/WordModal'
import ResultModal from './components/ResultModal'
import './App.css'

const GAME_DURATION = 5 * 60 // 5 minutes in seconds

const TOUR_STEPS = [
  {
    selector: '.word-badge',
    content:
      'This is your secret word. Use the blocks to draw this on the canvas so the AI can guess it.'
  },
  {
    selector: '.game-timer',
    content: 'You have 5 minutes to build your code and draw. Keep an eye on the timer!'
  },
  {
    selector: '.editor-section',
    content:
      'On the left is the Blockly workspace. Drag blocks from the toolbox to build a program.'
  },
  {
    selector: '.run-button',
    content:
      'Click the Run button to execute your blocks. The marker will follow your instructions and draw.'
  },
  {
    selector: '.canvas-section',
    content:
      'The drawing appears here. Adjust your blocks and run again until your picture matches the secret word.'
  }
]

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function AppInner() {
  // 'home' | 'word-select' | 'game'
  const [screen, setScreen] = useState('home')
  const [selectedWord, setSelectedWord] = useState(null)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timeUp, setTimeUp] = useState(false)

  const [commands, setCommands] = useState('')
  const [runSequence, setRunSequence] = useState(0)
  const [runCount, setRunCount] = useState(0)
  const [highlightBlockId, setHighlightBlockId] = useState(null)

  const [winInfo, setWinInfo] = useState(null) // { word, timeTakenSeconds, status, runCount }
  const [editorResetKey, setEditorResetKey] = useState(0)
  const [startTourAfterWordSelect, setStartTourAfterWordSelect] = useState(false)

  const timerRef = useRef(null)
  const { setIsOpen: setTourOpen, setSteps: setTourSteps } = useTour()

  // Start countdown when word is chosen
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current)
            setTimerRunning(false)
            setTimeUp(true)
            setWinInfo(
              (prev) =>
                prev ||
                (selectedWord
                  ? {
                      word: selectedWord,
                      timeTakenSeconds: GAME_DURATION,
                      status: 'timeout',
                      runCount
                    }
                  : null)
            )
            return 0
          }
          return t - 1
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [timerRunning, selectedWord, runCount])

  const handlePlay = () => {
    setScreen('word-select')
  }

  const handleHowToPlay = () => {
    setStartTourAfterWordSelect(true)
    setScreen('word-select')
  }

  const handleWordSelect = (word) => {
    setSelectedWord(word)
    setTimeLeft(GAME_DURATION)
    setTimeUp(false)
    setTimerRunning(true)
    setRunCount(0)
    setWinInfo(null)
    setScreen('game')

    if (startTourAfterWordSelect) {
      setTourOpen(true)
      setStartTourAfterWordSelect(false)
    }
  }

  const handleExit = useCallback(() => {
    clearInterval(timerRef.current)
    setTimerRunning(false)
    setSelectedWord(null)
    setTimeLeft(GAME_DURATION)
    setTimeUp(false)
    setCommands('')
    setRunSequence(0)
    setRunCount(0)
    setHighlightBlockId(null)
    setWinInfo(null)
    setTourOpen(false)
    setStartTourAfterWordSelect(false)
    setScreen('home')
  }, [])

  const handleRun = () => {
    setRunSequence((s) => s + 1)
    setRunCount((c) => c + 1)
  }

  const handleResultPlayAgain = useCallback(() => {
    clearInterval(timerRef.current)
    setTimerRunning(false)
    setCommands('')
    setRunSequence(0)
    setHighlightBlockId(null)
    setWinInfo(null)
    setRunCount(0)
    setEditorResetKey((k) => k + 1)
    setTimeLeft(GAME_DURATION)
    setTimeUp(false)
    setSelectedWord(null)
    setScreen('word-select')
  }, [])

  const handleGuessComplete = useCallback(
    ({ guess, categories }) => {
      if (!selectedWord) return

      const canonical = (str) =>
        (str || '').toString().trim().toLowerCase().replace(/\s+/g, '')

      const target = canonical(selectedWord)

      const allNames = [
        guess,
        ...(categories || []).map((c) =>
          c && (c.displayName || c.categoryName)
            ? c.displayName || c.categoryName
            : ''
        )
      ].filter(Boolean)

      const anyMatch = allNames.some((name) => canonical(name) === target)

      if (anyMatch) {
        setTimerRunning(false)
        const timeTakenSeconds = GAME_DURATION - timeLeft
        setWinInfo({
          word: selectedWord,
          timeTakenSeconds,
          status: 'win',
          runCount
        })
      }
    },
    [selectedWord, timeLeft, runCount]
  )

  const timerClass =
    timeLeft <= 60
      ? 'game-timer game-timer--danger'
      : timeLeft <= 120
        ? 'game-timer game-timer--warn'
        : 'game-timer'

  useEffect(() => {
    setTourSteps(TOUR_STEPS)
  }, [setTourSteps])

  if (screen === 'home') {
    return <HomePage onPlay={handlePlay} onHowToPlay={handleHowToPlay} />
  }

  return (
    <div className='app-container'>
      {/* Word selection modal when screen === 'word-select' */}
      {screen === 'word-select' && <WordModal onSelect={handleWordSelect} />}

      {winInfo && (
        <ResultModal
          word={winInfo.word}
          timeTakenSeconds={winInfo.timeTakenSeconds}
          status={winInfo.status}
          runCount={winInfo.runCount}
          onPlayAgain={handleResultPlayAgain}
          onClose={() => setWinInfo(null)}
        />
      )}

      <header className='app-header'>
        {/* Left: title */}
        <h1
          className='app-title'
          onClick={handleExit}
          style={{ cursor: 'pointer' }}
        >
          <span className='title-block'>Block</span>
          <span className='title-comma'>,</span>{' '}
          <span className='title-code'>Code</span>
          <span className='title-comma'>,</span>{' '}
          <span className='title-draw'>Draw!</span>
        </h1>

        {/* Centre: word + timer */}
        <div className='header-centre'>
          {selectedWord && (
            <div className='word-badge'>
              <span className='word-badge-label'>Drawing:</span>
              <span className='word-badge-word'>{selectedWord}</span>
            </div>
          )}
          {selectedWord && (
            <div className={timerClass}>
              ⏱ {formatTime(timeLeft)}
              {timeUp && <span className='timer-up-tag'>Time's up!</span>}
            </div>
          )}
        </div>

        {/* Right: Run + Exit */}
        <div className='header-actions'>
          <button className='run-button' onClick={handleRun}>
            <span className='run-icon'>▶</span> Run
          </button>
          <button
            className='exit-button'
            onClick={handleExit}
            title='Exit to home'
          >
            <span>✕</span> Exit
          </button>
        </div>
      </header>

      <main className='main-layout'>
        <section className='editor-section'>
          <BlocklyEditor
            onCodeChange={setCommands}
            highlightBlockId={highlightBlockId}
            resetKey={editorResetKey}
          />
        </section>

        <aside className='right-column'>
          <section className='canvas-section'>
            <DrawingCanvas
              commands={commands}
              runSequence={runSequence}
              onHighlight={setHighlightBlockId}
              onGuessComplete={handleGuessComplete}
            />
          </section>
          <section className='chat-section'>
            <ChatWindow />
          </section>
        </aside>
      </main>
    </div>
  )
}

export default function App() {
  const steps = [] // initial; AppInner will set actual steps via setSteps

  return (
    <TourProvider steps={steps} accentColor='#4f46e5'>
      <AppInner />
    </TourProvider>
  )
}
