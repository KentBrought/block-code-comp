import React, { useEffect, useMemo, useState } from 'react'
import {
  fetchQuickDrawExamples,
  normalizeStrokesToBox,
  simplifyDrawing
} from '../utils/quickDraw'

function strokeToPath(stroke = []) {
  if (!stroke.length) return ''
  const [start, ...rest] = stroke
  return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} ${rest
    .map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')}`
}

function DrawingPreview({ drawing, size = 56 }) {
  const normalizedStrokes = useMemo(() => {
    const simplified = simplifyDrawing(drawing, 3.8)
    return normalizeStrokesToBox(simplified, size, 5)
  }, [drawing, size])

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className='quickdraw-preview-svg'
      aria-hidden='true'
    >
      {normalizedStrokes.map((stroke, idx) => (
        <path
          key={`${idx}-${stroke.length}`}
          d={strokeToPath(stroke)}
          fill='none'
          stroke='currentColor'
          strokeWidth='2.2'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      ))}
    </svg>
  )
}

function QuickDrawPreview({ category, count = 2 }) {
  const [state, setState] = useState({
    loading: true,
    error: '',
    examples: []
  })

  useEffect(() => {
    let active = true
    setState({ loading: true, error: '', examples: [] })

    fetchQuickDrawExamples(category, count)
      .then((examples) => {
        if (!active) return
        setState({ loading: false, error: '', examples })
      })
      .catch(() => {
        if (!active) return
        setState({ loading: false, error: 'Preview unavailable', examples: [] })
      })

    return () => {
      active = false
    }
  }, [category, count])

  if (state.loading) {
    return <div className='quickdraw-preview-state'>Loading...</div>
  }

  if (state.error || state.examples.length === 0) {
    return <div className='quickdraw-preview-state quickdraw-preview-state--error'>No preview</div>
  }

  return (
    <div className='quickdraw-preview-list'>
      {state.examples.map((drawing, idx) => (
        <div key={`${category}-${idx}`} className='quickdraw-preview-item'>
          <DrawingPreview drawing={drawing} />
        </div>
      ))}
    </div>
  )
}

export default QuickDrawPreview
