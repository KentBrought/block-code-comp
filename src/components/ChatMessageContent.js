import React from 'react'
import ReactMarkdown from 'react-markdown'

const components = {
  a: ({ node: _n, ...props }) => (
    <a {...props} target='_blank' rel='noopener noreferrer' />
  ),
  pre: ({ node: _n, ...props }) => <pre className='chat-md-pre' {...props} />
}

/**
 * Renders assistant/user chat text with markdown (**bold**, lists, ```fences```).
 */
export default function ChatMessageContent({ text, variant = 'assistant' }) {
  if (text == null || text === '') return null
  return (
    <div className={`chat-markdown chat-markdown--${variant}`}>
      <ReactMarkdown components={components}>{text}</ReactMarkdown>
    </div>
  )
}
