import React, { useState, useEffect, useRef, useCallback } from 'react'
import { TourProvider, useTour } from '@reactour/tour'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
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
import { drawingToGhostPreview, fetchQuickDrawExamples } from './utils/quickDraw'
import './App.css'

const GAME_DURATION = 15 * 60

const EMPTY_WORKSPACE_LLM = { xml: '', blockCounts: '', code: '', stackOutline: '' }

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
      'On the left is the Blockly workspace. Drag blocks from sections like Motion, Pen, Shapes, Arrays, Objects, Comments, and Canvas to build a program.'
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
    () => [],
    []
  )

  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname.replace(/\/+$/, '') || '/'
  const [gameMode, setGameMode] = useState('classic') // 'classic' | 'challenge'
  const [selectedWord, setSelectedWord] = useState(null)
  const [selectedChallenge, setSelectedChallenge] = useState(null)
  const [ghostAssistEnabled, setGhostAssistEnabled] = useState(false)
  const [classicGhostPreview, setClassicGhostPreview] = useState(null)
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timeUp, setTimeUp] = useState(false)

  const [commands, setCommands] = useState('')
  const [workspaceLlmContext, setWorkspaceLlmContext] = useState(EMPTY_WORKSPACE_LLM)
  const [runSequence, setRunSequence] = useState(0)
  const [stopSequence, setStopSequence] = useState(0)
  const [runCount, setRunCount] = useState(0)
  const [highlightBlockId, setHighlightBlockId] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [chatMessages, setChatMessages] = useState(defaultChat)
  const [guessRound, setGuessRound] = useState(0)
  const [guessedSuccessfully, setGuessedSuccessfully] = useState(false)
  const [challengeComplete, setChallengeComplete] = useState(false)
  const [challengeHintIndex, setChallengeHintIndex] = useState(0)
  const [pendingChallengeHintFlush, setPendingChallengeHintFlush] = useState(false)
  const [aiModelStatus, setAiModelStatus] = useState('idle')

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
    navigate('/play')
  }

  const handleHowToPlay = () => {
    setGameMode('classic')
    setStartTourAfterWordSelect(true)
    navigate('/play')
  }

  const handleChallengeMode = () => {
    setGameMode('challenge')
    setStartTourAfterWordSelect(false)
    navigate('/challenge')
  }

  const handleAbout = () => {
    navigate('/about')
  }

  const handleLessons = () => {
    navigate('/lessons')
  }

  const handleWordSelect = (word) => {
    setGameMode('classic')
    setSelectedWord(word)
    setSelectedChallenge(null)
    setTimeLeft(GAME_DURATION)
    setTimeUp(false)
    setTimerRunning(timerEnabled)
    setRunCount(0)
    setIsRunning(false)
    setGuessRound(0)
    setGuessedSuccessfully(false)
    setChallengeHintIndex(0)
    setPendingChallengeHintFlush(false)
    setChatMessages([])
    setGhostAssistEnabled(false)
    setClassicGhostPreview(null)
    setWorkspaceLlmContext({ ...EMPTY_WORKSPACE_LLM })
    navigate('/game')
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
    setChallengeComplete(false)
    setChallengeHintIndex(0)
    setPendingChallengeHintFlush(false)
    setChatMessages([])
    setGhostAssistEnabled(true)
    setClassicGhostPreview(null)
    setWorkspaceLlmContext({ ...EMPTY_WORKSPACE_LLM })
    setEditorResetKey((k) => k + 1)
    navigate('/game')
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
    setChallengeComplete(false)
    setChallengeHintIndex(0)
    setPendingChallengeHintFlush(false)
    setChatMessages(defaultChat())
    setTourOpen(false)
    setStartTourAfterWordSelect(false)
    setGameMode('classic')
    setGhostAssistEnabled(false)
    setClassicGhostPreview(null)
    setWorkspaceLlmContext({ ...EMPTY_WORKSPACE_LLM })
    navigate('/')
  }, [defaultChat, navigate, setTourOpen])

  useEffect(() => {
    let active = true
    if (gameMode !== 'classic' || !selectedWord) {
      setClassicGhostPreview(null)
      return () => {
        active = false
      }
    }

    fetchQuickDrawExamples(selectedWord, 1)
      .then((examples) => {
        if (!active) return
        const preview = drawingToGhostPreview(examples?.[0], { size: 240, tolerance: 2.8 })
        setClassicGhostPreview(preview)
      })
      .catch(() => {
        if (!active) return
        setClassicGhostPreview(null)
      })

    return () => {
      active = false
    }
  }, [gameMode, selectedWord])

  const handleChallengeScore = useCallback(
    ({ score, pass }) => {
      if (!pass) return
      if (gameMode === 'challenge') {
        if (challengeComplete) return
        setChallengeComplete(true)
        return
      }
      if (gameMode === 'classic') {
        if (guessedSuccessfully || !selectedWord) return
        setTimerRunning(false)
        setGuessedSuccessfully(true)
        setChatMessages((prev) => [
          ...prev,
          {
            user: 'BCD AI Bot',
            prefix: 'Nice work! You matched the ghost outline for ',
            bold: selectedWord,
            suffix: '. You win! Click "Choose New Word" to play again.'
          }
        ])
      }
    },
    [challengeComplete, gameMode, guessedSuccessfully, selectedWord]
  )

  // Fire confetti the moment a challenge is solved.
  useEffect(() => {
    if (!challengeComplete) return
    confetti({ particleCount: 160, spread: 80, origin: { y: 0.55 } })
  }, [challengeComplete])

  // Properly tears down active game state before showing the challenge picker.
  const handleNewChallenge = useCallback(() => {
    setStopSequence((s) => s + 1) // cancel any in-flight animation
    setIsRunning(false)
    setCommands('')
    setRunSequence(0)
    setRunCount(0)
    setHighlightBlockId(null)
    setSelectedChallenge(null)
    setChallengeComplete(false)
    setChallengeHintIndex(0)
    setPendingChallengeHintFlush(false)
    setWorkspaceLlmContext({ ...EMPTY_WORKSPACE_LLM })
    setEditorResetKey((k) => k + 1)
    navigate('/challenge')
  }, [navigate])

  const handleRun = () => {
    if (isRunning) return
    if (guessedSuccessfully) return
    if (challengeComplete) return

    // Challenge hints go through the same chat UI as the LLM — wait until the
    // model is ready so a "🤖 Bot" hint never appears above "Loading AI...".
    if (gameMode === 'challenge') {
      if (aiModelStatus === 'ready') {
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
      } else if (selectedChallenge && !challengeComplete) {
        setPendingChallengeHintFlush(true)
      }
    }

    setRunSequence((s) => s + 1)
    setRunCount((c) => c + 1)
  }

  // If the player ran while the model was still loading, we skipped posting hints.
  // Flush the next queued hint once the model is ready so they still see it.
  useEffect(() => {
    if (aiModelStatus !== 'ready') return
    if (gameMode !== 'challenge') return
    if (challengeComplete) return
    if (!pendingChallengeHintFlush) return
    if (!selectedChallenge) return

    const challengeHints = [
      selectedChallenge.hint,
      'Tip: compare where your lines start and end against the gray outline.',
      'Tip: adjust repeat counts and turn angles in small steps.'
    ].filter(Boolean)

    setPendingChallengeHintFlush(false)

    if (challengeHints.length === 0) return

    setChallengeHintIndex((idx) => {
      if (idx >= challengeHints.length) return idx
      const text = challengeHints[idx]
      setChatMessages((prev) => [...prev, { user: 'BCD AI Bot', text }])
      return idx + 1
    })
  }, [
    aiModelStatus,
    gameMode,
    challengeComplete,
    pendingChallengeHintFlush,
    selectedChallenge
  ])

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
    setWorkspaceLlmContext({ ...EMPTY_WORKSPACE_LLM })
    setEditorResetKey((k) => k + 1)
    setTimeLeft(GAME_DURATION)
    setTimeUp(false)
    setSelectedWord(null)
    navigate('/play')
  }, [defaultChat, navigate])

  const formatConfidencePercent = (value) => {
    if (!Number.isFinite(value)) return '0%'
    const clamped = Math.max(0, Math.min(100, value))
    return `${clamped.toFixed(clamped >= 10 ? 1 : 2)}%`
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const streamAssistantMessage = useCallback(async (text) => {
    setChatMessages((prev) => [...prev, { user: 'BCD AI Bot', text: '' }])
    for (let i = 1; i <= text.length; i += 2) {
      const slice = text.slice(0, i)
      setChatMessages((prev) => {
        if (!prev.length) return prev
        const next = [...prev]
        next[next.length - 1] = { ...next[next.length - 1], text: slice }
        return next
      })
      await wait(10)
    }
  }, [])

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
    async ({ categories, error, emptyDrawing }) => {
      if (gameMode !== 'classic') return
      if (!selectedWord) return
      if (guessedSuccessfully) return

      if (emptyDrawing) {
        setChatMessages((prev) => [
          ...prev,
          {
            user: 'BCD AI Bot',
            text: "I don't see a drawing yet. Try using the blocks to draw something, then click Run again."
          }
        ])
        return
      }

      const allCategories = Array.isArray(categories) ? categories : []
      if (allCategories.length === 0) {
        const message = error
          ? `I couldn't analyze that drawing (${error}). Please try Run again.`
          : "Hmm, I couldn't read that drawing. Please redraw it and click Run again."
        setChatMessages((prev) => [
          ...prev,
          {
            user: 'BCD AI Bot',
            text: message
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
        const line = `I guess it's a ${guess.name} with ${guess.confidence} confidence.`
        await streamAssistantMessage(line)
        await wait(320)
      }

      const matchedWord = guesses
        .map((item) => item.name)
        .map((name) => findMatchingWordFromCandidates(name, WORD_POOL))
        .find(Boolean)

      if (matchedWord === selectedWord) {
        setTimerRunning(false)
        setGuessedSuccessfully(true)
        await streamAssistantMessage(`Awesome! I got it. Your drawing is ${selectedWord}! Click "Choose New Word" to play again.`)
      } else {
        setGuessRound((n) => n + 1)
        await streamAssistantMessage("Not quite yet. Please redraw and click Run again. I'll try 3 different guesses next time.")
      }
    },
    [gameMode, guessRound, guessedSuccessfully, selectedWord, streamAssistantMessage]
  )

  const timerClass =
    timeLeft <= 60
      ? 'game-timer game-timer--danger'
      : timeLeft <= 120
        ? 'game-timer game-timer--warn'
        : 'game-timer'
  const activeGhostPreview =
    gameMode === 'challenge'
      ? (selectedChallenge?.ghostPreview || null)
      : (classicGhostPreview || null)

  useEffect(() => {
    setTourSteps(TOUR_STEPS)
  }, [setTourSteps])

  if (currentPath === '/') {
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

  if (currentPath === '/about') {
    return <AboutPage onBack={() => navigate('/')} />
  }

  if (currentPath === '/lessons') {
    return <LessonsPage onBack={() => navigate('/')} />
  }

  if (/^\/lessons\/l\d+$/.test(currentPath)) {
    return <LessonsPage onBack={() => navigate('/')} />
  }

  if (currentPath.startsWith('/lessons/')) {
    return <Navigate to='/lessons' replace />
  }

  if (!['/play', '/challenge', '/game'].includes(currentPath)) {
    return <Navigate to='/' replace />
  }

  if (currentPath === '/game' && !selectedWord && !selectedChallenge) {
    return <Navigate to='/' replace />
  }

  return (
    <div className='app-container'>
      {currentPath === '/play' && (
        <WordModal
          onSelect={handleWordSelect}
          timerEnabled={timerEnabled}
          onTimerToggle={setTimerEnabled}
          onBack={handleExit}
        />
      )}
      {currentPath === '/challenge' && (
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
          {selectedChallenge && gameMode === 'challenge' && !challengeComplete && (
            <div className='word-badge word-badge--challenge'>
              <span className='word-badge-label'>Challenge:</span>
              <span className='word-badge-word'>{selectedChallenge.title}</span>
            </div>
          )}
          {selectedChallenge && gameMode === 'challenge' && challengeComplete && (
            <div className='word-badge word-badge--solved'>
              <span className='word-badge-label'>Solved:</span>
              <span className='word-badge-word'>{selectedChallenge.title}</span>
            </div>
          )}
          {selectedWord && gameMode === 'classic' && timerEnabled && (
            <div className={timerClass}>
              {formatTime(timeLeft)}
              {timeUp && <span className='timer-up-tag'>Time&apos;s up!</span>}
            </div>
          )}
        </div>

        <div className='header-actions'>
          {currentPath === '/game' && (gameMode === 'classic' || gameMode === 'challenge') && (
            <button
              className={`ghost-toggle-btn ${ghostAssistEnabled ? 'is-on' : 'is-off'}`}
              onClick={() => setGhostAssistEnabled((v) => !v)}
              title='Toggle ghost outline overlay'
              aria-pressed={ghostAssistEnabled}
            >
              <span className='ghost-toggle-label'>Ghost View</span>
              <span className='ghost-toggle-switch'>
                <span className='ghost-toggle-knob' />
              </span>
            </button>
          )}
          {!isRunning && !challengeComplete && (
            <button
              className='run-button'
              onClick={handleRun}
              title='Run program'
            >
              <span className='run-icon'>&gt;</span> Run
            </button>
          )}
          {gameMode === 'challenge' && challengeComplete && (
            <button className='run-button' onClick={handleNewChallenge}>
              New Challenge
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
            title='Back to home'
          >
            <span>←</span> Back to Home
          </button>
        </div>
      </header>

      <main className='main-layout'>
        <section className='editor-section'>
          <BlocklyEditor
            onCodeChange={setCommands}
            onWorkspaceContext={setWorkspaceLlmContext}
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
              onChallengeScore={handleChallengeScore}
              onRunStateChange={setIsRunning}
              showClassification={gameMode === 'classic'}
              ghostPreview={ghostAssistEnabled ? activeGhostPreview : null}
              scoreGhostPreview={ghostAssistEnabled ? activeGhostPreview : null}
            />
          </section>
          <section className='chat-section'>
            <ChatWindow
              messages={chatMessages}
              onModelStatusChange={setAiModelStatus}
              chatContext={{
                mode: gameMode,
                selectedWord,
                challengeId: selectedChallenge?.id || '',
                challengeTitle: selectedChallenge?.title || '',
                challengeHint: selectedChallenge?.hint || '',
                timerEnabled,
                ghostAssistEnabled,
                runCount,
                workspaceLlm: workspaceLlmContext
              }}
              onSend={(text, meta) =>
                setChatMessages((prev) => [
                  ...prev,
                  { user: meta?.from === 'assistant' ? 'BCD AI Bot' : 'You', text }
                ])
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
