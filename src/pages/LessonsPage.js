import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as Blockly from 'blockly'
import { javascriptGenerator } from 'blockly/javascript'
import { buildLessonFlyoutToolbox, customTheme, initBlocks } from '../components/BlocklyEditor'
import DrawingCanvas from '../components/DrawingCanvas'
import './LessonsPage.css'

const STORAGE_KEY = 'bcd_lesson_progress_v3'
const OPENED_STORAGE_KEY = 'bcd_lesson_opened_v1'

const LEVEL_TITLES = {
  1: 'Make It Move',
  2: 'Repeat Magic',
  3: 'Smart Choices',
  4: 'Memory Powers',
  5: 'Rules + Sensors',
  6: 'Build Systems',
  7: 'Debug Like a Creator',
  8: 'Remix + Invent'
}

const BLOCK_LABELS = {
  when_run_clicked: 'when Run clicked',
  move_forward: 'move forward',
  turn_right: 'turn right',
  turn_left: 'turn left',
  pen_down: 'pen down',
  pen_up: 'pen up',
  clear_screen: 'clear screen',
  repeat_times: 'repeat',
  forever_loop: 'forever',
  wait_seconds: 'wait seconds',
  if_condition: 'if',
  op_compare: 'compare',
  op_logic: 'and/or',
  op_not: 'not',
  get_x: 'marker x',
  get_y: 'marker y',
  get_heading: 'marker heading',
  wait_until: 'wait until',
  repeat_until: 'repeat until',
  set_color: 'set color',
  color_value: 'color',
  set_pen_size: 'set pen size',
  draw_circle: 'draw circle',
  draw_polygon: 'draw polygon',
  variables_set: 'set variable',
  variables_get: 'get variable',
  math_change: 'change variable'
}

const BLOCK_TEACHING = {
  when_run_clicked: 'This is your start block. It tells the computer where to begin every single time you press Run. If this block is missing, your other blocks do not know when to wake up.',
  move_forward: 'This block moves the marker in the direction it is facing. Bigger numbers make longer lines, so this is one of your main shape-building blocks.',
  turn_right: 'This block rotates the marker to the right. Turn blocks plus move blocks are how corners and shapes are made.',
  turn_left: 'This block rotates the marker to the left. It is the mirror version of turn right and helps control direction.',
  pen_down: 'This tells the marker to draw while it moves. Use it when you want visible lines on the canvas.',
  pen_up: 'This tells the marker to move without drawing. It is useful when you want to reposition before drawing again.',
  clear_screen: 'This wipes the canvas so you can test again cleanly. It helps you compare one run to the next run without old lines in the way.',
  repeat_times: 'This repeats the same instructions again and again. It makes your program shorter and helps avoid copying blocks many times.',
  forever_loop: 'This keeps running until you stop the program. It is often used for animation or continuous game behavior.',
  wait_seconds: 'This pauses so motion is easier to see. Small waits can make fast loops readable for humans.',
  if_condition: 'This checks a rule and runs code only when the rule is true. It is how your program starts making smart decisions.',
  op_compare: 'This creates a true/false rule like greater than or less than. It is usually plugged into if, wait until, or repeat until blocks.',
  op_logic: 'This combines two true/false rules with and/or. Use it when one condition is not enough to describe your idea.',
  op_not: 'This flips true to false and false to true. It is useful when you want the opposite behavior of a condition.',
  get_x: 'This reads where the marker is on the left-right axis. It lets your code react to horizontal position.',
  get_y: 'This reads where the marker is on the up-down axis. It lets your code react to vertical position.',
  get_heading: 'This reads the direction the marker is facing. It helps you build rules based on orientation.',
  wait_until: 'This waits until a rule becomes true. It is helpful for timing moments in a sequence.',
  repeat_until: 'This loops until a rule becomes true. Think of it as “keep trying until the condition is met.”',
  set_color: 'This sets the pen color for future lines and shapes. Use it to separate parts of a drawing visually.',
  color_value: 'This picks the exact color value to use. Changing this value can completely change the mood of your art.',
  set_pen_size: 'This changes line thickness. Thick lines can emphasize, thin lines can add detail.',
  draw_circle: 'This draws a circle quickly using a radius. It is great for eyes, wheels, targets, and rounded designs.',
  draw_polygon: 'This draws many-sided shapes like triangles and pentagons. It turns side count and length into a full shape.',
  variables_set: 'This stores a value in memory. It is the starting point for score, timer, and lives systems.',
  variables_get: 'This reads a value from memory. Use it inside rules and math so the program can react to current state.',
  math_change: 'This increases or decreases a stored value. It is a core block for tracking progress over time.'
}

const LESSONS = [
  { id: 'l1', level: 1, title: 'Run Your First Program', goal: 'Make the marker do one action when you press Run.', intention: 'Programs need a start point.', task: 'Connect move forward under when Run clicked.', steps: ['Drag the green start block.', 'Snap one move block below it.', 'Press Check Lesson.'], toolbox: ['when_run_clicked', 'move_forward'], focusBlocks: ['when_run_clicked', 'move_forward'], rules: { requiredTypes: ['when_run_clicked', 'move_forward'], requireStartLinked: true } },
  { id: 'l2', level: 1, title: 'Two Steps in Order', goal: 'Make your marker do two actions in order.', intention: 'Computers follow instructions from top to bottom.', task: 'Use start, move, then turn.', steps: ['Place start block first.', 'Add move forward.', 'Add turn right after move.'], toolbox: ['when_run_clicked', 'move_forward', 'turn_right', 'turn_left'], focusBlocks: ['move_forward', 'turn_right'], rules: { requiredTypes: ['when_run_clicked', 'move_forward', 'turn_right'], requireStartLinked: true } },
  { id: 'l3', level: 1, title: 'Pen Up, Pen Down', goal: 'Control when the marker draws lines.', intention: 'Creators decide when to draw and when to move silently.', task: 'Use pen down before moving.', steps: ['Start your script.', 'Add pen down.', 'Add move forward.'], toolbox: ['when_run_clicked', 'pen_down', 'pen_up', 'move_forward'], focusBlocks: ['pen_down', 'pen_up', 'move_forward'], rules: { requiredTypes: ['when_run_clicked', 'pen_down', 'move_forward'], requireStartLinked: true } },
  { id: 'l4', level: 1, title: 'Clear and Draw Again', goal: 'Reset the canvas before drawing.', intention: 'Clean tests help you understand what changed.', task: 'Use clear screen, then draw.', steps: ['Put clear screen under start.', 'Add pen down.', 'Add move forward.'], toolbox: ['when_run_clicked', 'clear_screen', 'pen_down', 'move_forward'], focusBlocks: ['clear_screen', 'pen_down'], rules: { requiredTypes: ['when_run_clicked', 'clear_screen', 'move_forward'], requireStartLinked: true } },
  { id: 'l5', level: 2, title: 'Your First Loop', goal: 'Use repeat instead of copying blocks.', intention: 'Loops make code shorter and stronger.', task: 'Use repeat with move inside.', steps: ['Drag repeat.', 'Put move in the repeat body.', 'Connect repeat to start.'], toolbox: ['when_run_clicked', 'repeat_times', 'move_forward', 'op_number'], focusBlocks: ['repeat_times', 'move_forward'], rules: { requiredTypes: ['when_run_clicked', 'repeat_times', 'move_forward'], requireStartLinked: true } },
  { id: 'l6', level: 2, title: 'Square Loop', goal: 'Draw a square using one loop.', intention: 'Shapes are repeated patterns.', task: 'Use repeat + move + turn right.', steps: ['Set repeat to 4.', 'Put move and turn inside.', 'Check your work.'], toolbox: ['when_run_clicked', 'repeat_times', 'move_forward', 'turn_right', 'op_number'], focusBlocks: ['repeat_times', 'turn_right'], rules: { requiredTypes: ['when_run_clicked', 'repeat_times', 'move_forward', 'turn_right'], requireStartLinked: true } },
  { id: 'l7', level: 2, title: 'Forever Animation', goal: 'Build a script that keeps moving.', intention: 'Animations often run continuously.', task: 'Use forever with move or turn.', steps: ['Drag forever.', 'Place one motion block inside.', 'Add wait so movement is visible.'], toolbox: ['when_run_clicked', 'forever_loop', 'move_forward', 'turn_right', 'wait_seconds', 'op_number'], focusBlocks: ['forever_loop', 'wait_seconds'], rules: { requiredTypes: ['when_run_clicked', 'forever_loop'], requireStartLinked: true } },
  { id: 'l8', level: 2, title: 'Nested Pattern', goal: 'Use one repeat inside another repeat.', intention: 'Nested loops build big patterns from small loops.', task: 'Create nested loops with motion blocks.', steps: ['Drop repeat inside repeat.', 'Put move and turn in the inner loop.', 'Attach to start.'], toolbox: ['when_run_clicked', 'repeat_times', 'move_forward', 'turn_right', 'op_number'], focusBlocks: ['repeat_times', 'turn_right'], rules: { requiredTypes: ['when_run_clicked', 'repeat_times', 'move_forward', 'turn_right'], requireStartLinked: true } },
  { id: 'l9', level: 3, title: 'First If Rule', goal: 'Make code run only when a rule is true.', intention: 'Conditionals help programs make choices.', task: 'Use if + compare.', steps: ['Add if block.', 'Add compare in if hole.', 'Place move inside if body.'], toolbox: ['when_run_clicked', 'if_condition', 'op_compare', 'op_number', 'move_forward'], focusBlocks: ['if_condition', 'op_compare'], rules: { requiredTypes: ['when_run_clicked', 'if_condition', 'op_compare'], requireStartLinked: true } },
  { id: 'l10', level: 3, title: 'Use Marker X', goal: 'Use marker position in a rule.', intention: 'Programs can react to where they are.', task: 'Use marker x in compare block.', steps: ['Drag marker x.', 'Connect to compare.', 'Use compare inside if.'], toolbox: ['when_run_clicked', 'if_condition', 'op_compare', 'get_x', 'op_number', 'move_forward'], focusBlocks: ['get_x', 'op_compare', 'if_condition'], rules: { requiredTypes: ['when_run_clicked', 'if_condition', 'op_compare', 'get_x'], requireStartLinked: true } },
  { id: 'l11', level: 3, title: 'Logic And / Or', goal: 'Combine two rules in one condition.', intention: 'Big behavior grows from small rules.', task: 'Use logic block inside if.', steps: ['Drag and/or block.', 'Fill both sides with compare checks.', 'Place in if condition.'], toolbox: ['when_run_clicked', 'if_condition', 'op_logic', 'op_compare', 'get_x', 'get_y', 'op_number', 'move_forward'], focusBlocks: ['op_logic', 'op_compare'], rules: { requiredTypes: ['when_run_clicked', 'if_condition', 'op_logic'], requireStartLinked: true } },
  { id: 'l12', level: 3, title: 'Logic Not', goal: 'Invert a condition using not.', intention: 'Not flips true and false.', task: 'Use not in if condition.', steps: ['Drag not block.', 'Put compare inside not.', 'Use it in if.'], toolbox: ['when_run_clicked', 'if_condition', 'op_not', 'op_compare', 'op_number', 'get_y', 'move_forward'], focusBlocks: ['op_not', 'op_compare'], rules: { requiredTypes: ['when_run_clicked', 'if_condition', 'op_not'], requireStartLinked: true } },
  { id: 'l13', level: 4, title: 'Create a Score Variable', goal: 'Make your first memory box.', intention: 'Variables store information over time.', task: 'Use set variable.', steps: ['Open variable blocks.', 'Set variable value.', 'Connect under start.'], toolbox: ['when_run_clicked', '__VARIABLES__', 'op_number'], focusBlocks: ['variables_set'], rules: { requiredTypes: ['when_run_clicked', 'variables_set'], requireStartLinked: true } },
  { id: 'l14', level: 4, title: 'Change a Variable', goal: 'Increase or decrease stored value.', intention: 'Games update score and lives constantly.', task: 'Use change variable block.', steps: ['Set a variable first.', 'Add change block.', 'Use number value.'], toolbox: ['when_run_clicked', '__VARIABLES__', 'op_number'], focusBlocks: ['variables_set', 'math_change'], rules: { requiredTypes: ['when_run_clicked', 'variables_set', 'math_change'], requireStartLinked: true } },
  { id: 'l15', level: 4, title: 'Read a Variable', goal: 'Use memory value in a rule.', intention: 'Reading state lets code make smart decisions.', task: 'Use get variable inside compare.', steps: ['Set a variable.', 'Use get variable.', 'Place in compare and if.'], toolbox: ['when_run_clicked', '__VARIABLES__', 'if_condition', 'op_compare', 'op_number', 'move_forward'], focusBlocks: ['variables_get', 'op_compare'], rules: { requiredTypes: ['when_run_clicked', 'variables_set', 'variables_get', 'if_condition'], requireStartLinked: true } },
  { id: 'l16', level: 4, title: 'Loop + Score', goal: 'Update memory while repeating actions.', intention: 'State changes are often inside loops.', task: 'Use repeat and change variable together.', steps: ['Add repeat block.', 'Put change variable inside it.', 'Connect to start.'], toolbox: ['when_run_clicked', '__VARIABLES__', 'repeat_times', 'op_number', 'move_forward'], focusBlocks: ['repeat_times', 'math_change'], rules: { requiredTypes: ['when_run_clicked', 'repeat_times', 'math_change'], requireStartLinked: true } },
  { id: 'l17', level: 5, title: 'Use Marker Y', goal: 'Sense vertical position.', intention: 'Sensors let your program react to movement.', task: 'Use marker y in compare rule.', steps: ['Drag marker y.', 'Connect to compare.', 'Use in if condition.'], toolbox: ['when_run_clicked', 'if_condition', 'op_compare', 'get_y', 'op_number', 'turn_right'], focusBlocks: ['get_y', 'op_compare'], rules: { requiredTypes: ['when_run_clicked', 'if_condition', 'get_y', 'op_compare'], requireStartLinked: true } },
  { id: 'l18', level: 5, title: 'Wait Until True', goal: 'Pause until a rule passes.', intention: 'Timing controls keep code in the right order.', task: 'Use wait until with compare.', steps: ['Place wait until.', 'Build compare condition.', 'Attach to start script.'], toolbox: ['when_run_clicked', 'wait_until', 'op_compare', 'get_x', 'op_number', 'move_forward'], focusBlocks: ['wait_until', 'op_compare'], rules: { requiredTypes: ['when_run_clicked', 'wait_until', 'op_compare'], requireStartLinked: true } },
  { id: 'l19', level: 5, title: 'Repeat Until', goal: 'Repeat until a condition is true.', intention: 'This loop stops on purpose when the condition succeeds.', task: 'Use repeat until with compare.', steps: ['Drop repeat until block.', 'Add compare condition.', 'Put motion inside loop body.'], toolbox: ['when_run_clicked', 'repeat_until', 'op_compare', 'get_x', 'op_number', 'move_forward', 'turn_right'], focusBlocks: ['repeat_until', 'op_compare'], rules: { requiredTypes: ['when_run_clicked', 'repeat_until', 'op_compare'], requireStartLinked: true } },
  { id: 'l20', level: 5, title: 'Heading Rule', goal: 'Use direction in a condition.', intention: 'Direction checks help control movement behavior.', task: 'Use marker heading with compare.', steps: ['Get heading block.', 'Compare heading to number.', 'Use in if condition.'], toolbox: ['when_run_clicked', 'if_condition', 'op_compare', 'get_heading', 'op_number', 'move_forward'], focusBlocks: ['get_heading', 'op_compare'], rules: { requiredTypes: ['when_run_clicked', 'if_condition', 'get_heading', 'op_compare'], requireStartLinked: true } },
  { id: 'l21', level: 6, title: 'Setup Section', goal: 'Build a clean setup section.', intention: 'Setup helps your program start consistently.', task: 'Use clear, set color, and set pen size.', steps: ['Clear screen first.', 'Set color.', 'Set pen size before drawing.'], toolbox: ['when_run_clicked', 'clear_screen', 'set_color', 'color_value', 'set_pen_size', 'op_number', 'move_forward'], focusBlocks: ['clear_screen', 'set_color', 'set_pen_size'], rules: { requiredTypes: ['when_run_clicked', 'clear_screen', 'set_color', 'set_pen_size'], requireStartLinked: true } },
  { id: 'l22', level: 6, title: 'Shape System: Circle', goal: 'Draw a circle in a full script.', intention: 'Systems combine style setup and actions.', task: 'Use setup blocks and draw circle.', steps: ['Use start and setup.', 'Add draw circle.', 'Check completion.'], toolbox: ['when_run_clicked', 'clear_screen', 'set_color', 'color_value', 'draw_circle', 'op_number'], focusBlocks: ['draw_circle', 'set_color'], rules: { requiredTypes: ['when_run_clicked', 'draw_circle', 'set_color'], requireStartLinked: true } },
  { id: 'l23', level: 6, title: 'Shape System: Polygon', goal: 'Use sides and length for polygons.', intention: 'One block can create many different shapes.', task: 'Use draw polygon in script.', steps: ['Add draw polygon.', 'Set sides and length.', 'Run and check.'], toolbox: ['when_run_clicked', 'clear_screen', 'draw_polygon', 'op_number', 'set_color', 'color_value'], focusBlocks: ['draw_polygon', 'op_number'], rules: { requiredTypes: ['when_run_clicked', 'draw_polygon'], requireStartLinked: true } },
  { id: 'l24', level: 6, title: 'Multi-Part Program', goal: 'Combine setup, loop, and rule.', intention: 'Real projects are made from connected systems.', task: 'Use set color + repeat + if.', steps: ['Do setup first.', 'Add repeat block.', 'Add if rule in same script.'], toolbox: ['when_run_clicked', 'set_color', 'color_value', 'repeat_times', 'if_condition', 'op_compare', 'op_number', 'move_forward', 'turn_right'], focusBlocks: ['repeat_times', 'if_condition', 'set_color'], rules: { requiredTypes: ['when_run_clicked', 'set_color', 'repeat_times', 'if_condition'], requireStartLinked: true } },
  { id: 'l25', level: 7, title: 'Fix Missing Link', goal: 'Repair a broken connection.', intention: 'Many bugs are disconnected blocks.', task: 'Build start -> repeat -> move -> turn.', steps: ['Place start block.', 'Attach repeat below it.', 'Put move and turn in repeat body.'], toolbox: ['when_run_clicked', 'repeat_times', 'move_forward', 'turn_right', 'op_number'], focusBlocks: ['when_run_clicked', 'repeat_times'], rules: { requiredTypes: ['when_run_clicked', 'repeat_times', 'move_forward', 'turn_right'], requireStartLinked: true } },
  { id: 'l26', level: 7, title: 'Fix Wrong Block Type', goal: 'Swap incorrect blocks for correct ones.', intention: 'Debugging means comparing expected and real behavior.', task: 'Use move and turn, not only move.', steps: ['Create repeat.', 'Put move in repeat.', 'Add turn to complete pattern.'], toolbox: ['when_run_clicked', 'repeat_times', 'move_forward', 'turn_right', 'op_number'], focusBlocks: ['move_forward', 'turn_right'], rules: { requiredTypes: ['when_run_clicked', 'repeat_times', 'move_forward', 'turn_right'], requireStartLinked: true } },
  { id: 'l27', level: 7, title: 'Debug with Fast Tests', goal: 'Reset and rerun quickly while fixing.', intention: 'Fast cycles make debugging easier.', task: 'Use clear + wait + draw.', steps: ['Add clear screen first.', 'Add draw block.', 'Add wait to watch output.'], toolbox: ['when_run_clicked', 'clear_screen', 'draw_circle', 'wait_seconds', 'op_number'], focusBlocks: ['clear_screen', 'wait_seconds', 'draw_circle'], rules: { requiredTypes: ['when_run_clicked', 'clear_screen', 'draw_circle', 'wait_seconds'], requireStartLinked: true } },
  { id: 'l28', level: 8, title: 'Remix Starter', goal: 'Mix at least 5 different block types.', intention: 'Remixing helps you invent quickly.', task: 'Use 5 non-number blocks in one script.', steps: ['Start with green block.', 'Use at least five different block types.', 'Check completion.'], toolbox: ['when_run_clicked', 'clear_screen', 'set_color', 'color_value', 'set_pen_size', 'move_forward', 'turn_right', 'repeat_times', 'draw_circle', 'op_number'], focusBlocks: ['set_color', 'repeat_times', 'draw_circle'], rules: { requiredTypes: ['when_run_clicked'], minNonNumberBlocks: 5, requireStartLinked: true } },
  { id: 'l29', level: 8, title: 'Invent a Mini Tool', goal: 'Create your own drawing behavior.', intention: 'Invention means making your own rules.', task: 'Use loop + rule + shape together.', steps: ['Add repeat block.', 'Add if with compare.', 'Use circle or polygon.'], toolbox: ['when_run_clicked', 'repeat_times', 'if_condition', 'op_compare', 'op_number', 'draw_circle', 'draw_polygon', 'move_forward', 'turn_right'], focusBlocks: ['repeat_times', 'if_condition', 'draw_polygon'], rules: { requiredTypes: ['when_run_clicked', 'repeat_times', 'if_condition'], oneOfTypes: ['draw_circle', 'draw_polygon'], requireStartLinked: true } },
  { id: 'l30', level: 8, title: 'Capstone Build', goal: 'Build a full mini project with systems.', intention: 'Capstones show how your ideas and code fit together.', task: 'Use start + loop + condition + variable + shape.', steps: ['Add setup under start.', 'Use variables for state.', 'Add loops, rules, and one shape block.'], toolbox: ['when_run_clicked', '__VARIABLES__', 'repeat_times', 'if_condition', 'op_compare', 'op_number', 'draw_circle', 'draw_polygon', 'set_color', 'color_value', 'move_forward', 'turn_right'], focusBlocks: ['variables_set', 'repeat_times', 'if_condition', 'draw_circle'], rules: { requiredTypes: ['when_run_clicked', 'repeat_times', 'if_condition', 'variables_set'], oneOfTypes: ['draw_circle', 'draw_polygon'], minNonNumberBlocks: 7, requireStartLinked: true } }
]

const LESSONS_WITH_NUMBERS = LESSONS.map((lesson, index) => ({
  ...lesson,
  lessonNumber: index + 1
}))

function getLessonBlueprint(lessonNumber, level) {
  const STARTER_XML = {
    basic: `
      <xml xmlns="https://developers.google.com/blockly/xml">
        <block type="when_run_clicked" x="30" y="24">
          <next>
            <block type="move_forward" />
          </next>
        </block>
      </xml>
    `,
    moveTurn: `
      <xml xmlns="https://developers.google.com/blockly/xml">
        <block type="when_run_clicked" x="30" y="24">
          <next>
            <block type="move_forward">
              <next>
                <block type="turn_right" />
              </next>
            </block>
          </next>
        </block>
      </xml>
    `,
    repeat: `
      <xml xmlns="https://developers.google.com/blockly/xml">
        <block type="when_run_clicked" x="30" y="24">
          <next>
            <block type="repeat_times">
              <statement name="DO">
                <block type="move_forward">
                  <next>
                    <block type="turn_right" />
                  </next>
                </block>
              </statement>
            </block>
          </next>
        </block>
      </xml>
    `,
    decision: `
      <xml xmlns="https://developers.google.com/blockly/xml">
        <block type="when_run_clicked" x="30" y="24">
          <next>
            <block type="if_condition">
              <statement name="DO">
                <block type="move_forward" />
              </statement>
            </block>
          </next>
        </block>
      </xml>
    `,
    setup: `
      <xml xmlns="https://developers.google.com/blockly/xml">
        <block type="when_run_clicked" x="30" y="24">
          <next>
            <block type="clear_screen">
              <next>
                <block type="set_color" />
              </next>
            </block>
          </next>
        </block>
      </xml>
    `
  }

  const lineGhost = { lines: [{ points: [{ x: -95, y: 0 }, { x: 95, y: 0 }] }] }
  const cornerGhost = { lines: [{ points: [{ x: -75, y: 45 }, { x: 20, y: 45 }, { x: 20, y: -45 }] }] }
  const splitLineGhost = {
    lines: [
      { points: [{ x: -95, y: 15 }, { x: -20, y: 15 }] },
      { points: [{ x: 20, y: -15 }, { x: 95, y: -15 }] }
    ]
  }
  const squareGhost = {
    lines: [{ points: [{ x: -70, y: 60 }, { x: 70, y: 60 }, { x: 70, y: -60 }, { x: -70, y: -60 }], close: true }]
  }
  const circleGhost = { circles: [{ x: 0, y: 0, r: 58 }] }
  const triangleGhost = {
    lines: [{ points: [{ x: 0, y: 72 }, { x: 70, y: -52 }, { x: -70, y: -52 }], close: true }]
  }
  const pentagonGhost = {
    lines: [{ points: [{ x: 0, y: 72 }, { x: 70, y: 22 }, { x: 42, y: -62 }, { x: -42, y: -62 }, { x: -70, y: 22 }], close: true }]
  }

  const byLesson = {
    1: {
      starterXml: `
        <xml xmlns="https://developers.google.com/blockly/xml">
          <block type="when_run_clicked" x="30" y="24"></block>
        </xml>
      `,
      ghostPreview: lineGhost
    },
    2: {
      starterXml: `
        <xml xmlns="https://developers.google.com/blockly/xml">
          <block type="when_run_clicked" x="30" y="24">
            <next>
              <block type="move_forward" />
            </next>
          </block>
        </xml>
      `,
      ghostPreview: cornerGhost
    },
    3: {
      starterXml: `
        <xml xmlns="https://developers.google.com/blockly/xml">
          <block type="when_run_clicked" x="30" y="24">
            <next>
              <block type="move_forward" />
            </next>
          </block>
        </xml>
      `,
      ghostPreview: splitLineGhost
    },
    4: {
      starterXml: `
        <xml xmlns="https://developers.google.com/blockly/xml">
          <block type="when_run_clicked" x="30" y="24">
            <next>
              <block type="clear_screen" />
            </next>
          </block>
        </xml>
      `,
      ghostPreview: lineGhost
    },
    5: {
      starterXml: `
        <xml xmlns="https://developers.google.com/blockly/xml">
          <block type="when_run_clicked" x="30" y="24">
            <next>
              <block type="repeat_times">
                <statement name="DO"></statement>
              </block>
            </next>
          </block>
        </xml>
      `,
      ghostPreview: lineGhost
    },
    6: {
      starterXml: `
        <xml xmlns="https://developers.google.com/blockly/xml">
          <block type="when_run_clicked" x="30" y="24">
            <next>
              <block type="repeat_times">
                <statement name="DO">
                  <block type="move_forward" />
                </statement>
              </block>
            </next>
          </block>
        </xml>
      `,
      ghostPreview: squareGhost
    },
    7: { starterXml: STARTER_XML.repeat, ghostPreview: null },
    8: {
      starterXml: `
        <xml xmlns="https://developers.google.com/blockly/xml">
          <block type="when_run_clicked" x="30" y="24">
            <next>
              <block type="repeat_times">
                <statement name="DO">
                  <block type="repeat_times">
                    <statement name="DO">
                      <block type="move_forward" />
                    </statement>
                  </block>
                </statement>
              </block>
            </next>
          </block>
        </xml>
      `,
      ghostPreview: null
    },
    9: { starterXml: STARTER_XML.decision, ghostPreview: null },
    10: { starterXml: STARTER_XML.decision, ghostPreview: null },
    11: { starterXml: STARTER_XML.decision, ghostPreview: null },
    12: { starterXml: STARTER_XML.decision, ghostPreview: null },
    13: {
      starterXml: `
        <xml xmlns="https://developers.google.com/blockly/xml">
          <block type="when_run_clicked" x="30" y="24"></block>
        </xml>
      `,
      ghostPreview: null
    },
    14: {
      starterXml: `
        <xml xmlns="https://developers.google.com/blockly/xml">
          <block type="when_run_clicked" x="30" y="24">
            <next>
              <block type="variables_set" />
            </next>
          </block>
        </xml>
      `,
      ghostPreview: null
    },
    15: { starterXml: STARTER_XML.decision, ghostPreview: null },
    16: {
      starterXml: `
        <xml xmlns="https://developers.google.com/blockly/xml">
          <block type="when_run_clicked" x="30" y="24">
            <next>
              <block type="repeat_times">
                <statement name="DO"></statement>
              </block>
            </next>
          </block>
        </xml>
      `,
      ghostPreview: null
    },
    17: { starterXml: STARTER_XML.decision, ghostPreview: null },
    18: { starterXml: STARTER_XML.decision, ghostPreview: null },
    19: {
      starterXml: `
        <xml xmlns="https://developers.google.com/blockly/xml">
          <block type="when_run_clicked" x="30" y="24">
            <next>
              <block type="repeat_until">
                <statement name="DO">
                  <block type="move_forward" />
                </statement>
              </block>
            </next>
          </block>
        </xml>
      `,
      ghostPreview: null
    },
    20: { starterXml: STARTER_XML.decision, ghostPreview: null },
    21: { starterXml: STARTER_XML.setup, ghostPreview: null },
    22: {
      starterXml: `
        <xml xmlns="https://developers.google.com/blockly/xml">
          <block type="when_run_clicked" x="30" y="24">
            <next>
              <block type="clear_screen">
                <next>
                  <block type="set_color" />
                </next>
              </block>
            </next>
          </block>
        </xml>
      `,
      ghostPreview: circleGhost
    },
    23: {
      starterXml: `
        <xml xmlns="https://developers.google.com/blockly/xml">
          <block type="when_run_clicked" x="30" y="24">
            <next>
              <block type="clear_screen" />
            </next>
          </block>
        </xml>
      `,
      ghostPreview: pentagonGhost
    },
    24: { starterXml: STARTER_XML.setup, ghostPreview: null },
    25: {
      starterXml: `
        <xml xmlns="https://developers.google.com/blockly/xml">
          <block type="when_run_clicked" x="30" y="24">
            <next>
              <block type="repeat_times">
                <statement name="DO">
                  <block type="move_forward" />
                </statement>
              </block>
            </next>
          </block>
        </xml>
      `,
      ghostPreview: squareGhost
    },
    26: { starterXml: STARTER_XML.moveTurn, ghostPreview: squareGhost },
    27: {
      starterXml: `
        <xml xmlns="https://developers.google.com/blockly/xml">
          <block type="when_run_clicked" x="30" y="24">
            <next>
              <block type="clear_screen">
                <next>
                  <block type="draw_circle" />
                </next>
              </block>
            </next>
          </block>
        </xml>
      `,
      ghostPreview: circleGhost
    },
    28: { starterXml: STARTER_XML.setup, ghostPreview: null },
    29: { starterXml: STARTER_XML.decision, ghostPreview: triangleGhost },
    30: { starterXml: STARTER_XML.setup, ghostPreview: null }
  }

  return byLesson[lessonNumber] || { starterXml: STARTER_XML.basic, ghostPreview: null }
}

const LESSONS_ENRICHED = LESSONS_WITH_NUMBERS.map((lesson) => ({
  ...lesson,
  ...getLessonBlueprint(lesson.lessonNumber, lesson.level)
}))

const LESSON_ID_SET = new Set(LESSONS_ENRICHED.map((lesson) => lesson.id))

function sanitizeLessonIds(rawIds) {
  if (!Array.isArray(rawIds)) return []
  const uniqueValid = []
  const seen = new Set()
  rawIds.forEach((id) => {
    if (typeof id !== 'string') return
    if (!LESSON_ID_SET.has(id)) return
    if (seen.has(id)) return
    seen.add(id)
    uniqueValid.push(id)
  })
  return uniqueValid
}

function getCompletedFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return sanitizeLessonIds(parsed)
  } catch (error) {
    return []
  }
}

function getOpenedFromStorage() {
  try {
    const raw = localStorage.getItem(OPENED_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return sanitizeLessonIds(parsed)
  } catch (error) {
    return []
  }
}

function getDefaultNumberForInput(blockType, inputName) {
  const defaults = {
    move_forward: { STEPS: 50 },
    move_backward: { STEPS: 50 },
    turn_right: { DEGREES: 90 },
    turn_left: { DEGREES: 90 },
    set_heading: { ANGLE: 0 },
    set_pen_size: { SIZE: 3 },
    draw_circle: { RADIUS: 50 },
    draw_polygon: { SIDES: 5, LENGTH: 50 },
    wait_seconds: { SECONDS: 1 },
    repeat_times: { TIMES: 4 },
    op_compare: { A: 0, B: 0 },
    op_math: { A: 0, B: 0 }
  }
  const blockDefaults = defaults[blockType]
  if (!blockDefaults) return 0
  return blockDefaults[inputName] ?? 0
}

function ensureNumberInputs(workspace) {
  const valueInputType = Blockly.INPUT_VALUE
  workspace.getAllBlocks(false).forEach((block) => {
    block.inputList.forEach((input) => {
      if (input.type !== valueInputType || !input.connection) return
      if (input.connection.targetBlock()) return
      const checks = input.connection.getCheck()
      if (!Array.isArray(checks) || !checks.includes('Number')) return

      const shadow = workspace.newBlock('op_number')
      shadow.setShadow(true)
      shadow.setFieldValue(String(getDefaultNumberForInput(block.type, input.name)), 'NUM')
      shadow.initSvg()
      shadow.render()
      input.connection.connect(shadow.outputConnection)
    })
  })
}

function isLessonComplete(workspace, lesson) {
  const blocks = workspace.getAllBlocks(false)
  const countByType = {}
  blocks.forEach((block) => {
    countByType[block.type] = (countByType[block.type] || 0) + 1
  })

  const hasRequired = (lesson.rules.requiredTypes || []).every((type) => (countByType[type] || 0) > 0)
  if (!hasRequired) return false

  if (lesson.rules.oneOfTypes && !lesson.rules.oneOfTypes.some((type) => (countByType[type] || 0) > 0)) {
    return false
  }

  if (lesson.rules.minNonNumberBlocks) {
    const nonNumberCount = blocks.filter((block) => block.type !== 'op_number' && block.type !== 'math_number').length
    if (nonNumberCount < lesson.rules.minNonNumberBlocks) return false
  }

  if (lesson.rules.requireStartLinked) {
    const start = blocks.find((block) => block.type === 'when_run_clicked')
    if (!start || !start.getNextBlock()) return false
  }

  return true
}

function buildBlockSvgMarkup(block) {
  const root = block.getSvgRoot()
  if (!root) return null
  const bbox = root.getBBox()
  const padding = 8
  const width = Math.max(24, Math.ceil(bbox.width + padding * 2))
  const height = Math.max(24, Math.ceil(bbox.height + padding * 2))
  const clone = root.cloneNode(true)
  clone.querySelectorAll('text').forEach((node) => node.setAttribute('fill', '#ffffff'))
  clone.setAttribute('transform', `translate(${padding - bbox.x}, ${padding - bbox.y})`)
  const serializer = new XMLSerializer()
  const gMarkup = serializer.serializeToString(clone)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${gMarkup}</svg>`
}

function InlineBlockToken({ type, svg }) {
  return (
    <span className='inline-block-token'>
      <span className='inline-block-svg' dangerouslySetInnerHTML={{ __html: svg || '' }} />
      <span className='inline-block-label'>{BLOCK_LABELS[type] || type}</span>
    </span>
  )
}

function lessonChallengeText(lesson) {
  if (lesson.level <= 2) {
    return 'Try this after passing: change one number and predict how the drawing will change before you run again.'
  }
  if (lesson.level <= 4) {
    return 'Try this after passing: remix the script so it still passes, but draws something with a different style.'
  }
  if (lesson.level <= 6) {
    return 'Try this after passing: add one extra rule or setup step that makes the output cleaner or more intentional.'
  }
  return 'Try this after passing: make this lesson script into a mini artwork or mini challenge someone else can solve.'
}

function getBuildTargetText(lesson) {
  const preloadedEditHints = {
    2: 'Start with the preloaded script and adjust the turn so the path makes a clean corner.',
    3: 'Start with the preloaded script and add pen-control steps to match the split-line target.',
    4: 'Start from the preloaded clear block and add the drawing actions needed for one clean line.',
    5: 'The repeat structure is preloaded. Add and tune the inside motion steps.',
    6: 'Use the preloaded repeat skeleton and tune count/turn/move to form a square.',
    7: 'A loop scaffold is preloaded. Convert it into a stable forever-style animation.',
    8: 'Use the nested-loop starter and tune loop values for a cleaner pattern.',
    9: 'An if scaffold is preloaded. Add the missing rule logic and behavior.',
    10: 'Use the preloaded decision structure and connect marker-position checks.',
    11: 'Use the preloaded decision scaffold and combine checks with logic blocks.',
    12: 'Use the preloaded decision scaffold and invert the condition with not.',
    14: 'Variable setup is preloaded. Add the change step so memory updates over time.',
    15: 'Use the preloaded logic structure and connect variable reads into the rule.',
    16: 'Loop scaffold is preloaded. Add variable updates inside the repeating section.',
    18: 'Use the preloaded flow and add wait-until logic for timing control.',
    19: 'Use the repeat-until scaffold and tune the stop condition.',
    20: 'Use the decision scaffold and connect heading-based rule checks.',
    21: 'Setup skeleton is preloaded. Fill in color/size choices intentionally.',
    22: 'Use preloaded setup + shape steps and tune values to match the circle target.',
    23: 'Polygon starter is preloaded. Adjust sides/length/style to match the ghost shape.',
    24: 'Use the setup starter, then add the missing loop + rule behavior.',
    25: 'Use the loop starter and repair missing/incorrect parts to hit the square ghost.',
    26: 'Use the move-turn starter and correct ordering/values for the square target.',
    27: 'A clear/draw/wait skeleton is preloaded. Tune it for stable, testable output.',
    28: 'Use the setup starter, then expand into a richer remix with five+ block types.',
    29: 'Start from the decision scaffold and extend it into a custom shape behavior.',
    30: 'Use the capstone starter, then add variables, rules, and shape logic to complete it.'
  }
  return preloadedEditHints[lesson.lessonNumber] || lesson.task
}

function getInstructionSteps(lesson) {
  const stepsByLesson = {
    1: ['Add a motion idea so your program does something when it starts.', 'Keep your blocks in one connected stack.', 'Run your code and watch what happens.', 'If it does not move, adjust and try again.'],
    2: ['Make your path change direction.', 'Keep the actions in the right order.', 'Run and look for a clear corner shape.', 'Tweak values until the path looks clean.'],
    3: ['Decide when drawing should begin.', 'Mix moving with pen control.', 'Run and compare the line you get.', 'Edit one thing at a time to improve it.'],
    4: ['Set up your script so each run feels fresh.', 'Add drawing actions after setup.', 'Run twice to check that old marks do not stay around.', 'Adjust block order if needed.'],
    5: ['Use a loop so actions repeat automatically.', 'Place drawing or motion inside the loop.', 'Run and look for repetition.', 'Adjust loop settings to change the pattern.'],
    6: ['Use a loop to build a four-sided style path.', 'Combine moving and turning in the loop.', 'Run and compare with the target shape.', 'Tune values until it looks closer.'],
    7: ['Create motion that keeps going.', 'Slow it down enough so you can see it clearly.', 'Run and watch for smooth movement.', 'Refine the behavior if it looks jumpy.'],
    8: ['Use a loop inside another loop.', 'Give the inner loop a small repeating action.', 'Run and watch the bigger pattern form.', 'Adjust loop settings for a nicer result.'],
    9: ['Add a rule that decides when an action can happen.', 'Build a condition that can be tested.', 'Keep an action inside the rule block.', 'Run and check if the rule behaves how you expect.'],
    10: ['Use position to control behavior.', 'Build a condition using where the marker is.', 'Connect the condition to a decision block.', 'Run and test different values.'],
    11: ['Combine two rules into one bigger decision.', 'Use logic to connect both checks.', 'Run and see when the action triggers.', 'Switch logic choices and compare results.'],
    12: ['Try the opposite version of a rule.', 'Wrap a condition so it flips true/false behavior.', 'Run and watch what changes.', 'Adjust until the rule feels right.'],
    13: ['Create memory for your program.', 'Store a starting value.', 'Run and confirm your setup works.', 'Rename the variable so it is easy to understand.'],
    14: ['Update a memory value while the script runs.', 'Choose a change direction that makes sense for your goal.', 'Run and test the change.', 'Adjust the amount if it is too big or too small.'],
    15: ['Use memory inside a decision.', 'Read the stored value in a condition.', 'Run and see if behavior changes based on that value.', 'Tune your condition so it feels correct.'],
    16: ['Mix loops with memory updates.', 'Make sure memory changes while actions repeat.', 'Run and look for steady progress over time.', 'Refine values so the change is easy to notice.'],
    17: ['Use vertical position as a sensor.', 'Create a rule based on up/down location.', 'Run and see when your action turns on.', 'Adjust rule values to improve control.'],
    18: ['Pause until a condition is true.', 'Use a rule to decide when to continue.', 'Add an action after the wait step.', 'Run and check if timing feels right.'],
    19: ['Repeat actions until a condition is met.', 'Create a stop rule for the loop.', 'Run and watch where it ends.', 'Tune the condition so it stops at a better time.'],
    20: ['Use direction as part of a decision.', 'Build a rule based on heading.', 'Run and see how turning affects behavior.', 'Adjust the rule until it reacts the way you want.'],
    21: ['Build a stronger setup section.', 'Control style choices before drawing starts.', 'Run and compare different visual looks.', 'Keep the setup clear and organized.'],
    22: ['Add a circle-based drawing step.', 'Use the ghost as a guide for size and style.', 'Run and compare your drawing to the target.', 'Tweak values until it feels close.'],
    23: ['Add a polygon-based drawing step.', 'Shape it so it matches the target idea.', 'Run and compare with the ghost preview.', 'Tune settings to improve the match.'],
    24: ['Combine setup, repeating behavior, and a rule.', 'Keep everything in one clean script flow.', 'Run and test each part of the system.', 'Fix one part at a time if needed.'],
    25: ['Find what is missing in the pattern.', 'Add or fix blocks so the shape closes better.', 'Run and compare with the square guide.', 'Adjust values until corners look correct.'],
    26: ['Refactor your motion into a repeating system.', 'Keep turn and move working together.', 'Run and watch for a steady shape pattern.', 'Tune settings to improve accuracy.'],
    27: ['Make debugging easier by slowing things down a little.', 'Keep reset and drawing steps in good order.', 'Run and watch carefully for mistakes.', 'Edit and retest until behavior is stable.'],
    28: ['Remix your script with several different block types.', 'Keep everything connected from start.', 'Run and check if your remix still works.', 'Improve the look or behavior with one extra idea.'],
    29: ['Design a mini system with repetition and decisions.', 'Add at least one shape action to show your idea.', 'Run and observe how the system behaves.', 'Polish it until it feels intentional.'],
    30: ['Build a full mini project with multiple ideas working together.', 'Use memory, rules, repetition, and drawing in one plan.', 'Run and test like a creator: change, test, improve.', 'Keep refining until your project feels complete.']
  }

  return stepsByLesson[lesson.lessonNumber] || lesson.steps
}

function blockUsagePrompt(type) {
  switch (type) {
    case 'repeat_times':
      return 'Use this when you notice repeated actions and want cleaner, shorter scripts.'
    case 'if_condition':
      return 'Use this when behavior should change based on a rule.'
    case 'variables_set':
    case 'variables_get':
    case 'math_change':
      return 'Use this for memory so your program can track state over time.'
    case 'draw_circle':
    case 'draw_polygon':
      return 'Use this to create base shapes, then layer custom movement and style on top.'
    default:
      return 'Use this as one of the core building blocks for today’s mission.'
  }
}

function lessonFallbackVisual(level) {
  const byLevel = {
    1: '🚀',
    2: '🔁',
    3: '🧠',
    4: '📦',
    5: '🧭',
    6: '🛠️',
    7: '🐞',
    8: '🎨'
  }
  return byLevel[level] || '✨'
}

function LessonDetail({ lesson, isDone, onComplete, onBackToCatalog, onNext, onPrev, canPrev, canNext }) {
  const mountRef = useRef(null)
  const workspaceRef = useRef(null)
  const [message, setMessage] = useState('')
  const [checking, setChecking] = useState(false)
  const [blockPreviews, setBlockPreviews] = useState({})
  const [commands, setCommands] = useState('')
  const [runSequence, setRunSequence] = useState(0)
  const [stopSequence, setStopSequence] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    initBlocks()
    const starterType = lesson.toolbox.includes('when_run_clicked') ? 'when_run_clicked' : lesson.toolbox[0]
    const starterXml = lesson.starterXml || `<xml xmlns="https://developers.google.com/blockly/xml"><block type="${starterType}" x="24" y="24"></block></xml>`
    workspaceRef.current = Blockly.inject(mountRef.current, {
      renderer: 'zelos',
      theme: customTheme,
      toolbox: buildLessonFlyoutToolbox(lesson.toolbox),
      trashcan: true,
      move: { scrollbars: false, drag: true, wheel: false },
      zoom: { controls: false, wheel: false, startScale: 0.95, maxScale: 1.6, minScale: 0.6, scaleSpeed: 1.1 }
    })
    Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(starterXml), workspaceRef.current)
    ensureNumberInputs(workspaceRef.current)
    workspaceRef.current.addChangeListener(() => {
      setCommands(javascriptGenerator.workspaceToCode(workspaceRef.current))
    })
    setCommands(javascriptGenerator.workspaceToCode(workspaceRef.current))

    const previewMap = {}
    lesson.focusBlocks.forEach((type) => {
      if (!Blockly.Blocks[type]) return
      try {
        const block = workspaceRef.current.newBlock(type)
        block.initSvg()
        block.render()
        const markup = buildBlockSvgMarkup(block)
        if (markup) previewMap[type] = markup
        block.dispose(false)
      } catch (error) {
        // Keep lesson page resilient if a preview block fails.
      }
    })
    setBlockPreviews(previewMap)

    return () => {
      if (workspaceRef.current) {
        workspaceRef.current.dispose()
        workspaceRef.current = null
      }
    }
  }, [lesson])

  useEffect(() => {
    setMessage('')
    setChecking(false)
    setRunSequence(0)
    setStopSequence(0)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [lesson.id])

  const handleRunAndCheck = async () => {
    if (!workspaceRef.current || checking) return
    setStopSequence((n) => n + 1)
    setRunSequence((n) => n + 1)
    setChecking(true)
    setMessage('')
    await new Promise((resolve) => setTimeout(resolve, 700))
    const passed = isLessonComplete(workspaceRef.current, lesson)
    if (passed) {
      setMessage('Awesome work. Lesson complete.')
      onComplete(lesson.id)
    } else {
      setMessage('Nice try. Follow the mission and steps, then check again.')
    }
    setChecking(false)
  }

  return (
    <section className='lesson-detail-page'>
      <div className='lesson-detail-top'>
        <span className={`lesson-pill ${isDone ? 'done' : 'todo'}`}>{isDone ? 'Completed' : 'Not Completed Yet'}</span>
      </div>

      <p className='lesson-level-label'>Level {lesson.level}: {LEVEL_TITLES[lesson.level]}</p>
      <h2>Lesson {lesson.lessonNumber}: {lesson.title}</h2>

      <p className='lesson-long-text'>
        In this lesson, your goal is to <strong>{lesson.goal.toLowerCase()}</strong>. We are doing this because
        {` ${lesson.intention.toLowerCase()}`}. Think of this as practice for real projects where your code needs
        to be clear, repeatable, and easy to improve when something goes wrong.
      </p>
      <p className='lesson-long-text'>
        Mission for this lesson: <strong>{lesson.task}</strong>. Start with a small version that works,
        then improve it one edit at a time. If something breaks, undo one change and test again so
        you can tell exactly what caused the change.
      </p>
      <p className='lesson-long-text'>
        A reliable strategy is to debug in this order: first sequence, then loops/conditions, then
        number values. That keeps you from trying to fix five problems at once.
      </p>

      <section className='lesson-block-focus-grid'>
        {lesson.focusBlocks.map((type) => (
          <article key={type} className='lesson-block-focus-item'>
            <InlineBlockToken type={type} svg={blockPreviews[type]} />
            <p className='lesson-long-text'>
              {BLOCK_TEACHING[type] || 'Use this block as part of your solution in this lesson.'}{' '}
              {blockUsagePrompt(type)}
            </p>
          </article>
        ))}
      </section>

      <div className='studio-shell'>
        <div className='studio-toolbar'>
          <p><strong>Interactive Mini Studio:</strong> drag blocks, snap them, run, and watch the canvas update.</p>
          <button type='button' className='check-cta-btn' onClick={handleRunAndCheck} disabled={checking}>
            {checking ? 'Running + Checking...' : 'Run + Check Lesson'}
          </button>
        </div>
        <div className='studio-mission'>
          <p><strong>Build target:</strong> {getBuildTargetText(lesson)}</p>
          <ol className='lesson-steps'>
            {getInstructionSteps(lesson).map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <div className='studio-pane'>
          <div ref={mountRef} className='lesson-blockly-mount' />
        </div>
        <div className='studio-pane'>
          <div className='lesson-mini-canvas'>
            <DrawingCanvas
              commands={commands}
              runSequence={runSequence}
              stopSequence={stopSequence}
              onHighlight={() => {}}
              onGuessComplete={() => {}}
              onRunStateChange={setIsRunning}
              ghostPreview={lesson.ghostPreview}
              showClassification={false}
              showGuessPanel={false}
            />
          </div>
        </div>
      </div>
      <p className={`lesson-status-message ${isDone ? 'done' : ''}`}>{message}</p>
      <p className='lesson-long-text'>{lessonChallengeText(lesson)}</p>
      <hr className='lesson-divider' />

      <section className='lesson-takeaway'>
        <h3>After-Lesson Takeaways</h3>
        {!isDone && <div className='takeaway-lock'>[Locked]</div>}
        {isDone ? (
          <>
            <p>
              You completed this lesson, which means you successfully combined the right block types and connected
              them in a working structure.
            </p>
            <ul>
              <li>You practiced turning an idea into a block structure.</li>
              <li>You used targeted blocks to solve one focused mission.</li>
              <li>You now have a stronger base for the next lesson.</li>
            </ul>
          </>
        ) : (
          <p>This section unlocks after you complete the lesson.</p>
        )}
      </section>

      <div className='lesson-detail-nav'>
        <button type='button' className='lesson-nav-btn' onClick={onPrev} disabled={!canPrev}>
          Previous Lesson
        </button>
        <button type='button' className='lesson-nav-btn primary' onClick={onNext} disabled={!canNext}>
          Next Lesson
        </button>
      </div>
    </section>
  )
}

export default function LessonsPage({ onBack }) {
  const [completed, setCompleted] = useState(getCompletedFromStorage)
  const [openedLessonIds, setOpenedLessonIds] = useState(getOpenedFromStorage)
  const [selectedLessonId, setSelectedLessonId] = useState(null)
  const [catalogVisuals, setCatalogVisuals] = useState({})

  useEffect(() => {
    const cleaned = sanitizeLessonIds(completed)
    if (cleaned.length !== completed.length || cleaned.some((id, index) => id !== completed[index])) {
      setCompleted(cleaned)
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned))
  }, [completed])

  useEffect(() => {
    const cleaned = sanitizeLessonIds(openedLessonIds)
    if (cleaned.length !== openedLessonIds.length || cleaned.some((id, index) => id !== openedLessonIds[index])) {
      setOpenedLessonIds(cleaned)
      return
    }
    localStorage.setItem(OPENED_STORAGE_KEY, JSON.stringify(cleaned))
  }, [openedLessonIds])

  useEffect(() => {
    if (!selectedLessonId) return
    setOpenedLessonIds((prev) => (prev.includes(selectedLessonId) ? prev : [...prev, selectedLessonId]))
  }, [selectedLessonId])

  useEffect(() => {
    initBlocks()
    const host = document.createElement('div')
    host.style.position = 'fixed'
    host.style.left = '-10000px'
    host.style.top = '-10000px'
    host.style.width = '1px'
    host.style.height = '1px'
    host.style.opacity = '0'
    document.body.appendChild(host)

    const workspace = Blockly.inject(host, {
      renderer: 'zelos',
      theme: customTheme,
      toolbox: { kind: 'flyoutToolbox', contents: [] },
      move: { scrollbars: false, drag: false, wheel: false },
      zoom: { controls: false, wheel: false, startScale: 1, maxScale: 1, minScale: 1 }
    })

    const previews = {}
    LESSONS_ENRICHED.forEach((lesson) => {
      const type = lesson.focusBlocks.find((blockType) => Blockly.Blocks[blockType])
      if (!type) return
      try {
        const block = workspace.newBlock(type)
        block.initSvg()
        block.render()
        const markup = buildBlockSvgMarkup(block)
        if (markup) previews[lesson.id] = markup
        block.dispose(false)
      } catch (error) {
        // Keep catalog resilient if a preview block fails.
      }
    })
    setCatalogVisuals(previews)

    return () => {
      workspace.dispose()
      host.remove()
    }
  }, [])

  const completedCount = completed.length
  const completedSet = useMemo(() => new Set(completed), [completed])
  const openedSet = useMemo(() => new Set(openedLessonIds), [openedLessonIds])
  const progressPercent = Math.round((completedCount / LESSONS_ENRICHED.length) * 100)
  const selectedIndex = LESSONS_ENRICHED.findIndex((lesson) => lesson.id === selectedLessonId)
  const selectedLesson = selectedIndex >= 0 ? LESSONS_ENRICHED[selectedIndex] : null

  const groupedByLevel = useMemo(() => {
    const map = new Map()
    LESSONS_ENRICHED.forEach((lesson) => {
      if (!map.has(lesson.level)) map.set(lesson.level, [])
      map.get(lesson.level).push(lesson)
    })
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0])
  }, [])

  const handleComplete = (lessonId) => {
    setCompleted((prev) => (prev.includes(lessonId) ? prev : [...prev, lessonId]))
  }

  return (
    <div className='lessons-page'>
      <main className='lessons-shell'>
        <header className='lessons-hero'>
          <div className='hero-top-row'>
            <button type='button' className='home-back-btn' onClick={onBack}>Back to Home</button>
            {selectedLesson && (
              <button type='button' className='catalog-back-btn' onClick={() => setSelectedLessonId(null)}>
                Back to All 30 Lessons
              </button>
            )}
            <p className='hero-progress'>{completedCount}/30 complete</p>
          </div>
          <div className='hero-title-row'>
            <h1
              onClick={() => setSelectedLessonId(null)}
              style={{ cursor: 'pointer' }}
              title='Go to all lessons'
            >
              <span className='logo-b'>B</span>
              <span className='logo-c'>C</span>
              <span className='logo-d'>D</span> Lessons
            </h1>
          </div>
          <p className='hero-sub'>Block, Code, Draw learning path with 30 lessons.</p>
          <div className='lessons-progress-wrap'>
            <div className='lessons-progress-bar'><div style={{ width: `${progressPercent}%` }} /></div>
            <span>{progressPercent}% progress</span>
          </div>
        </header>

        {!selectedLesson && (
          <section className='lesson-catalog'>
            {groupedByLevel.map(([levelNumber, lessons]) => (
              <section key={levelNumber} className='catalog-level'>
                <h2>Level {levelNumber}: {LEVEL_TITLES[levelNumber]}</h2>
                <p className='catalog-level-sub'>
                  {lessons.filter((lesson) => completedSet.has(lesson.id)).length}/{lessons.length} lessons complete
                </p>
                <div className='catalog-grid'>
                  {lessons.map((lesson) => {
                    const done = completedSet.has(lesson.id)
                    const opened = openedSet.has(lesson.id)
                    return (
                      <button
                        key={lesson.id}
                        type='button'
                        className={`catalog-card ${done ? 'is-done' : ''} ${opened ? 'is-opened' : ''}`}
                        onClick={() => setSelectedLessonId(lesson.id)}
                      >
                        <div className='catalog-card-top'>
                          <span className='catalog-lesson-index'>Lesson {lesson.lessonNumber}</span>
                          <span className='catalog-status-pills'>
                            {done ? (
                              <span className='lesson-pill done'>✅ Done</span>
                            ) : (
                              <span className='lesson-pill todo'>▶️ Start</span>
                            )}
                            {opened && <span className='lesson-pill opened'>👀 Opened</span>}
                          </span>
                        </div>
                        <div className='catalog-card-visual-wrap'>
                          {catalogVisuals[lesson.id] ? (
                            <span className='catalog-card-block-preview' dangerouslySetInnerHTML={{ __html: catalogVisuals[lesson.id] }} />
                          ) : (
                            <span className='catalog-card-fallback'>{lessonFallbackVisual(lesson.level)}</span>
                          )}
                        </div>
                        <h3>{lesson.title}</h3>
                        <p>{lesson.goal}</p>
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}
          </section>
        )}

        {selectedLesson && (
          <LessonDetail
            lesson={selectedLesson}
            isDone={completedSet.has(selectedLesson.id)}
            onComplete={handleComplete}
            onBackToCatalog={() => setSelectedLessonId(null)}
            onPrev={() => {
              if (selectedIndex > 0) setSelectedLessonId(LESSONS_ENRICHED[selectedIndex - 1].id)
            }}
            onNext={() => {
              if (selectedIndex < LESSONS_ENRICHED.length - 1) {
                setSelectedLessonId(LESSONS_ENRICHED[selectedIndex + 1].id)
              }
            }}
            canPrev={selectedIndex > 0}
            canNext={selectedIndex < LESSONS_ENRICHED.length - 1}
          />
        )}
      </main>
    </div>
  )
}
