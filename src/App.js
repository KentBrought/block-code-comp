import React, { useState, useEffect, useRef, useCallback } from 'react'
import { TourProvider, useTour } from '@reactour/tour'
import twemoji from 'twemoji'
import BlocklyEditor from './components/BlocklyEditor'
import DrawingCanvas from './components/DrawingCanvas'
import ChatWindow from './components/ChatWindow'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import LessonsPage from './pages/LessonsPage'
import WordModal from './components/WordModal'
import ChallengeModal from './components/ChallengeModal'
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
  const defaultChat = useCallback(
    () => [
      { user: 'BCD AI Bot', text: 'Welcome to Block, Code, Draw! Can I guess what you draw?' },
      { user: 'You', text: "Let's find out!" }
    ],
    []
  )

  // 'home' | 'about' | 'lessons' | 'word-select' | 'challenge-select' | 'game'
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
  const [chatMessages, setChatMessages] = useState(defaultChat)
  const [guessRound, setGuessRound] = useState(0)
  const [guessedSuccessfully, setGuessedSuccessfully] = useState(false)
  const [challengeHintIndex, setChallengeHintIndex] = useState(0)

  const [editorResetKey, setEditorResetKey] = useState(0)
  const [startTourAfterWordSelect, setStartTourAfterWordSelect] = useState(false)

  const timerRef = useRef(null)
  const { setIsOpen: setTourOpen, setSteps: setTourSteps } = useTour()

  useEffect(() => {
    const parseNode = (node) => {
      if (!(node instanceof Element || node instanceof Document || node instanceof DocumentFragment)) return
      twemoji.parse(node, {
        folder: 'svg',
        ext: '.svg',
        className: 'twemoji-emoji'
      })
    }

    parseNode(document.body)

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'characterData') {
          if (mutation.target?.parentElement) parseNode(mutation.target.parentElement)
          return
        }
        mutation.addedNodes.forEach((node) => parseNode(node))
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current)
            setTimerRunning(false)
            setTimeUp(true)
            if (selectedWord) {
              setChatMessages((prev) => [
                ...prev,
                {
                  user: 'BCD AI Bot',
                  text: `Time is up. The word was "${selectedWord}". Pick a new word to try again.`
                }
              ])
            }
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

  const handleAbout = () => {
    setScreen('about')
  }

  const handleLessons = () => {
    setScreen('lessons')
  }

  const handleWordSelect = (word) => {
    setGameMode('classic')
    setSelectedWord(word)
    setSelectedChallenge(null)
    setTimeLeft(GAME_DURATION)
    setTimeUp(false)
    setTimerRunning(true)
    setRunCount(0)
    setIsRunning(false)
    setGuessRound(0)
    setGuessedSuccessfully(false)
    setChallengeHintIndex(0)
    setChatMessages([
      { user: 'BCD AI Bot', text: "Awesome! I'll try to guess what your word is every time you click Run." }
    ])
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
    setGuessedSuccessfully(false)
    setChallengeHintIndex(0)
    setChatMessages([
      { user: 'BCD AI Bot', text: 'Challenge mode is on. Match the gray outline drawing.' }
    ])
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
    setGuessRound(0)
    setGuessedSuccessfully(false)
    setChallengeHintIndex(0)
    setChatMessages(defaultChat())
    setTourOpen(false)
    setStartTourAfterWordSelect(false)
    setGameMode('classic')
    setScreen('home')
  }, [defaultChat, setTourOpen])

  const handleRun = () => {
    if (isRunning) return
    if (guessedSuccessfully) return

    if (gameMode === 'challenge') {
      const challengeHints = selectedChallenge
        ? [
            selectedChallenge.hint,
            'Tip: compare where your lines start and end against the gray outline.',
            'Tip: adjust repeat counts and turn angles in small steps.'
          ].filter(Boolean)
        : []

      if (challengeHints.length === 0) {
        setChatMessages((prev) => [
          ...prev,
          { user: 'BCD AI Bot', text: 'All hints are used.' }
        ])
      } else if (challengeHintIndex < challengeHints.length) {
        setChatMessages((prev) => [
          ...prev,
          { user: 'BCD AI Bot', text: challengeHints[challengeHintIndex] }
        ])
        setChallengeHintIndex((n) => n + 1)
      } else {
        setChatMessages((prev) => [
          ...prev,
          { user: 'BCD AI Bot', text: 'All hints are used.' }
        ])
      }
    }

    setRunSequence((s) => s + 1)
    setRunCount((c) => c + 1)
  }

  const handleStop = () => {
    setIsRunning(false)
    setStopSequence((s) => s + 1)
    setHighlightBlockId(null)
  }

  const handleChooseNewWord = useCallback(() => {
    clearInterval(timerRef.current)
    setTimerRunning(false)
    setCommands('')
    setRunSequence(0)
    setHighlightBlockId(null)
    setIsRunning(false)
    setRunCount(0)
    setGuessRound(0)
    setGuessedSuccessfully(false)
    setChatMessages(defaultChat())
    setEditorResetKey((k) => k + 1)
    setTimeLeft(GAME_DURATION)
    setTimeUp(false)
    setSelectedWord(null)
    setScreen('word-select')
  }, [defaultChat])

  const formatConfidencePercent = (value) => {
    if (!Number.isFinite(value)) return '0%'
    const clamped = Math.max(0, Math.min(100, value))
    return `${clamped.toFixed(clamped >= 10 ? 1 : 2)}%`
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  const toReadableConfidence = (selected) => {
    const raw = selected.map((c) => Number(c?.score || 0))
    const safe = raw.every((v) => Number.isFinite(v) && v >= 0) ? raw : []
    const total = safe.reduce((sum, v) => sum + v, 0)

    if (total > 0) {
      return safe.map((v) => (v / total) * 100)
    }

    const equal = selected.length > 0 ? 100 / selected.length : 0
    return selected.map(() => equal)
  }

  const handleGuessComplete = useCallback(
    async ({ categories }) => {
      if (gameMode !== 'classic') return
      if (!selectedWord) return
      if (guessedSuccessfully) return

      const allCategories = Array.isArray(categories) ? categories : []
      if (allCategories.length === 0) {
        setChatMessages((prev) => [
          ...prev,
          {
            user: 'BCD AI Bot',
            text: "Hmm, I couldn't read that drawing. Please redraw it and click Run again."
          }
        ])
        return
      }

      const offset = (guessRound * 3) % allCategories.length
      const picked = []
      for (let i = 0; i < Math.min(3, allCategories.length); i += 1) {
        picked.push(allCategories[(offset + i) % allCategories.length])
      }

      const confidenceList = toReadableConfidence(picked)
      const guesses = picked.map((category, idx) => {
        const name = category?.displayName || category?.categoryName || 'Unknown'
        const matched = findMatchingWordFromCandidates(name, WORD_POOL)
        return {
          name,
          confidence: formatConfidencePercent(confidenceList[idx] || 0),
          isCorrect: matched === selectedWord
        }
      })

      for (const guess of guesses) {
        setChatMessages((prev) => [
          ...prev,
          {
            user: 'BCD AI Bot',
            prefix: "I guess it's a ",
            bold: guess.name,
            boldColor: guess.isCorrect ? '#16a34a' : '#000000',
            suffix: ` with ${guess.confidence} confidence.`
          }
        ])
        await wait(550)
      }

      const matchedWord = guesses
        .map((item) => item.name)
        .map((name) => findMatchingWordFromCandidates(name, WORD_POOL))
        .find(Boolean)

      if (matchedWord === selectedWord) {
        setTimerRunning(false)
        setGuessedSuccessfully(true)
        setChatMessages((prev) => [
          ...prev,
          {
            user: 'BCD AI Bot',
            prefix: 'Awesome! I got it. Your drawing is ',
            bold: selectedWord,
            suffix: '! Click "Choose New Word" to play again.'
          }
        ])
      } else {
        setGuessRound((n) => n + 1)
        setChatMessages((prev) => [
          ...prev,
          {
            user: 'BCD AI Bot',
            text: "Not quite yet. Please redraw and click Run again. I'll try 3 different guesses next time."
          }
        ])
      }
    },
    [gameMode, guessRound, guessedSuccessfully, selectedWord]
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
        onAbout={handleAbout}
        onLessons={handleLessons}
      />
    )
  }

  if (screen === 'about') {
    return <AboutPage onBack={() => setScreen('home')} />
  }

  if (screen === 'lessons') {
    return <LessonsPage onBack={() => setScreen('home')} />
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
          {gameMode === 'classic' && guessedSuccessfully && (
            <button
              className='run-button'
              onClick={handleChooseNewWord}
              title='Pick a new word'
            >
              Choose New Word
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
              showClassification={gameMode === 'classic'}
              showGuessPanel={gameMode !== 'classic'}
            />
          </section>
          <section className='chat-section'>
            <ChatWindow
              messages={chatMessages}
              onSend={(text) =>
                setChatMessages((prev) => [...prev, { user: 'You', text }])
              }
            />
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
