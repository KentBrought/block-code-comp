import React, { useEffect, useMemo, useRef, useState } from 'react'

const ChatWindow = ({ messages = [], onSend }) => {
  const [input, setInput] = useState('')
  const listRef = useRef(null)

  const safeMessages = useMemo(() => {
    if (!Array.isArray(messages) || messages.length === 0) {
      return [{ user: 'BCD AI Bot', text: 'Welcome to Block, Code, Draw! Can I guess what you draw?' }]
    }
    return messages
  }, [messages])

  useEffect(() => {
    if (!listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [safeMessages])

  const sendMessage = (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    if (onSend) onSend(text)
    setInput('')
  }

  return (
    <div className='chat-window'>
      <div ref={listRef} className='messages'>
        {safeMessages.map((m, i) => (
          <div key={i} className='message'>
            <strong>{m.user}:</strong>{' '}
            {m.bold ? (
              <>
                {m.prefix || ''}
                <strong style={m.boldColor ? { color: m.boldColor } : undefined}>{m.bold}</strong>
                {m.suffix || ''}
              </>
            ) : (
              m.text
            )}
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Type a message...'
        />
        <button type='submit'>Send</button>
      </form>
    </div>
  )
}

export default ChatWindow
