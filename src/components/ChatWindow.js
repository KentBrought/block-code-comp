import React, { useState, useRef, useEffect } from 'react'
import { useTextGeneration } from '../ai/useTextGeneration'
import ChatMessageContent from './ChatMessageContent'

const BASE_SYSTEM_PROMPT =
  'You are BCD AI Bot, a helpful coding assistant for a visual block-coding drawing app for kids. ' +
  'The user arranges Blockly blocks to control a turtle on a canvas. ' +
  'Available blocks include: when_run_clicked, move_forward, move_backward, turn_left, turn_right, set_heading, jump_to, go_to_center, ' +
  'pen_up, pen_down, set_color, set_pen_size, set_random_color, clear_screen, draw_circle, draw_polygon, draw_line, draw_rectangle, arc, ' +
  'repeat_times, forever_loop, repeat_until, wait_until, if_condition, op_compare, op_logic, op_not, op_math, op_number, op_boolean, op_string, ' +
  'get_x, get_y, get_heading, variables_set, variables_get, math_change, array_create, array_get, array_add_item, object_create, object_get, object_set, note_comment, ' +
  'canvas_zoom_in, canvas_zoom_out, canvas_reset_zoom, canvas_toggle_grid, on_event_message, send_event_message, procedures_defnoreturn, procedures_callnoreturn. ' +
  'Teaching style rules: explain with short concrete steps, suggest exact blocks by name, and avoid long paragraphs. ' +
  'Each user message includes an up-to-date Blockly workspace snapshot (block counts, stack outline, generated JS, XML when available); use it for precise advice about what is on the workspace. ' +
  'You still cannot see the canvas drawing image directly; combine the snapshot with the user description and game state hints. ' +
  'Default response length: 2-5 short sentences. Be friendly and encouraging. ' +
  'You may use simple markdown (**bold**, numbered lists, `inline code`, short ``` fenced ``` snippets) so the in-app chat can render it clearly; keep fenced blocks short.'

/** After the model loads in challenge mode (Run may add the official hint separately). */
function buildChallengeReadyMessage() {
  return "I'm done loading! Let me know if you're stuck on a step or want another way to think about the puzzle — feel free to ask anything about this challenge or your blocks."
}

function buildClassicReadyMessage() {
  return "I'm done loading! Let me know if you're stuck on a block or how to shape your drawing — feel free to ask anything about this round."
}

function buildSystemPrompt(chatContext = {}) {
  const mode = chatContext?.mode || 'classic'
  const word = chatContext?.selectedWord || ''
  const challengeId = chatContext?.challengeId || ''
  const challengeTitle = chatContext?.challengeTitle || ''
  const challengeHint = chatContext?.challengeHint || ''
  const timerEnabled = Boolean(chatContext?.timerEnabled)
  const ghostEnabled = Boolean(chatContext?.ghostAssistEnabled)
  const runCount = Number.isFinite(chatContext?.runCount) ? chatContext.runCount : 0
  const ws = chatContext?.workspaceLlm || {}

  const sessionContext =
    mode === 'challenge'
      ? [
          '=== Session context (always use this; the user may not repeat it) ===',
          'MODE: challenge — the player is solving a fixed puzzle and should match the dashed ghost outline with the turtle.',
          challengeId ? `CHALLENGE_ID: ${challengeId}` : '',
          challengeTitle ? `CHALLENGE_TITLE: ${challengeTitle}` : '',
          challengeHint ? `CHALLENGE_HINT: ${challengeHint}` : '',
          'When the user asks for help, tie advice to this specific challenge (angles, repeats, pen, positions) unless they change topic.'
        ]
      : [
          '=== Session context (always use this; the user may not repeat it) ===',
          'MODE: classic (Play Now) — the player picks a secret word and draws so the vision model can guess it.',
          word ? `SELECTED_WORD: ${word}` : 'SELECTED_WORD: (not chosen yet — help them plan blocks generically).',
          'When a word is set, keep suggestions relevant to that word without spoiling the fun unless they ask for direct steps.'
        ]

  const modeRules =
    mode === 'challenge'
      ? [
          'Style for challenge mode: stay on this puzzle’s goal (title + hint). Give one small, concrete “check this next” idea (order, pen, repeats, turns) without naming exact winning numbers unless they ask for the full solution.',
          'Prefer questions or “try a tiny change then Run” over vague cheerleading.',
          'You cannot see the canvas image; use CHALLENGE_HINT and what the user says.'
        ]
      : [
          'Style for classic mode: simple drawing ideas in kid words; one step, then they try Run.',
          'Follow NO_DIRECT_SOLUTIONS: no full program or exact recipe for the secret word unless they clearly ask.',
          'You cannot see the canvas image; use what they say about their picture (not the word as a giveaway).'
        ]

  const runtimeContext = [
    `Timer enabled: ${timerEnabled ? 'yes' : 'no'}.`,
    `Ghost overlay (compare to dashed guide): ${ghostEnabled ? 'on' : 'off'}.`,
    `Run count this round: ${runCount}.`,
    'If run count is high, suggest one small change at a time and quick retest steps.'
  ]

  const workspaceLines = [
    '=== Current Blockly workspace (snapshot from just before this request; updates every time the user sends a message) ===',
    'Interpret BLOCK_COUNTS, STACK_OUTLINE, GENERATED_JS, and WORKSPACE_XML together; prefer STACK_OUTLINE for order and nesting hints.',
    ws.blockCounts
      ? `BLOCK_COUNTS: ${ws.blockCounts}`
      : 'BLOCK_COUNTS: (empty or workspace not synced yet — blocks may still be loading).',
    ws.stackOutline ? `STACK_OUTLINE:\n${ws.stackOutline}` : '',
    ws.code ? `GENERATED_JS:\n${ws.code}` : '',
    ws.xml ? `WORKSPACE_XML:\n${ws.xml}` : ''
  ].filter(Boolean)

  const winAudienceGuardrails = [
    '=== Win condition, audience, and spoiler rules (follow every time) ===',
    mode === 'challenge'
      ? 'WINNING (challenge puzzles): The player wins when their turtle drawing matches the light gray dashed ghost guide well enough that the game accepts it after they press Run (built-in shape matching). If they ask what “winning” means, explain that in simple words; do not recite internal score math or thresholds from code.'
      : 'WINNING (classic / Play Now): The player wins when they press Run and the guesser AI correctly names their secret drawing word. Never announce SELECTED_WORD as “the answer is …” or give a ready-made drawing recipe for that word unless they clearly say they want the full solution or the word revealed.',
    'AUDIENCE: elementary school (about ages 7–11). Use very short sentences, plain words, one idea at a time, and encouragement. Tie hints to CHALLENGE_TITLE / CHALLENGE_HINT in challenge mode, or to drawing goals in classic mode.',
    'NO_DIRECT_SOLUTIONS: Do not paste the raw workspace dump (BLOCK_COUNTS, long XML, full GENERATED_JS) into your reply; use it only to think. Do not give exact final numbers, full angle lists, or a complete block-by-block answer unless the user clearly asks for the whole solution.',
    'Prefer: one small “try changing … then press Run” style hint, or a question that helps them notice pen, repeats, turns, or order — still without handing them the winning values.'
  ]

  return [
    BASE_SYSTEM_PROMPT,
    ...sessionContext,
    ...modeRules,
    ...runtimeContext,
    ...winAudienceGuardrails,
    ...workspaceLines
  ].join('\n\n')
}

const INITIAL_MESSAGES = []
const INTRO_MESSAGE = buildClassicReadyMessage()

const STATUS_LABEL = {
  idle: 'Starting...',
  loading: 'Starting...',
  ready: 'Llama Online',
  generating: 'Thinking...',
  error: 'Error'
}

function toRoleBasedMessages(items = []) {
  return items.map((msg) => {
    if (msg && typeof msg === 'object' && 'role' in msg) return msg

    const role = msg?.user === 'BCD AI Bot' ? 'assistant' : 'user'
    const prefix = msg?.prefix || ''
    const bold = msg?.bold || ''
    const suffix = msg?.suffix || ''
    const text = msg?.text || `${prefix}${bold}${suffix}` || ''
    return { role, content: text, raw: msg }
  })
}

function ChatWindow({ messages: externalMessages = null, onSend = null, onModelStatusChange = null, chatContext = null }) {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [introTyping, setIntroTyping] = useState(false)
  const [introShown, setIntroShown] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const bottomRef = useRef(null)
  const messagesRef = useRef(null)
  const challengeTipSentForIdRef = useRef('')
  const prevChallengeIdRef = useRef('')
  const { status, loadProgress, generate } = useTextGeneration()

  const usingExternalMessages = Array.isArray(externalMessages)
  const displayedMessages = usingExternalMessages ? externalMessages : messages
  const normalizedMessages = toRoleBasedMessages(displayedMessages)

  useEffect(() => {
    if (!onModelStatusChange) return
    onModelStatusChange(status)
  }, [status, onModelStatusChange])

  useEffect(() => {
    const el = messagesRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
    bottomRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [normalizedMessages.length, status, introTyping, streamingText])

  useEffect(() => {
    const id = chatContext?.challengeId || ''
    if (id !== prevChallengeIdRef.current) {
      challengeTipSentForIdRef.current = ''
      prevChallengeIdRef.current = id
    }
  }, [chatContext?.challengeId])

  useEffect(() => {
    if (!usingExternalMessages) return
    if (!onSend) return
    if (chatContext?.mode === 'challenge') return

    if (normalizedMessages.length > 0) {
      setIntroTyping(false)
      setIntroShown(true)
      return
    }

    if (status !== 'ready') {
      setIntroShown(false)
      setIntroTyping(false)
      return
    }

    setIntroShown(false)
    setIntroTyping(true)
    const timer = setTimeout(() => {
      onSend(INTRO_MESSAGE, { from: 'assistant' })
      setIntroShown(true)
      setIntroTyping(false)
    }, 900)

    return () => clearTimeout(timer)
  }, [usingExternalMessages, onSend, normalizedMessages.length, status, chatContext?.mode])

  useEffect(() => {
    if (!usingExternalMessages) return
    if (!onSend) return
    if (chatContext?.mode !== 'challenge') return
    const id = chatContext?.challengeId || ''
    if (!id) return
    if (status !== 'ready') return
    if (challengeTipSentForIdRef.current === id) return

    setIntroTyping(true)
    const delay = normalizedMessages.length > 0 ? 400 : 550
    const timer = setTimeout(() => {
      onSend(buildChallengeReadyMessage(), { from: 'assistant' })
      setIntroShown(true)
      setIntroTyping(false)
      challengeTipSentForIdRef.current = id
    }, delay)

    return () => clearTimeout(timer)
  }, [
    usingExternalMessages,
    onSend,
    status,
    chatContext,
    chatContext?.mode,
    chatContext?.challengeId,
    displayedMessages,
    normalizedMessages.length
  ])

  const streamReply = async (text) => {
    setStreamingText('')
    for (let i = 1; i <= text.length; i += 2) {
      setStreamingText(text.slice(0, i))
      await new Promise((resolve) => setTimeout(resolve, 12))
    }
    setStreamingText('')
  }

  const handleSend = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || status !== 'ready') return

    const userMsg = { role: 'user', content: text, user: 'You', text }
    const history = [...normalizedMessages, userMsg]
    setInput('')

    if (onSend) {
      onSend(text, { from: 'user' })
    } else {
      setMessages(history)
    }

    try {
      const chatPayload = [
        { role: 'system', content: buildSystemPrompt(chatContext) },
        ...history
      ]
      const reply = await generate(chatPayload)
      const botText = reply || 'Hmm, let me think...'
      await streamReply(botText)

      if (onSend) {
        onSend(botText, { from: 'assistant' })
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: botText }
        ])
      }
    } catch {
      setStreamingText('')
      const errText = 'Oops! Something went wrong. Try again!'
      if (onSend) {
        onSend(errText, { from: 'assistant' })
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: errText }
        ])
      }
    }
  }

  const isReady = status === 'ready'
  const statusLabel = STATUS_LABEL[status]

  return (
    <div className='chat-window'>
      <div className='chat-header'>
        <span className='chat-title'>AI Helper Chat</span>
        <span className={`chat-status-dot chat-status-dot--${status}`} />
        <span className='chat-status-label'>{statusLabel}</span>
      </div>

      <div className='chat-messages' ref={messagesRef}>
        {normalizedMessages.map((msg, i) => (
          <div key={i} className={`chat-bubble chat-bubble--${msg.role}`}>
            <span className='chat-bubble-label'>
              {msg.role === 'assistant' ? '🤖 Bot' : '🧑 You'}
            </span>
            {msg.raw?.prefix || msg.raw?.bold || msg.raw?.suffix
              ? (
                <p>
                  {msg.raw?.prefix || ''}
                  {msg.raw?.bold
                    ? (
                      <strong style={msg.raw?.boldColor ? { color: msg.raw.boldColor } : undefined}>
                        {msg.raw.bold}
                      </strong>
                      )
                    : null}
                  {msg.raw?.suffix || ''}
                </p>
                )
              : (
                <ChatMessageContent
                  text={msg.content}
                  variant={msg.role === 'user' ? 'user' : 'assistant'}
                />
                )}
          </div>
        ))}

        {status === 'loading' && (
          <div className='chat-bubble chat-bubble--assistant'>
            <span className='chat-bubble-label'>🤖 Bot</span>
            <p>Loading AI... {loadProgress}%</p>
          </div>
        )}

        {(status === 'generating' || introTyping || streamingText) && (
          <div className='chat-bubble chat-bubble--assistant'>
            <span className='chat-bubble-label'>🤖 Bot</span>
            {streamingText
              ? <ChatMessageContent text={streamingText} variant='assistant' />
              : (
                <p className='chat-typing'>
                  <span />
                  <span />
                  <span />
                </p>
                )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form className='chat-form' onSubmit={handleSend}>
        <input
          type='text'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isReady ? 'Give me a hint...' : 'Loading AI helper...'}
          disabled={!isReady}
        />
        <button type='submit' disabled={!isReady || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  )
}

export default ChatWindow
