import React, { useEffect, useRef } from 'react'
import * as Blockly from 'blockly'
import 'blockly/blocks'
import { javascriptGenerator } from 'blockly/javascript'
import { FieldColour, registerFieldColour } from '@blockly/field-colour'
import {
  registerContinuousToolbox
} from '@blockly/continuous-toolbox'

registerFieldColour()

const EVENT_NEW = '__NEW_MESSAGE__'
const eventMessages = ['A']
let initialized = false
let continuousRegistered = false

export const customTheme = Blockly.Theme.defineTheme('blockCodeTheme', {
  base: Blockly.Themes.Classic,
  blockStyles: {
    variable_blocks: {
      colourPrimary: '#ffb703',
      colourSecondary: '#ffcf4d',
      colourTertiary: '#f28f00'
    },
    procedure_blocks: {
      colourPrimary: '#8b5cf6',
      colourSecondary: '#a78bfa',
      colourTertiary: '#6d28d9'
    }
  },
  categoryStyles: {
    variable_category: { colour: '#ffb703' },
    procedure_category: { colour: '#8b5cf6' }
  }
})

function getEventOptions() {
  return [
    ...eventMessages.map((name) => [name, name]),
    ['New Message', EVENT_NEW]
  ]
}

function handleEventSelection(newValue) {
  if (newValue !== EVENT_NEW) return newValue
  const created = window.prompt('New message name:')
  if (!created) return null
  const clean = created.trim()
  if (!clean) return null
  if (!eventMessages.includes(clean)) eventMessages.push(clean)
  return clean
}

export function initBlocks() {
  if (!continuousRegistered) {
    registerContinuousToolbox()
    continuousRegistered = true
  }

  if (initialized) return
  initialized = true

  Blockly.Blocks.when_run_clicked = {
    init: function () {
      this.appendDummyInput().appendField('when Run clicked')
      this.setNextStatement(true, null)
      this.setColour('#3bc75e')
      this.hat = 'cap'
    }
  }

  Blockly.Blocks.on_event_message = {
    init: function () {
      this.appendDummyInput()
        .appendField('on event')
        .appendField(new Blockly.FieldDropdown(getEventOptions, handleEventSelection), 'EVENT')
      this.appendStatementInput('DO')
      this.setColour('#3bc75e')
      this.hat = 'cap'
    }
  }

  Blockly.Blocks.send_event_message = {
    init: function () {
      this.appendDummyInput()
        .appendField('send event')
        .appendField(new Blockly.FieldDropdown(getEventOptions, handleEventSelection), 'EVENT')
      this.setPreviousStatement(true, null)
      this.setNextStatement(true, null)
      this.setColour('#3bc75e')
    }
  }

  Blockly.defineBlocksWithJsonArray([
    {
      type: 'move_forward',
      message0: 'move forward %1',
      args0: [{ type: 'input_value', name: 'STEPS', check: 'Number' }],
      previousStatement: null,
      nextStatement: null,
      colour: '#4895ef'
    },
    {
      type: 'move_backward',
      message0: 'move backward %1',
      args0: [{ type: 'input_value', name: 'STEPS', check: 'Number' }],
      previousStatement: null,
      nextStatement: null,
      colour: '#4895ef'
    },
    {
      type: 'turn_right',
      message0: 'turn right \u21bb %1 degrees',
      args0: [{ type: 'input_value', name: 'DEGREES', check: 'Number' }],
      previousStatement: null,
      nextStatement: null,
      colour: '#4895ef'
    },
    {
      type: 'turn_left',
      message0: 'turn left \u21ba %1 degrees',
      args0: [{ type: 'input_value', name: 'DEGREES', check: 'Number' }],
      previousStatement: null,
      nextStatement: null,
      colour: '#4895ef'
    },
    {
      type: 'jump_to',
      message0: 'jump to x: %1 y: %2',
      args0: [
        { type: 'input_value', name: 'X', check: 'Number' },
        { type: 'input_value', name: 'Y', check: 'Number' }
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      colour: '#4895ef'
    },
    {
      type: 'go_to_center',
      message0: 'go to center',
      previousStatement: null,
      nextStatement: null,
      colour: '#4895ef'
    },
    {
      type: 'set_heading',
      message0: 'set heading to %1 degrees',
      args0: [{ type: 'input_value', name: 'ANGLE', check: 'Number' }],
      previousStatement: null,
      nextStatement: null,
      colour: '#4895ef'
    },
    {
      type: 'get_x',
      message0: 'marker x',
      output: 'Number',
      colour: '#4895ef'
    },
    {
      type: 'get_y',
      message0: 'marker y',
      output: 'Number',
      colour: '#4895ef'
    },
    {
      type: 'get_heading',
      message0: 'marker heading',
      output: 'Number',
      colour: '#4895ef'
    },
    {
      type: 'pen_up',
      message0: 'pen up',
      previousStatement: null,
      nextStatement: null,
      colour: '#06d6a0'
    },
    {
      type: 'pen_down',
      message0: 'pen down',
      previousStatement: null,
      nextStatement: null,
      colour: '#06d6a0'
    },
    {
      type: 'set_color',
      message0: 'set color %1',
      args0: [{ type: 'input_value', name: 'COLOR', check: 'String' }],
      previousStatement: null,
      nextStatement: null,
      colour: '#06d6a0'
    },
    {
      type: 'set_random_color',
      message0: 'set random color',
      previousStatement: null,
      nextStatement: null,
      colour: '#06d6a0'
    },
    {
      type: 'set_pen_size',
      message0: 'set pen size to %1',
      args0: [{ type: 'input_value', name: 'SIZE', check: 'Number' }],
      previousStatement: null,
      nextStatement: null,
      colour: '#06d6a0'
    },
    {
      type: 'clear_screen',
      message0: 'clear screen',
      previousStatement: null,
      nextStatement: null,
      colour: '#06d6a0'
    },
    {
      type: 'draw_circle',
      message0: 'draw circle with radius %1',
      args0: [{ type: 'input_value', name: 'RADIUS', check: 'Number' }],
      previousStatement: null,
      nextStatement: null,
      colour: '#f72585'
    },
    {
      type: 'draw_polygon',
      message0: 'draw polygon with %1 sides and length %2',
      args0: [
        { type: 'input_value', name: 'SIDES', check: 'Number' },
        { type: 'input_value', name: 'LENGTH', check: 'Number' }
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      colour: '#f72585'
    },
    {
      type: 'wait_seconds',
      message0: 'wait %1 seconds',
      args0: [{ type: 'input_value', name: 'SECONDS', check: 'Number' }],
      previousStatement: null,
      nextStatement: null,
      colour: '#ff9500'
    },
    {
      type: 'repeat_times',
      message0: 'repeat %1 times',
      args0: [{ type: 'input_value', name: 'TIMES', check: 'Number' }],
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null,
      nextStatement: null,
      colour: '#ff9500'
    },
    {
      type: 'forever_loop',
      message0: 'forever',
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null,
      nextStatement: null,
      colour: '#ff9500'
    },
    {
      type: 'repeat_until',
      message0: 'repeat until %1',
      args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }],
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null,
      nextStatement: null,
      colour: '#ff9500'
    },
    {
      type: 'wait_until',
      message0: 'wait until %1',
      args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }],
      previousStatement: null,
      nextStatement: null,
      colour: '#ff9500'
    },
    {
      type: 'if_condition',
      message0: 'if %1 then',
      args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }],
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null,
      nextStatement: null,
      colour: '#ff9500'
    },
    {
      type: 'op_compare',
      message0: '%1 %2 %3',
      args0: [
        { type: 'input_value', name: 'A', check: 'Number' },
        {
          type: 'field_dropdown',
          name: 'OP',
          options: [
            ['<', '<'],
            ['>', '>'],
            ['=', '===']
          ]
        },
        { type: 'input_value', name: 'B', check: 'Number' }
      ],
      inputsInline: true,
      output: 'Boolean',
      colour: '#ef476f'
    },
    {
      type: 'op_logic',
      message0: '%1 %2 %3',
      args0: [
        { type: 'input_value', name: 'A', check: 'Boolean' },
        {
          type: 'field_dropdown',
          name: 'OP',
          options: [
            ['and', '&&'],
            ['or', '||']
          ]
        },
        { type: 'input_value', name: 'B', check: 'Boolean' }
      ],
      inputsInline: true,
      output: 'Boolean',
      colour: '#ef476f'
    },
    {
      type: 'op_not',
      message0: 'not %1',
      args0: [{ type: 'input_value', name: 'A', check: 'Boolean' }],
      inputsInline: true,
      output: 'Boolean',
      colour: '#ef476f'
    },
    {
      type: 'op_math',
      message0: '%1 %2 %3',
      args0: [
        { type: 'input_value', name: 'A', check: 'Number' },
        {
          type: 'field_dropdown',
          name: 'OP',
          options: [
            ['+', '+'],
            ['-', '-'],
            ['*', '*'],
            ['/', '/']
          ]
        },
        { type: 'input_value', name: 'B', check: 'Number' }
      ],
      inputsInline: true,
      output: 'Number',
      colour: '#ef476f'
    },
    {
      type: 'op_boolean',
      message0: '%1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'BOOL',
          options: [
            ['true', 'TRUE'],
            ['false', 'FALSE']
          ]
        }
      ],
      output: 'Boolean',
      colour: '#ef476f'
    },
    {
      type: 'op_number',
      message0: '%1',
      args0: [{ type: 'field_number', name: 'NUM', value: 0 }],
      output: 'Number',
      colour: '#ef476f'
    }
  ])

  Blockly.Blocks.color_value = {
    init: function () {
      this.appendDummyInput()
        .appendField('color')
        .appendField(new FieldColour('#f03e3e'), 'COLOR')
      this.setOutput(true, 'String')
      this.setColour('#06d6a0')
    }
  }

  javascriptGenerator.STATEMENT_PREFIX = 'await __step(%1);\n'
  javascriptGenerator.addReservedWords(
    '__step,__registerStart,__registerEvent,__emitEvent,waitSeconds'
  )
  const defaultScrub = javascriptGenerator.scrub_
  javascriptGenerator.scrub_ = function (block, code, thisOnly) {
    if (block.type === 'when_run_clicked') {
      return code
    }
    return defaultScrub.call(this, block, code, thisOnly)
  }

  javascriptGenerator.forBlock.when_run_clicked = (block) => {
    const next = block.getNextBlock()
    const body = next ? javascriptGenerator.blockToCode(next) : ''
    return `__registerStart(async () => {\n${body}});\n`
  }
  javascriptGenerator.forBlock.on_event_message = (block) => {
    const name = block.getFieldValue('EVENT') || 'A'
    const body = javascriptGenerator.statementToCode(block, 'DO')
    return `__registerEvent(${JSON.stringify(name)}, async () => {\n${body}});\n`
  }
  javascriptGenerator.forBlock.send_event_message = (block) => {
    const name = block.getFieldValue('EVENT') || 'A'
    return `await __emitEvent(${JSON.stringify(name)});\n`
  }

  const num = (block, key, fallback = '0') =>
    javascriptGenerator.valueToCode(block, key, javascriptGenerator.ORDER_NONE) || fallback

  javascriptGenerator.forBlock.move_forward = (block) => `await moveForward(${num(block, 'STEPS', '50')});\n`
  javascriptGenerator.forBlock.move_backward = (block) => `await moveBackward(${num(block, 'STEPS', '50')});\n`
  javascriptGenerator.forBlock.turn_right = (block) => `await turnRight(${num(block, 'DEGREES', '90')});\n`
  javascriptGenerator.forBlock.turn_left = (block) => `await turnLeft(${num(block, 'DEGREES', '90')});\n`
  javascriptGenerator.forBlock.jump_to = (block) => `await jumpTo(${num(block, 'X')}, ${num(block, 'Y')});\n`
  javascriptGenerator.forBlock.go_to_center = () => 'await goToCenter();\n'
  javascriptGenerator.forBlock.set_heading = (block) => `await setHeading(${num(block, 'ANGLE')});\n`

  javascriptGenerator.forBlock.get_x = () => ['getMarkerX()', javascriptGenerator.ORDER_FUNCTION_CALL]
  javascriptGenerator.forBlock.get_y = () => ['getMarkerY()', javascriptGenerator.ORDER_FUNCTION_CALL]
  javascriptGenerator.forBlock.get_heading = () => ['getMarkerHeading()', javascriptGenerator.ORDER_FUNCTION_CALL]

  javascriptGenerator.forBlock.pen_up = () => 'await penUp();\n'
  javascriptGenerator.forBlock.pen_down = () => 'await penDown();\n'
  javascriptGenerator.forBlock.set_random_color = () => 'await setRandomColor();\n'
  javascriptGenerator.forBlock.clear_screen = () => 'await clear();\n'
  javascriptGenerator.forBlock.set_pen_size = (block) => `await setPenSize(${num(block, 'SIZE', '3')});\n`
  javascriptGenerator.forBlock.draw_circle = (block) => `await drawCircle(${num(block, 'RADIUS', '50')});\n`
  javascriptGenerator.forBlock.draw_polygon = (block) =>
    `await drawPolygon(${num(block, 'SIDES', '5')}, ${num(block, 'LENGTH', '50')});\n`
  javascriptGenerator.forBlock.color_value = (block) => [`'${block.getFieldValue('COLOR')}'`, javascriptGenerator.ORDER_ATOMIC]
  javascriptGenerator.forBlock.set_color = (block) => {
    const color = javascriptGenerator.valueToCode(block, 'COLOR', javascriptGenerator.ORDER_NONE) || "'#f03e3e'"
    return `await setColor(${color});\n`
  }

  javascriptGenerator.forBlock.wait_seconds = (block) => `await waitSeconds(${num(block, 'SECONDS', '1')});\n`
  javascriptGenerator.forBlock.repeat_times = (block) => {
    const body = javascriptGenerator.statementToCode(block, 'DO')
    return `for (let _i = 0; _i < (${num(block, 'TIMES', '10')}); _i++) {\n${body}}\n`
  }
  javascriptGenerator.forBlock.forever_loop = (block) => {
    const body = javascriptGenerator.statementToCode(block, 'DO') || 'await waitSeconds(0.05);\n'
    return `while (true) {\n${body}}\n`
  }
  javascriptGenerator.forBlock.repeat_until = (block) => {
    const condition = javascriptGenerator.valueToCode(block, 'CONDITION', javascriptGenerator.ORDER_NONE) || 'false'
    const body = javascriptGenerator.statementToCode(block, 'DO')
    return `while (!(${condition})) {\n${body}}\n`
  }
  javascriptGenerator.forBlock.wait_until = (block) => {
    const condition = javascriptGenerator.valueToCode(block, 'CONDITION', javascriptGenerator.ORDER_NONE) || 'false'
    return `while (!(${condition})) { await waitSeconds(0.05); }\n`
  }
  javascriptGenerator.forBlock.if_condition = (block) => {
    const condition = javascriptGenerator.valueToCode(block, 'CONDITION', javascriptGenerator.ORDER_NONE) || 'false'
    const body = javascriptGenerator.statementToCode(block, 'DO')
    return `if (${condition}) {\n${body}}\n`
  }

  javascriptGenerator.forBlock.op_compare = (block) => {
    const op = block.getFieldValue('OP') || '==='
    const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_RELATIONAL) || '0'
    const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_RELATIONAL) || '0'
    return [`(${a} ${op} ${b})`, javascriptGenerator.ORDER_RELATIONAL]
  }
  javascriptGenerator.forBlock.op_logic = (block) => {
    const op = block.getFieldValue('OP') || '&&'
    const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_LOGICAL_AND) || 'false'
    const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_LOGICAL_AND) || 'false'
    const order = op === '&&' ? javascriptGenerator.ORDER_LOGICAL_AND : javascriptGenerator.ORDER_LOGICAL_OR
    return [`(${a} ${op} ${b})`, order]
  }
  javascriptGenerator.forBlock.op_not = (block) => {
    const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_LOGICAL_NOT) || 'false'
    return [`(!${a})`, javascriptGenerator.ORDER_LOGICAL_NOT]
  }
  javascriptGenerator.forBlock.op_math = (block) => {
    const op = block.getFieldValue('OP') || '+'
    const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_ADDITION) || '0'
    const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_ADDITION) || '0'
    return [`(${a} ${op} ${b})`, javascriptGenerator.ORDER_ADDITION]
  }
  javascriptGenerator.forBlock.op_boolean = (block) => [
    block.getFieldValue('BOOL') === 'TRUE' ? 'true' : 'false',
    javascriptGenerator.ORDER_ATOMIC
  ]
  javascriptGenerator.forBlock.op_number = (block) => [
    Number(block.getFieldValue('NUM') || 0).toString(),
    javascriptGenerator.ORDER_ATOMIC
  ]

  // Make Blockly "Functions" compatible with our async runtime.
  // We intentionally use standalone implementations to avoid HMR wrapper
  // chains from older generator overrides.
  const buildProcedureCallExpression = (block, generator) => {
    const fnName = generator.getProcedureName(block.getFieldValue('NAME'))
    const args = []
    const vars = block.getVars ? block.getVars() : []
    for (let i = 0; i < vars.length; i += 1) {
      args[i] =
        generator.valueToCode(block, `ARG${i}`, generator.ORDER_NONE) || 'null'
    }
    return `${fnName}(${args.join(', ')})`
  }

  const defineProcedure = (block, generator, hasReturn) => {
    const fnName = generator.getProcedureName(block.getFieldValue('NAME'))
    const args = []
    const vars = block.getVars ? block.getVars() : []
    for (let i = 0; i < vars.length; i += 1) {
      args[i] = generator.getVariableName(vars[i])
    }

    let body = generator.statementToCode(block, 'STACK') || ''
    if (hasReturn) {
      const returnValue =
        generator.valueToCode(block, 'RETURN', generator.ORDER_NONE) || ''
      if (returnValue) {
        body += `${generator.INDENT}return ${returnValue};\n`
      }
    }

    const code = `async function ${fnName}(${args.join(', ')}) {\n${body}}\n`
    if (generator.definitions_) {
      generator.definitions_[`procedures_${fnName}`] = code
    }
    return null
  }

  javascriptGenerator.forBlock.procedures_defnoreturn = (block, generator) =>
    defineProcedure(block, generator, false)

  javascriptGenerator.forBlock.procedures_defreturn = (block, generator) =>
    defineProcedure(block, generator, true)

  javascriptGenerator.forBlock.procedures_callnoreturn = (block, generator) =>
    `await ${buildProcedureCallExpression(block, generator)};\n`

  javascriptGenerator.forBlock.procedures_callreturn = (block, generator) => {
    const awaitOrder =
      typeof generator.ORDER_AWAIT === 'number'
        ? generator.ORDER_AWAIT
        : generator.ORDER_NONE
    return [`await (${buildProcedureCallExpression(block, generator)})`, awaitOrder]
  }
}

initBlocks()

export const defaultToolbox = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Events',
      colour: '#3bc75e',
      contents: [
        { kind: 'block', type: 'when_run_clicked' },
        { kind: 'block', type: 'on_event_message' },
        { kind: 'block', type: 'send_event_message' }
      ]
    },
    {
      kind: 'category',
      name: 'Motion',
      colour: '#4895ef',
      contents: [
        { kind: 'block', type: 'move_forward', inputs: { STEPS: { shadow: { type: 'op_number', fields: { NUM: 50 } } } } },
        { kind: 'block', type: 'move_backward', inputs: { STEPS: { shadow: { type: 'op_number', fields: { NUM: 50 } } } } },
        { kind: 'block', type: 'turn_right', inputs: { DEGREES: { shadow: { type: 'op_number', fields: { NUM: 90 } } } } },
        { kind: 'block', type: 'turn_left', inputs: { DEGREES: { shadow: { type: 'op_number', fields: { NUM: 90 } } } } },
        { kind: 'block', type: 'set_heading', inputs: { ANGLE: { shadow: { type: 'op_number', fields: { NUM: 0 } } } } },
        {
          kind: 'block',
          type: 'jump_to',
          inputs: {
            X: { shadow: { type: 'op_number', fields: { NUM: 0 } } },
            Y: { shadow: { type: 'op_number', fields: { NUM: 0 } } }
          }
        },
        { kind: 'block', type: 'go_to_center' },
        { kind: 'block', type: 'get_x' },
        { kind: 'block', type: 'get_y' },
        { kind: 'block', type: 'get_heading' }
      ]
    },
    {
      kind: 'category',
      name: 'Pen',
      colour: '#06d6a0',
      contents: [
        { kind: 'block', type: 'pen_up' },
        { kind: 'block', type: 'pen_down' },
        { kind: 'block', type: 'set_color', inputs: { COLOR: { shadow: { type: 'color_value', fields: { COLOR: '#f03e3e' } } } } },
        { kind: 'block', type: 'color_value' },
        { kind: 'block', type: 'set_random_color' },
        { kind: 'block', type: 'set_pen_size', inputs: { SIZE: { shadow: { type: 'op_number', fields: { NUM: 3 } } } } },
        { kind: 'block', type: 'clear_screen' }
      ]
    },
    {
      kind: 'category',
      name: 'Shapes',
      colour: '#f72585',
      contents: [
        { kind: 'block', type: 'draw_circle', inputs: { RADIUS: { shadow: { type: 'op_number', fields: { NUM: 50 } } } } },
        {
          kind: 'block',
          type: 'draw_polygon',
          inputs: {
            SIDES: { shadow: { type: 'op_number', fields: { NUM: 5 } } },
            LENGTH: { shadow: { type: 'op_number', fields: { NUM: 50 } } }
          }
        }
      ]
    },
    {
      kind: 'category',
      name: 'Control',
      colour: '#ff9500',
      contents: [
        { kind: 'block', type: 'wait_seconds', inputs: { SECONDS: { shadow: { type: 'op_number', fields: { NUM: 1 } } } } },
        { kind: 'block', type: 'repeat_times', inputs: { TIMES: { shadow: { type: 'op_number', fields: { NUM: 10 } } } } },
        { kind: 'block', type: 'forever_loop' },
        { kind: 'block', type: 'repeat_until' },
        { kind: 'block', type: 'wait_until' },
        { kind: 'block', type: 'if_condition' }
      ]
    },
    {
      kind: 'category',
      name: 'Operators',
      colour: '#ef476f',
      contents: [
        {
          kind: 'block',
          type: 'op_compare',
          inputs: {
            A: { shadow: { type: 'op_number', fields: { NUM: 0 } } },
            B: { shadow: { type: 'op_number', fields: { NUM: 0 } } }
          }
        },
        {
          kind: 'block',
          type: 'op_logic',
          inputs: {
            A: { shadow: { type: 'op_boolean', fields: { BOOL: 'TRUE' } } },
            B: { shadow: { type: 'op_boolean', fields: { BOOL: 'FALSE' } } }
          }
        },
        { kind: 'block', type: 'op_not', inputs: { A: { shadow: { type: 'op_boolean', fields: { BOOL: 'TRUE' } } } } },
        {
          kind: 'block',
          type: 'op_math',
          inputs: {
            A: { shadow: { type: 'op_number', fields: { NUM: 0 } } },
            B: { shadow: { type: 'op_number', fields: { NUM: 0 } } }
          }
        },
        { kind: 'block', type: 'op_number' },
        { kind: 'block', type: 'op_boolean' }
      ]
    },
    { kind: 'category', name: 'Variables', custom: 'VARIABLE', categorystyle: 'variable_category' },
    { kind: 'category', name: 'Functions', custom: 'PROCEDURE', categorystyle: 'procedure_category' }
  ]
}

const BlocklyEditor = ({ onCodeChange, highlightBlockId, resetKey, initialXml }) => {
  const blocklyDiv = useRef(null)
  const workspace = useRef(null)

  useEffect(() => {
    if (!workspace.current) return
    workspace.current.highlightBlock(highlightBlockId || null)
  }, [highlightBlockId])

  useEffect(() => {
    workspace.current = Blockly.inject(blocklyDiv.current, {
      renderer: 'zelos',
      theme: customTheme,
      toolbox: defaultToolbox,
      plugins: {
        toolbox: 'ContinuousToolbox',
        flyoutsVerticalToolbox: 'ContinuousFlyout',
        metricsManager: 'ContinuousMetrics'
      },
      move: { scrollbars: true, drag: true, wheel: true },
      zoom: { controls: true, wheel: true, startScale: 1, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 }
    })

    const startXmlText =
      initialXml ||
      `
      <xml xmlns="https://developers.google.com/blockly/xml">
        <block type="when_run_clicked" x="60" y="40"></block>
      </xml>
    `
    const startXml = Blockly.utils.xml.textToDom(startXmlText)
    Blockly.Xml.domToWorkspace(startXml, workspace.current)

    workspace.current.addChangeListener(() => {
      onCodeChange(javascriptGenerator.workspaceToCode(workspace.current))
    })
    onCodeChange(javascriptGenerator.workspaceToCode(workspace.current))

    return () => workspace.current && workspace.current.dispose()
  }, [onCodeChange, resetKey, initialXml])

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <div ref={blocklyDiv} style={{ height: '100%', width: '100%' }} />
      <div style={{ position: 'absolute', right: 10, top: 10, zIndex: 20, display: 'flex', gap: 8 }}>
        <button
          type='button'
          onClick={() => workspace.current && workspace.current.undo(false)}
          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #d0d7de', cursor: 'pointer' }}
        >
          Undo
        </button>
        <button
          type='button'
          onClick={() => workspace.current && workspace.current.undo(true)}
          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #d0d7de', cursor: 'pointer' }}
        >
          Redo
        </button>
      </div>
    </div>
  )
}

export function buildLessonToolbox(allowedTypes = []) {
  const allowed = new Set(allowedTypes)
  const includeVariables = allowed.has('__VARIABLES__')
  const includeFunctions = allowed.has('__PROCEDURES__')
  const baseCategories = (defaultToolbox?.contents || []).filter((cat) => Array.isArray(cat.contents))

  const lessonCategories = baseCategories
    .map((cat) => ({
      ...cat,
      contents: cat.contents.filter((item) => item?.kind === 'block' && allowed.has(item.type))
    }))
    .filter((cat) => cat.contents.length > 0)

  const customCategories = (defaultToolbox?.contents || []).filter(
    (cat) =>
      (includeVariables && cat.custom === 'VARIABLE') ||
      (includeFunctions && cat.custom === 'PROCEDURE')
  )

  return {
    kind: 'categoryToolbox',
    contents: [...lessonCategories, ...customCategories]
  }
}

export function buildLessonFlyoutToolbox(allowedTypes = []) {
  const allowed = new Set(allowedTypes)
  const baseCategories = (defaultToolbox?.contents || []).filter((cat) => Array.isArray(cat.contents))
  const blockMap = new Map()

  baseCategories.forEach((cat) => {
    cat.contents.forEach((item) => {
      if (item?.kind === 'block' && item.type) {
        blockMap.set(item.type, item)
      }
    })
  })

  const contents = []
  allowedTypes.forEach((type) => {
    if (type === '__VARIABLES__') {
      contents.push(
        { kind: 'label', text: 'Variables' },
        { kind: 'block', type: 'variables_set' },
        { kind: 'block', type: 'math_change' },
        { kind: 'block', type: 'variables_get' },
        { kind: 'sep', gap: '8' }
      )
      return
    }

    if (type === '__PROCEDURES__') {
      contents.push(
        { kind: 'label', text: 'Functions' },
        { kind: 'block', type: 'procedures_defnoreturn' },
        { kind: 'block', type: 'procedures_callnoreturn' },
        { kind: 'sep', gap: '8' }
      )
      return
    }

    if (!allowed.has(type)) return
    const item = blockMap.get(type) || { kind: 'block', type }
    contents.push(item)
  })

  return {
    kind: 'flyoutToolbox',
    contents
  }
}

export default BlocklyEditor
