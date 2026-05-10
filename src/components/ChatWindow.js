import React, { useState, useRef, useEffect } from 'react'
import { useTextGeneration } from '../ai/useTextGeneration'

const SYSTEM_PROMPT =
  'You are BCD AI Bot, a helpful coding assistant for a visual block-coding drawing app. ' +
  'The user arranges Blockly blocks to control a marker on a canvas. ' +
  'Available blocks include: move_forward, move_backward, turn_left, turn_right, set_heading, jump_to, go_to_center, ' +
  'pen_up, pen_down, set_color, set_pen_size, set_random_color, clear_screen, draw_circle, draw_polygon, draw_line, draw_rectangle, ' +
  'repeat_times, forever_loop, repeat_until, wait_until, if_condition, op_compare, op_logic, op_not, op_math, op_number, op_boolean, ' +
  'get_x, get_y, get_heading, array_create, array_get, array_push, object_create, object_get, object_set, note_comment, ' +
  'canvas_zoom_in, canvas_zoom_out, canvas_reset_zoom, canvas_toggle_grid. ' +
  'Help the user figure out which blocks to use and how to combine them to draw their target shape. ' +
  'Keep replies concise (2-4 sentences). Be friendly and encouraging.'

const INITIAL_MESSAGES = []
const INTRO_MESSAGE =
  "Hi! I'm BCD AI Bot! Tell me what you're trying to draw and I'll help you figure out which blocks to use!"

const STATUS_LABEL = {
  idle: 'Starting...',
  loading: 'Starting...',
  ready: 'Online',
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

function ChatWindow({ messages: externalMessages = null, onSend = null, onModelStatusChange = null }) {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [introTyping, setIntroTyping] = useState(false)
  const [introShown, setIntroShown] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const bottomRef = useRef(null)
  const messagesRef = useRef(null)
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
    if (!usingExternalMessages) return
    if (!onSend) return
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
  }, [usingExternalMessages, onSend, normalizedMessages.length, status])

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
        { role: 'system', content: SYSTEM_PROMPT },
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
              : <p>{msg.content}</p>}
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
              ? <p>{streamingText}</p>
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
