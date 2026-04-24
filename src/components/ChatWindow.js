import React, { useState, useRef, useEffect } from 'react'
import { useTextGeneration } from '../ai/useTextGeneration'

const SYSTEM_PROMPT =
  'You are BCD AI Bot, a helpful coding assistant for a visual block-coding drawing app. ' +
  'The user arranges Blockly blocks to control a marker on a canvas. ' +
  'Available blocks: move_forward, move_backward, turn_left, turn_right, set_heading, jump_to, go_to_center, ' +
  'pen_up, pen_down, set_color, set_pen_size, set_random_color, clear_screen, ' +
  'draw_circle, draw_polygon, repeat_times, if_greater_than, if_less_than, if_equal_to, ' +
  'get_x, get_y, get_heading. ' +
  'Help the user figure out which blocks to use and how to combine them to draw their target shape. ' +
  'Keep replies concise (2–4 sentences). Be friendly and encouraging.'

const INITIAL_MESSAGES = [
  {
    role: 'assistant',
    content:
      "Hi! I'm BCD AI Bot! Tell me what you're trying to draw and I'll help you figure out which blocks to use!"
  }
]

const STATUS_LABEL = {
  idle: 'Starting…',
  loading: 'Loading AI',
  ready: 'Online',
  generating: 'Thinking…',
  error: 'Error'
}

function ChatWindow() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const { status, loadProgress, generate } = useTextGeneration()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, status])

  const handleSend = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || status !== 'ready') return

    const userMsg = { role: 'user', content: text }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')

    try {
      const chatPayload = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history
      ]
      const reply = await generate(chatPayload)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: reply || 'Hmm, let me think…' }
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Oops! Something went wrong. Try again!' }
      ])
    }
  }

  const isReady = status === 'ready'
  const statusLabel =
    status === 'loading'
      ? `Loading AI (${loadProgress}%)`
      : STATUS_LABEL[status]

  return (
    <div className='chat-window'>
      <div className='chat-header'>
        <span className='chat-title'>BCD AI Bot</span>
        <span className={`chat-status-dot chat-status-dot--${status}`} />
        <span className='chat-status-label'>{statusLabel}</span>
      </div>

      <div className='chat-messages'>
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble chat-bubble--${msg.role}`}>
            {msg.role === 'assistant' && (
              <span className='chat-bubble-label'>Bot</span>
            )}
            <p>{msg.content}</p>
          </div>
        ))}

        {status === 'generating' && (
          <div className='chat-bubble chat-bubble--assistant'>
            <span className='chat-bubble-label'>Bot</span>
            <p className='chat-typing'>
              <span />
              <span />
              <span />
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form className='chat-form' onSubmit={handleSend}>
        <input
          type='text'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isReady ? 'Give me a hint…' : statusLabel}
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
