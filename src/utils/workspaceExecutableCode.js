import * as Blockly from 'blockly'
import { javascriptGenerator } from 'blockly/javascript'

export const RUN_ROOT_BLOCK_TYPES = new Set(['when_run_clicked', 'on_event_message'])
export const PROCEDURE_DEF_BLOCK_TYPES = new Set(['procedures_defnoreturn', 'procedures_defreturn'])
export const NOT_ATTACHED_TO_START_REASON = 'NOT_ATTACHED_TO_START'

function walkConnectedBlocks(block, reachableIds) {
  if (!block || block.isShadow() || reachableIds.has(block.id)) return
  reachableIds.add(block.id)

  const next = block.getNextBlock()
  if (next) walkConnectedBlocks(next, reachableIds)

  block.inputList.forEach((input) => {
    const child = input.connection?.targetBlock()
    if (child) walkConnectedBlocks(child, reachableIds)
  })
}

export function collectReachableExecutableBlockIds(workspace) {
  const reachableIds = new Set()
  if (!workspace) return reachableIds

  workspace.getTopBlocks(false).forEach((top) => {
    if (RUN_ROOT_BLOCK_TYPES.has(top.type) || PROCEDURE_DEF_BLOCK_TYPES.has(top.type)) {
      walkConnectedBlocks(top, reachableIds)
    }
  })

  return reachableIds
}

export function syncWorkspaceRunState(workspace) {
  if (!workspace) return

  const reachableIds = collectReachableExecutableBlockIds(workspace)
  const eventsApi = Blockly.Events
  const previousRecordUndo = eventsApi.getRecordUndo?.() ?? true

  if (typeof eventsApi.setRecordUndo === 'function') {
    eventsApi.setRecordUndo(false)
  }

  try {
    workspace.getAllBlocks(false).forEach((block) => {
      if (block.isInFlyout || block.isShadow()) return
      const attached = reachableIds.has(block.id)
      if (typeof block.setDisabledReason === 'function') {
        block.setDisabledReason(!attached, NOT_ATTACHED_TO_START_REASON)
      }
    })
  } finally {
    if (typeof eventsApi.setRecordUndo === 'function') {
      eventsApi.setRecordUndo(previousRecordUndo)
    }
  }
}

export function workspaceToExecutableCode(workspace) {
  if (!workspace) return ''

  javascriptGenerator.init(workspace)
  const codeChunks = []
  workspace.getTopBlocks(true).forEach((top) => {
    if (!RUN_ROOT_BLOCK_TYPES.has(top.type) && !PROCEDURE_DEF_BLOCK_TYPES.has(top.type)) return

    let generated = javascriptGenerator.blockToCode(top)
    if (Array.isArray(generated)) generated = generated[0]
    if (!generated) return

    if (top.outputConnection) {
      generated = javascriptGenerator.scrubNakedValue(generated)
      if (javascriptGenerator.STATEMENT_PREFIX && !top.suppressPrefixSuffix) {
        generated = javascriptGenerator.injectId(javascriptGenerator.STATEMENT_PREFIX, top) + generated
      }
      if (javascriptGenerator.STATEMENT_SUFFIX && !top.suppressPrefixSuffix) {
        generated += javascriptGenerator.injectId(javascriptGenerator.STATEMENT_SUFFIX, top)
      }
    }

    codeChunks.push(generated)
  })

  let code = javascriptGenerator.finish(codeChunks.join('\n'))
  code = code.replace(/^\s+\n/, '')
  code = code.replace(/\n\s+$/, '\n')
  return code.replace(/[ \t]+\n/g, '\n')
}
