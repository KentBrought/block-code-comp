import * as Blockly from 'blockly'
import { javascriptGenerator } from 'blockly/javascript'

const MAX_XML_CHARS = 12000
const MAX_CODE_CHARS = 8000
const MAX_STACK_OUTLINE = 6000

function summarizeBlockLine(block) {
  const parts = [block.type]
  try {
    block.inputList?.forEach((input) => {
      input.fieldRow?.forEach((field) => {
        const name = field.name
        if (!name || typeof field.getValue !== 'function') return
        const v = field.getValue()
        if (v !== undefined && v !== null && String(v) !== '') parts.push(`${name}=${String(v)}`)
      })
    })
  } catch {
    // ignore
  }
  return parts.join(' ')
}

/** Top-to-bottom chain on the main stack (next connection only). */
function mainChainOutline(block) {
  const lines = []
  let b = block
  while (b) {
    if (!b.isShadow()) lines.push(summarizeBlockLine(b))
    b = b.getNextBlock()
  }
  return lines.join('\n')
}

/** One line per top-level stack (each disconnected chain on the workspace). */
function buildStackOutline(workspace) {
  try {
    const tops = workspace.getTopBlocks(true)
    if (!tops.length) return ''
    const chunks = []
    tops.forEach((top, i) => {
      chunks.push(`Stack ${i + 1} (top ${top.type}):`)
      chunks.push(mainChainOutline(top))
    })
    const text = chunks.join('\n')
    return text.length > MAX_STACK_OUTLINE ? `${text.slice(0, MAX_STACK_OUTLINE)}\n...[stacks truncated]` : text
  } catch {
    return ''
  }
}

/**
 * Snapshot of the Blockly workspace for LLM context (counts, JS, XML, stack outline).
 * Safe to call frequently from workspace change listeners.
 */
export function buildWorkspaceLlmContext(workspace) {
  if (!workspace) {
    return { xml: '', blockCounts: '', code: '', stackOutline: '' }
  }

  let xml = ''
  try {
    if (Blockly.Xml && typeof Blockly.Xml.workspaceToDom === 'function') {
      const dom = Blockly.Xml.workspaceToDom(workspace)
      if (typeof XMLSerializer !== 'undefined' && dom) {
        xml = new XMLSerializer().serializeToString(dom)
      }
    }
  } catch {
    xml = ''
  }

  let code = ''
  try {
    code = javascriptGenerator.workspaceToCode(workspace) || ''
  } catch {
    code = ''
  }

  const counts = {}
  workspace.getAllBlocks(false).forEach((block) => {
    if (block.isShadow()) return
    const t = block.type
    counts[t] = (counts[t] || 0) + 1
  })
  const blockCounts = Object.entries(counts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => `${k}:${v}`)
    .join(', ')

  const stackOutline = buildStackOutline(workspace)

  const xmlOut =
    xml.length > MAX_XML_CHARS ? `${xml.slice(0, MAX_XML_CHARS)}\n...[xml truncated]` : xml
  const codeOut =
    code.length > MAX_CODE_CHARS ? `${code.slice(0, MAX_CODE_CHARS)}\n...[code truncated]` : code

  return { xml: xmlOut, blockCounts, code: codeOut, stackOutline }
}
