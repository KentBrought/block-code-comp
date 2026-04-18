import React, { useState, useEffect, useRef, useCallback } from 'react'
import { TourProvider, useTour } from '@reactour/tour'
import BlocklyEditor from './components/BlocklyEditor'
import DrawingCanvas from './components/DrawingCanvas'
import ChatWindow from './components/ChatWindow'
import HomePage from './pages/HomePage'
import WordModal from './components/WordModal'
import ChallengeModal from './components/ChallengeModal'
import ResultModal from './components/ResultModal'
import { findMatchingWordFromCandidates, WORD_POOL } from './constants/wordPool'
import './App.css'

const GAME_DURATION = 15 * 60

const TOUR_STEPS = [
  {
    selector: '.word-badge',
    content:
      'This is your secret word. Use the blocks to draw this on the canvas so the AI can guess it.'
  },
  {
    selector: '.game-timer',
    content: 'You have 15 minutes to build your code and draw. Keep an eye on the timer!'
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
  // 'home' | 'word-select' | 'challenge-select' | 'game'
  const [screen, setScreen] = useState('home')
  const [gameMode, setGameMode] = useState('classic') // 'classic' | 'challenge'
  const [selectedWord, setSelectedWord] = useState(null)
  const [selectedChallenge, setSelectedChallenge] = useState(null)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timeUp, setTimeUp] = useState(false)

  const [commands, setCommands] = useState('')
  const [runSequence, setRunSequence] = useState(0)
  const [stopSequence, setStopSequence] = useState(0)
  const [runCount, setRunCount] = useState(0)
  const [highlightBlockId, setHighlightBlockId] = useState(null)
  const [isRunning, setIsRunning] = useState(false)

  const [winInfo, setWinInfo] = useState(null)
  const [editorResetKey, setEditorResetKey] = useState(0)
  const [startTourAfterWordSelect, setStartTourAfterWordSelect] = useState(false)

  const timerRef = useRef(null)
  const { setIsOpen: setTourOpen, setSteps: setTourSteps } = useTour()

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
    setGameMode('classic')
    setScreen('word-select')
  }

  const handleHowToPlay = () => {
    setGameMode('classic')
    setStartTourAfterWordSelect(true)
    setScreen('word-select')
  }

  const handleChallengeMode = () => {
    setGameMode('challenge')
    setStartTourAfterWordSelect(false)
    setScreen('challenge-select')
  }

  const handleWordSelect = (word) => {
    setGameMode('classic')
    setSelectedWord(word)
    setSelectedChallenge(null)
    setTimeLeft(GAME_DURATION)
    setTimeUp(false)
    setTimerRunning(true)
    setRunCount(0)
    setWinInfo(null)
    setIsRunning(false)
    setScreen('game')
    setEditorResetKey((k) => k + 1)

    if (startTourAfterWordSelect) {
      setTourOpen(true)
      setStartTourAfterWordSelect(false)
    }
  }

  const handleChallengeSelect = (challenge) => {
    setGameMode('challenge')
    setSelectedChallenge(challenge)
    setSelectedWord(null)
    setTimeLeft(GAME_DURATION)
    setTimeUp(false)
    setTimerRunning(false)
    setRunCount(0)
    setCommands('')
    setRunSequence(0)
    setStopSequence(0)
    setHighlightBlockId(null)
    setIsRunning(false)
    setWinInfo(null)
    setEditorResetKey((k) => k + 1)
    setScreen('game')
  }

  const handleExit = useCallback(() => {
    clearInterval(timerRef.current)
    setTimerRunning(false)
    setSelectedWord(null)
    setSelectedChallenge(null)
    setTimeLeft(GAME_DURATION)
    setTimeUp(false)
    setCommands('')
    setRunSequence(0)
    setRunCount(0)
    setHighlightBlockId(null)
    setIsRunning(false)
    setWinInfo(null)
    setTourOpen(false)
    setStartTourAfterWordSelect(false)
    setGameMode('classic')
    setScreen('home')
  }, [setTourOpen])

  const handleRun = () => {
    if (isRunning) return
    setRunSequence((s) => s + 1)
    setRunCount((c) => c + 1)
  }

  const handleStop = () => {
    setIsRunning(false)
    setStopSequence((s) => s + 1)
    setHighlightBlockId(null)
  }

  const handleResultPlayAgain = useCallback(() => {
    clearInterval(timerRef.current)
    setTimerRunning(false)
    setCommands('')
    setRunSequence(0)
    setHighlightBlockId(null)
    setIsRunning(false)
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
      if (gameMode !== 'classic') return
      if (!selectedWord) return

      const allNames = [
        guess,
        ...(categories || []).map((c) =>
          c && (c.displayName || c.categoryName)
            ? c.displayName || c.categoryName
            : ''
        )
      ].filter(Boolean)

      const matchedWord = allNames
        .map((name) => findMatchingWordFromCandidates(name, WORD_POOL))
        .find(Boolean)

      if (matchedWord === selectedWord) {
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
    [gameMode, selectedWord, timeLeft, runCount]
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
    return (
      <HomePage
        onPlay={handlePlay}
        onHowToPlay={handleHowToPlay}
        onChallengeMode={handleChallengeMode}
      />
    )
  }

  return (
    <div className='app-container'>
      {screen === 'word-select' && (
        <WordModal
          onSelect={handleWordSelect}
          onBack={handleExit}
        />
      )}
      {screen === 'challenge-select' && (
        <ChallengeModal
          onSelect={handleChallengeSelect}
          onBack={handleExit}
        />
      )}

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

        <div className='header-centre'>
          {selectedWord && gameMode === 'classic' && (
            <div className='word-badge'>
              <span className='word-badge-label'>Drawing:</span>
              <span className='word-badge-word'>{selectedWord}</span>
            </div>
          )}
          {selectedChallenge && gameMode === 'challenge' && (
            <div className='word-badge word-badge--challenge'>
              <span className='word-badge-label'>Challenge:</span>
              <span className='word-badge-word'>{selectedChallenge.title}</span>
            </div>
          )}
          {selectedWord && gameMode === 'classic' && (
            <div className={timerClass}>
              {formatTime(timeLeft)}
              {timeUp && <span className='timer-up-tag'>Time&apos;s up!</span>}
            </div>
          )}
        </div>

        <div className='header-actions'>
          {!isRunning && (
            <button className='run-button' onClick={handleRun}>
              <span className='run-icon'>&gt;</span> Run
            </button>
          )}
          {isRunning && (
            <button
              className='stop-button'
              onClick={handleStop}
              title='Stop current run'
            >
              <span>[]</span> Stop
            </button>
          )}
          <button
            className='exit-button'
            onClick={handleExit}
            title='Exit to home'
          >
            <span>X</span> Exit
          </button>
        </div>
      </header>

      <main className='main-layout'>
        <section className='editor-section'>
          <BlocklyEditor
            onCodeChange={setCommands}
            highlightBlockId={highlightBlockId}
            resetKey={editorResetKey}
            initialXml={selectedChallenge ? selectedChallenge.starterXml : null}
          />
        </section>

        <aside className='right-column'>
          <section className='canvas-section'>
            <DrawingCanvas
              commands={commands}
              runSequence={runSequence}
              stopSequence={stopSequence}
              onHighlight={setHighlightBlockId}
              onGuessComplete={handleGuessComplete}
              onRunStateChange={setIsRunning}
              ghostPreview={selectedChallenge ? selectedChallenge.ghostPreview : null}
              hintText={selectedChallenge ? selectedChallenge.hint : null}
              showClassification={gameMode === 'classic'}
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
  const steps = []

  return (
    <TourProvider steps={steps} accentColor='#4f46e5'>
      <AppInner />
    </TourProvider>
  )
}
