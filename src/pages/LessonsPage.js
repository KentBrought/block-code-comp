import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import * as Blockly from 'blockly'
import { javascriptGenerator } from 'blockly/javascript'
import { buildLessonFlyoutToolbox, customTheme, initBlocks } from '../components/BlocklyEditor'
import DrawingCanvas from '../components/DrawingCanvas'
import './LessonsPage.css'

const STORAGE_KEY = 'bcd_lesson_progress_v3'

const LEVEL_TITLES = {
  0: 'Welcome Studio',
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
  get_x: 'turtle x',
  get_y: 'turtle y',
  get_heading: 'turtle heading',
  wait_until: 'wait until',
  repeat_until: 'repeat until',
  set_color: 'set color',
  color_value: 'color',
  set_pen_size: 'set pen size',
  draw_circle: 'draw circle',
  draw_polygon: 'draw polygon',
  move_backward: 'move backward',
  jump_to: 'jump to',
  go_to_center: 'go to center',
  set_heading: 'set heading',
  set_random_color: 'set random color',
  draw_line: 'draw line',
  draw_rectangle: 'draw rectangle',
  array_create: 'make list',
  array_get: 'list item',
  array_add_item: 'add to list',
  object_create: 'make object',
  object_get: 'get object key',
  object_set: 'set object key',
  note_comment: 'note',
  canvas_zoom_in: 'zoom in',
  canvas_zoom_out: 'zoom out',
  canvas_reset_zoom: 'reset zoom',
  canvas_toggle_grid: 'toggle grid',
  on_event_message: 'on event',
  send_event_message: 'send event',
  op_math: 'math operator',
  op_boolean: 'true/false',
  op_string: 'text',
  procedures_defnoreturn: 'define function',
  procedures_callnoreturn: 'call function',
  variables_set: 'set variable',
  variables_get: 'get variable',
  math_change: 'change variable'
}

const BLOCK_TEACHING = {
  when_run_clicked: 'This is your start block. It tells the computer where to begin every single time you press Run. If this block is missing, your other blocks do not know when to wake up.',
  move_forward: 'This block moves the turtle in the direction it is facing. Bigger numbers make longer lines, so this is one of your main shape-building blocks.',
  turn_right: 'This block rotates the turtle to the right. Turn blocks plus move blocks are how corners and shapes are made.',
  turn_left: 'This block rotates the turtle to the left. It is the mirror version of turn right and helps control direction.',
  pen_down: 'This tells the turtle to draw while it moves. Use it when you want visible lines on the canvas.',
  pen_up: 'This tells the turtle to move without drawing. It is useful when you want to reposition before drawing again.',
  clear_screen: 'This wipes the canvas so you can test again cleanly. It helps you compare one run to the next run without old lines in the way.',
  repeat_times: 'This repeats the same instructions again and again. It makes your program shorter and helps avoid copying blocks many times.',
  forever_loop: 'This keeps running until you stop the program. It is often used for animation or continuous game behavior.',
  wait_seconds: 'This pauses so motion is easier to see. Small waits can make fast loops readable for humans.',
  if_condition: 'This checks a rule and runs code only when the rule is true. It is how your program starts making smart decisions.',
  op_compare: 'This creates a true/false rule like greater than or less than. It is usually plugged into if, wait until, or repeat until blocks.',
  op_logic: 'This combines two true/false rules with and/or. Use it when one condition is not enough to describe your idea.',
  op_not: 'This flips true to false and false to true. It is useful when you want the opposite behavior of a condition.',
  get_x: 'This reads where the turtle is on the x-axis (left and right). Think of x like side-to-side movement on a map.',
  get_y: 'This reads where the turtle is on the y-axis (up and down). Think of y like how high or low something is.',
  get_heading: 'This reads the direction the turtle is facing. It helps you build rules based on orientation.',
  wait_until: 'This waits until a rule becomes true. It is helpful for timing moments in a sequence.',
  repeat_until: 'This loops until a rule becomes true. Think of it as "keep trying until the condition is met."',
  set_color: 'This sets the pen color for future lines and shapes. Use it to separate parts of a drawing visually.',
  color_value: 'This picks the exact color value to use. Changing this value can completely change the mood of your art.',
  set_pen_size: 'This changes line thickness. Thick lines can emphasize, thin lines can add detail.',
  draw_circle: 'This draws a circle quickly using a radius. It is great for eyes, wheels, targets, and rounded designs.',
  draw_polygon: 'This draws many-sided shapes like triangles and pentagons. It turns side count and length into a full shape.',
  move_backward: 'This moves the turtle backward while keeping its current direction. It is useful for symmetry and retreat steps.',
  jump_to: 'This teleports the turtle to an exact x/y location (coordinates). Coordinates are like an address on the canvas.',
  go_to_center: 'This returns the turtle to the center of the canvas. It is a clean reset move between drawing parts.',
  set_heading: 'This points the turtle at an exact angle. Use it when you want deterministic direction before moving.',
  set_random_color: 'This picks a random pen color each time it runs. It is great for playful patterns and variation.',
  draw_line: 'This draws one straight segment in the current direction. It is useful for exact side construction.',
  draw_rectangle: 'This draws a rectangle using width and height values. It is a fast way to build box-like shapes.',
  array_create: 'This makes a named list for storing multiple values in order.',
  array_get: 'This reads one value from a list by index. It helps programs reuse stored sequences.',
  array_add_item: 'This appends a new value to the end of a list. It is useful for collecting steps, points, or history.',
  object_create: 'This makes a named object for key-value data. Use it for grouped properties like settings or state.',
  object_get: 'This reads a value from an object key. It is useful when your data is named, not just indexed.',
  object_set: 'This writes or updates a value on an object key. It lets your program edit structured state.',
  note_comment: 'This adds a plain-language note to your code. Comments help explain intent without changing behavior.',
  canvas_zoom_in: 'This zooms the canvas view in. It helps inspect details while debugging.',
  canvas_zoom_out: 'This zooms the canvas view out. It helps view bigger patterns and composition.',
  canvas_reset_zoom: 'This returns canvas zoom to normal size. It is a quick visual reset.',
  canvas_toggle_grid: 'This turns the grid on or off. Grids help with alignment and spacing checks.',
  on_event_message: 'This starts a script when a named event is received. It is a core block for multi-script coordination.',
  send_event_message: 'This broadcasts a named event to listeners. Use it to trigger other stacks at the right moment.',
  op_math: 'This combines numbers using +, -, x, or /. It is key for computed movement and dynamic values.',
  op_boolean: 'This outputs true or false directly. It is useful for testing condition wiring and logic flow.',
  op_string: 'This creates a text value. Text can label events, keys, and notes in your programs.',
  procedures_defnoreturn: 'This defines a custom function block. Functions package reusable instructions into one named action.',
  procedures_callnoreturn: 'This runs a custom function you defined. It keeps main scripts cleaner and easier to read.',
  variables_set: 'This stores a value in memory. It is the starting point for score, timer, and lives systems.',
  variables_get: 'This reads a value from memory. Use it inside rules and math so the program can react to current state.',
  math_change: 'This increases or decreases a stored value. It is a core block for tracking progress over time.'
}

const localLessonMedia = (src, caption, options = {}) => {
  const { alt, showReferenceLabel, imageSize } = options
  return {
    src: `${process.env.PUBLIC_URL || ''}${src}`,
    caption,
    alt: alt ?? caption,
    showReferenceLabel: !!showReferenceLabel,
    imageSize: imageSize || 'default'
  }
}

const LESSON_MEDIA = {
  l0: [localLessonMedia(
    '/lesson-media/photos/kid-coding.jpg',
    'A welcoming desk setup with a screen and space to try things. In this first lesson it stands for the same idea as your blocks: one clear place to press Run and see the turtle respond right away.',
    { imageSize: 'medium' }
  )],
  l2: [localLessonMedia(
    '/lesson-media/photos/flowchart.png',
    'A flowchart reads top to bottom with arrows between steps, just like your stack of blocks. Each box is one instruction in order; changing the order would change the path the flow follows.',
    { imageSize: 'large' }
  )],
  l3: [
    localLessonMedia(
      '/lesson-media/custom/pen-down.svg',
      'Pen down means the turtle leaves ink behind when it moves, like a marker pressed to paper. You use this when you want every forward step to show up as part of your drawing.',
      { imageSize: 'medium' }
    ),
    localLessonMedia(
      '/lesson-media/custom/pen-up.svg',
      'Pen up means the turtle can travel without drawing, like lifting a pencil to jump to a new corner. Pair it with pen down so you can separate shapes or move across the canvas cleanly.',
      { imageSize: 'medium' }
    )
  ],
  l4: [localLessonMedia(
    '/lesson-media/photos/whiteboard.jpg',
    'A wiped board is a fresh run with no old marks. That matches clear screen in code: you reset the canvas so the next Run shows only what the new program did, which makes testing and comparing runs much easier.',
    { imageSize: 'medium' }
  )],
  l5: [localLessonMedia(
    '/lesson-media/photos/repeating-pattern.jpg',
    'Tiles or stripes repeat the same unit over and over. A repeat loop does the same for code: write the pattern once and let the computer stamp it many times instead of duplicating blocks by hand.',
    { imageSize: 'medium' }
  )],
  l6: [localLessonMedia(
    '/lesson-media/custom/square-simple.svg',
    'A square is four equal sides with a turn at each corner. On the turtle, that is the same move-and-turn pattern repeated four times, which is why a loop fits this shape so naturally.'
  )],
  l7: [localLessonMedia(
    '/lesson-media/photos/bouncing-ball.gif',
    'The ball keeps moving in a cycle you can watch forever. That is the spirit of a forever loop in your program: the same body of blocks runs again and again until you stop it, which is how many animations stay alive.',
    { imageSize: 'large' }
  )],
  l8: [localLessonMedia(
    '/lesson-media/photos/mandala.jpg',
    'Radial art repeats a small motif around a center. Nested loops often build that kind of structure: an outer loop turns the turtle and an inner loop draws the motif each time, like rings of detail around a hub.',
    { imageSize: 'large' }
  )],
  l9: [localLessonMedia(
    '/lesson-media/photos/decision-tree.png',
    'Each branch is a different choice after a question. Your if block does something similar: when the condition is true the turtle follows one set of blocks, and when it is false it can skip them or follow an else path.',
    { imageSize: 'large' }
  )],
  l10: [localLessonMedia(
    '/lesson-media/custom/cartesian-grid.svg',
    'The grid labels left and right with x. In this lesson you read the turtle x position so the program can react to how far left or right it has moved, like checking a marker on a number line.',
    { imageSize: 'large' }
  )],
  l11: [
    localLessonMedia(
      '/lesson-media/custom/venn-and.svg',
      'Both circles must overlap for the middle region. In code, AND means every part of the condition has to be true at once before the combined rule passes.',
      { showReferenceLabel: true, imageSize: 'medium' }
    ),
    localLessonMedia(
      '/lesson-media/custom/venn-or.svg',
      'Either circle can cover the answer. OR means if any single test is true, the whole condition can still pass, which is useful when more than one situation should count as good enough.',
      { showReferenceLabel: true, imageSize: 'medium' }
    )
  ],
  l12: [
    localLessonMedia(
      '/lesson-media/photos/open-state.jpg',
      'Think of this as the "true" side of a simple rule, like a door you describe as open. NOT in your program flips whatever condition you have so the turtle reacts to the opposite case.',
      { showReferenceLabel: true, imageSize: 'medium' }
    ),
    localLessonMedia(
      '/lesson-media/photos/closed-state.jpg',
      'The same kind of object in the opposite state stands for "false" or the negated case. Comparing the two photos mirrors how NOT turns a yes into a no in your if and wait logic.',
      { showReferenceLabel: true, imageSize: 'medium' }
    )
  ],
  l13: [localLessonMedia(
    '/lesson-media/photos/repeating-pattern.jpg',
    'Repeated boxes suggest many slots with labels. A variable is a named slot the computer remembers: you store a value once and read it later by name, instead of rewriting the same number everywhere.',
    { imageSize: 'medium' }
  )],
  l14: [localLessonMedia(
    '/lesson-media/custom/counter-123.svg',
    'The count steps from 1 to 2 to 3. change variable works the same way: each time that part of the program runs, the stored value moves up or down so scores, timers, and levels can evolve.',
    { imageSize: 'medium' }
  )],
  l15: [localLessonMedia(
    '/lesson-media/photos/dashboard.jpg',
    'A dashboard shows live numbers you can read at a glance. When your program uses get variable inside an if or a compare block, it is reading the current stored value the way a driver reads the speed on a dial.',
    { imageSize: 'medium' }
  )],
  l16: [localLessonMedia(
    '/lesson-media/custom/progress-steps.svg',
    'Steps fill in one after another as work completes. Loops that run many times often update a variable each pass so the turtle (or your logic) can tell how far along the sequence has gotten.',
    { imageSize: 'large' }
  )],
  l17: [localLessonMedia(
    '/lesson-media/custom/cartesian-grid.svg',
    'Vertical position is y on the grid. Checking turtle y is how your program knows how high or low the artist is, which is the same information games use for jumping, falling, and floor tests.',
    { imageSize: 'large' }
  )],
  l18: [localLessonMedia(
    '/lesson-media/photos/traffic-light.jpg',
    'Traffic waits for the light to match the rule "green means go." wait until pauses your stack until a condition becomes true, so later blocks only run when the world (or the turtle) is ready.',
    { imageSize: 'medium' }
  )],
  l19: [localLessonMedia(
    '/lesson-media/photos/finish-line.jpg',
    'A race ends when you cross the line. repeat until keeps running the loop body until its condition finally becomes true, then it stops—like repeating steps until you reach a clear finish.',
    { imageSize: 'medium' }
  )],
  l20: [localLessonMedia(
    '/lesson-media/photos/compass.jpg',
    'The needle shows which way is forward. turtle heading is the angle your artist faces; reading it lets the program branch or adjust when the turtle points a certain direction.',
    { imageSize: 'medium' }
  )],
  l21: [localLessonMedia(
    '/lesson-media/photos/setup-workspace.jpg',
    'Tools laid out before the main build are like the first blocks in a script: color, pen size, or starting position. Separating setup from the main loop keeps long programs easier to read and change.',
    { imageSize: 'medium' }
  )],
  l22: [localLessonMedia(
    '/lesson-media/custom/circle-simple.svg',
    'A circle from one radius is a single call in many graphics systems. draw circle in your lesson packages that idea: one block with a size parameter instead of many tiny segments.',
    { imageSize: 'medium' }
  )],
  l23: [localLessonMedia(
    '/lesson-media/custom/polygon-annotated.svg',
    'Sides and corners are labeled so you can see what "number of sides" and "length" mean. draw polygon turns those two numbers into a whole shape, the same way functions wrap detail behind simple inputs.',
    { imageSize: 'large' }
  )],
  l24: [localLessonMedia(
    '/lesson-media/photos/flowchart.png',
    'Real programs mix setup, loops, and decisions in one flow. This chart is a paper version of that structure: each section connects to the next, similar to how your capstone stack chains many kinds of blocks.',
    { imageSize: 'large' }
  )],
  l25: [localLessonMedia(
    '/lesson-media/photos/puzzle-connection.jpg',
    'Debugging is finding the missing or twisted link. When output looks wrong, you reconnect logic step by step—check conditions, loops, and variable values until the picture matches what you intended.',
    { imageSize: 'medium' }
  )],
  l26: [
    localLessonMedia(
      '/lesson-media/photos/tool-workbench.jpg',
      'One arrangement of tools fits a specific task. Picking the right block is the same habit: the move that matches your goal is clearer and shorter than forcing the wrong block to act like a workaround.',
      { showReferenceLabel: true, imageSize: 'medium' }
    ),
    localLessonMedia(
      '/lesson-media/photos/tool-workspace.jpg',
      'A different bench suggests a different job. Comparing setups is like comparing two code paths: small changes in which block you choose can completely change what the turtle draws.',
      { showReferenceLabel: true, imageSize: 'medium' }
    )
  ],
  l27: [localLessonMedia(
    '/lesson-media/custom/bug-checklist.svg',
    'A short checklist next to a bug icon is how professionals shrink big problems. Run often, change one thing, and re-check—your mini studio uses the same tight loop to get to green checks faster.',
    { imageSize: 'large' }
  )],
  l28: [localLessonMedia(
    '/lesson-media/photos/creative-remix.jpg',
    'Mixing colors and materials is creative play. Remix lessons reward combining blocks you already know in new orders, which is how most real projects grow from small experiments into finished ideas.',
    { imageSize: 'large' }
  )],
  l29: [localLessonMedia(
    '/lesson-media/photos/mini-tool.jpg',
    'Small modules snap together into a bigger helper. Designing with separate little behaviors mirrors how you will later split logic into clear chunks that each do one job well.',
    { imageSize: 'medium' }
  )],
  l30: [
    localLessonMedia(
      '/lesson-media/photos/archimedean-spiral.png',
      'Each ring repeats a similar step at a larger scale. Recursion in code calls the same idea with a simpler subproblem until a base case stops the chain, which produces spirals and growth patterns like this.',
      { imageSize: 'hero' }
    ),
    localLessonMedia(
      '/lesson-media/photos/fractal-tree.png',
      'Each branch splits into smaller branches with the same shape. That self-similarity is the hallmark of recursive drawing: one rule applied again and again at different sizes until the detail is complete.',
      { imageSize: 'hero' }
    )
  ],
  l31: [localLessonMedia(
    '/lesson-media/photos/kid-coding.jpg',
    'A finished-looking project on screen is what you are building toward in the capstone: many features working together. The photo stands for integrating movement, color, logic, and maybe variables in one coherent piece.',
    { imageSize: 'large' }
  )],
  l32: [localLessonMedia(
    '/lesson-media/custom/arrows-forward-backward.svg',
    'Forward and backward arrows share one line but opposite travel. move backward lets the turtle retrace distance without spinning around, which helps symmetry, undo-style paths, and tight corridors.',
    { imageSize: 'large' }
  )],
  l33: [localLessonMedia(
    '/lesson-media/custom/cartesian-grid.svg',
    'A point sits at an exact (x, y) address on the plane. jump to uses those coordinates to teleport the turtle, which is how maps, games, and graphs place characters exactly where they need to be.',
    { imageSize: 'large' }
  )],
  l34: [localLessonMedia(
    '/lesson-media/photos/bullseye.jpg',
    'The center ring is a fixed anchor everyone agrees on. go to center sends the turtle back to the middle of the canvas so multi-step drawings stay aligned after detours.',
    { imageSize: 'medium' }
  )],
  l35: [localLessonMedia(
    '/lesson-media/photos/protractor.jpg',
    'Degrees measure rotation around a point. set heading sets the turtle angle in that same language so squares, stars, and polygons start from a direction you control precisely.',
    { imageSize: 'large' }
  )],
  l36: [localLessonMedia(
    '/lesson-media/photos/creative-remix.jpg',
    'Paint and pigment splashes suggest variety. set random color gives your program that kind of surprise on each run while the rest of your logic stays the same.',
    { imageSize: 'medium' }
  )],
  l37: [localLessonMedia(
    '/lesson-media/photos/line-drawing.jpg',
    'A single stroke has a clear start and length. draw line is the block version: one straight segment in the current heading without chaining many move blocks when you only need one span.',
    { imageSize: 'medium' }
  )],
  l38: [localLessonMedia(
    '/lesson-media/custom/rectangle-simple.svg',
    'Width and height define a box in one go. draw rectangle packages two dimensions into one action, similar to how engines draw UI panels and rooms from simple measurements.',
    { imageSize: 'medium' }
  )],
  l39: [localLessonMedia(
    '/lesson-media/photos/math-workspace.jpg',
    'Scratch paper with numbers and symbols is how people combine values by hand. math operator blocks do that inside the program so movement, waits, and comparisons can use computed results instead of fixed literals.',
    { imageSize: 'large' }
  )],
  l40: [localLessonMedia(
    '/lesson-media/custom/boolean-switch.svg',
    'A switch is either on or off with no middle ground. true/false blocks plug into conditions so you can test flags, compare results, and wire logic that only allows two clear states.',
    { imageSize: 'large' }
  )],
  l41: [localLessonMedia(
    '/lesson-media/photos/text-labels.jpg',
    'Written words carry meaning for humans. text values in your program label events, keys, and messages so the same logic can work with different words without rewriting the whole stack.',
    { imageSize: 'medium' }
  )],
  l42: [localLessonMedia(
    '/lesson-media/photos/ordered-checklist.jpg',
    'Order matters: item two follows item one. Lists store values in sequence so your code can walk them in order, pick by index, or grow the series as the program runs.',
    { imageSize: 'medium' }
  )],
  l43: [localLessonMedia(
    '/lesson-media/custom/profile-card.svg',
    'Named fields like name and score sit on one card. Objects group labeled data so you can read and update one property at a time, which mirrors forms, player stats, and settings in real apps.',
    { imageSize: 'large' }
  )],
  l44: [localLessonMedia(
    '/lesson-media/photos/sticky-notes.jpg',
    'Sticky notes remind you why you made a decision. Comments in code work the same way: they do not change what the turtle does, but they help you and anyone reading your code understand what that part is for.',
    { imageSize: 'medium' }
  )],
  l45: [
    localLessonMedia(
      '/lesson-media/photos/message-send.jpg',
      'Someone signals readiness or sends a cue outward. send event is that broadcast in code: one stack announces a name and others can react when they are listening for it.',
      { showReferenceLabel: true, imageSize: 'medium' }
    ),
    localLessonMedia(
      '/lesson-media/photos/message-listen.jpg',
      'Someone else watches for the cue and responds. on event is your listener stack: it starts when the matching event name arrives, which is how separate scripts coordinate without tangling into one giant chain.',
      { showReferenceLabel: true, imageSize: 'medium' }
    )
  ],
  l46: [localLessonMedia(
    '/lesson-media/custom/zoom-controls.svg',
    'Magnify controls change what your eye sees without changing the underlying drawing. Canvas zoom blocks adjust the view so you can inspect tight corners or see the whole composition during debugging.',
    { imageSize: 'large' }
  )],
  l47: [
    localLessonMedia(
      '/lesson-media/custom/grid-visible.svg',
      'Lines line up spacing and angles. toggle grid helps you judge whether the turtle moved the intended distance or landed on the cell you expected.',
      { showReferenceLabel: true, imageSize: 'large' }
    ),
    localLessonMedia(
      '/lesson-media/custom/grid-hidden.svg',
      'The same picture without lines looks cleaner for sharing. Switching the grid off is how you preview what a player or friend would see without the construction helpers.',
      { showReferenceLabel: true, imageSize: 'large' }
    )
  ],
  l48: [localLessonMedia(
    '/lesson-media/custom/define-function.svg',
    'One definition block names a whole recipe. define function captures repeated steps so your main script stays short and the named action can be updated in a single place.',
    { imageSize: 'large' }
  )],
  l49: [localLessonMedia(
    '/lesson-media/custom/call-function.svg',
    'The main script calls a packaged action and returns to the next line. call function is how you reuse that recipe anywhere, which is the same pattern libraries and game engines expose to designers.',
    { imageSize: 'large' }
  )]
}

const LESSON_REAL_WORLD_CONTEXT = {
  l0: { relevance: 'This is how every program starts: one trigger plus one action.', utility: 'Teaches execution flow from top to bottom.', imageIdea: 'Placeholder image idea: a start button that triggers one simple action.' },
  l1: { relevance: 'Apps and games need clear entry points.', utility: 'Shows why start events are required to run logic.', imageIdea: 'Placeholder image idea: play button launching a mini game.' },
  l2: { relevance: 'Instruction order controls behavior everywhere in software.', utility: 'Builds sequencing skills used in UI flows and scripts.', imageIdea: 'Placeholder image idea: step-by-step arrows showing ordered actions.' },
  l3: { relevance: 'Programs often switch modes (active/inactive).', utility: 'Introduces state toggles like on/off drawing behavior.', imageIdea: 'Placeholder image idea: pen touching paper vs pen lifted.' },
  l4: { relevance: 'Developers reset state to retest cleanly.', utility: 'Teaches repeatable testing and clean-run debugging.', imageIdea: 'Placeholder image idea: whiteboard being erased.' },
  l5: { relevance: 'Loops are core to automation and scalable code.', utility: 'Replaces copy/paste logic with compact repetition.', imageIdea: 'Placeholder image idea: repeating tile pattern.' },
  l6: { relevance: 'Geometry logic powers graphics and game maps.', utility: 'Applies loops/turns to construct predictable shapes.', imageIdea: 'Placeholder image idea: square path traced by arrows.' },
  l7: { relevance: 'Animations and simulations run continuously.', utility: 'Introduces forever loops plus pacing control.', imageIdea: 'Placeholder image idea: looping animation frames.' },
  l8: { relevance: 'Nested loops are used in grids, textures, and procedural art.', utility: 'Builds multi-layer repetition patterns.', imageIdea: 'Placeholder image idea: checkerboard or mandala pattern.' },
  l9: { relevance: 'Conditionals are foundational for decisions in apps and games.', utility: 'Executes code only when a rule is true.', imageIdea: 'Placeholder image idea: if/then decision sign.' },
  l10: { relevance: 'Position-aware logic drives movement systems and boundaries.', utility: 'Uses x-coordinate as program input.', imageIdea: 'Placeholder image idea: x-axis map with marker position.' },
  l11: { relevance: 'Complex systems combine multiple conditions.', utility: 'Uses AND/OR for precise behavior rules.', imageIdea: 'Placeholder image idea: two-condition logic diagram.' },
  l12: { relevance: 'Negation is essential for opposite cases and guard clauses.', utility: 'Flips logic outcomes cleanly with NOT.', imageIdea: 'Placeholder image idea: normal rule vs opposite rule.' },
  l13: { relevance: 'Variables power scores, settings, and state memory.', utility: 'Stores values for later reuse.', imageIdea: 'Placeholder image idea: labeled storage box called score.' },
  l14: { relevance: 'Programs update values over time constantly.', utility: 'Changes variable values with increments/decrements.', imageIdea: 'Placeholder image idea: counter increasing.' },
  l15: { relevance: 'Dynamic behavior requires reading current state.', utility: 'Uses stored values inside logic rules.', imageIdea: 'Placeholder image idea: dashboard value driving a decision light.' },
  l16: { relevance: 'Loops plus state updates drive timers and progress bars.', utility: 'Tracks evolving values during repeated execution.', imageIdea: 'Placeholder image idea: progress bar updating in steps.' },
  l17: { relevance: 'Y-position checks are common in movement and collision logic.', utility: 'Uses vertical position as a sensor input.', imageIdea: 'Placeholder image idea: object moving up/down on a chart.' },
  l18: { relevance: 'Programs often wait for conditions before continuing.', utility: 'Synchronizes timing and event order.', imageIdea: 'Placeholder image idea: traffic light turning green before moving.' },
  l19: { relevance: 'Safe loops need clear stop conditions.', utility: 'Repeats until a condition passes, then exits.', imageIdea: 'Placeholder image idea: loop path ending at a finish flag.' },
  l20: { relevance: 'Direction-based logic appears in robotics and navigation.', utility: 'Reads heading to trigger directional behavior.', imageIdea: 'Placeholder image idea: compass heading control.' },
  l21: { relevance: 'Setup phases are common in all software systems.', utility: 'Separates initialization from runtime behavior.', imageIdea: 'Placeholder image idea: app settings panel before run.' },
  l22: { relevance: 'Primitive shape APIs are used in drawing and game engines.', utility: 'Draws circles quickly with parameters.', imageIdea: 'Placeholder image idea: circles of different radii.' },
  l23: { relevance: 'Parameterized geometry is reusable and scalable.', utility: 'Creates polygons via side/length controls.', imageIdea: 'Placeholder image idea: triangle, square, pentagon lineup.' },
  l24: { relevance: 'Real programs combine setup, loops, and rules together.', utility: 'Practices system composition across block types.', imageIdea: 'Placeholder image idea: flowchart with setup-loop-condition sections.' },
  l25: { relevance: 'Debugging structure is a daily developer skill.', utility: 'Finds broken links and repairs flow.', imageIdea: 'Placeholder image idea: broken chain reconnected.' },
  l26: { relevance: 'Correct block choice maps to correct algorithm choice.', utility: 'Improves behavior by selecting proper operations.', imageIdea: 'Placeholder image idea: wrong tool vs right tool.' },
  l27: { relevance: 'Fast feedback cycles reduce debugging time.', utility: 'Uses quick reruns and small adjustments.', imageIdea: 'Placeholder image idea: bug icon with checklist.' },
  l28: { relevance: 'Creative prototyping depends on remixing known patterns.', utility: 'Combines many blocks to explore new outputs.', imageIdea: 'Placeholder image idea: collage/remix board.' },
  l29: { relevance: 'Mini systems thinking leads to stronger projects.', utility: 'Designs behavior with coordinated parts.', imageIdea: 'Placeholder image idea: modular system blocks connected.' },
  l30: { relevance: 'Recursion appears in trees, fractals, and divide-and-conquer.', utility: 'Repeats a smaller step with a stop case.', imageIdea: 'Placeholder image idea: spiral or fractal branching pattern.' },
  l31: { relevance: 'Capstones mirror real project integration work.', utility: 'Combines state, logic, loops, and visuals in one build.', imageIdea: 'Placeholder image idea: completed mini project board.' },
  l32: { relevance: 'Reverse motion is useful in path correction and symmetry.', utility: 'Moves backward without changing heading.', imageIdea: 'Placeholder image idea: forward and backward arrows.' },
  l33: { relevance: 'Coordinate targeting is used in maps, games, and plotting.', utility: 'Jumps to exact x/y positions.', imageIdea: 'Placeholder image idea: map pin on grid coordinates.' },
  l34: { relevance: 'Reset anchors keep multi-step systems stable.', utility: 'Returns to a known center point.', imageIdea: 'Placeholder image idea: target bullseye center.' },
  l35: { relevance: 'Deterministic angles improve reproducible behavior.', utility: 'Sets exact heading before motion.', imageIdea: 'Placeholder image idea: protractor and directional arrow.' },
  l36: { relevance: 'Randomization adds variation in games and generative art.', utility: 'Chooses random colors automatically.', imageIdea: 'Placeholder image idea: random color palette swatches.' },
  l37: { relevance: 'Line primitives are core building blocks in vector graphics.', utility: 'Draws precise straight segments fast.', imageIdea: 'Placeholder image idea: vector line tool reference.' },
  l38: { relevance: 'Rectangle primitives are used in UI layout and sprites.', utility: 'Creates width/height-controlled boxes.', imageIdea: 'Placeholder image idea: wireframe rectangles.' },
  l39: { relevance: 'Math operators drive dynamic movement and scaling.', utility: 'Computes values instead of hardcoding constants.', imageIdea: 'Placeholder image idea: calculator feeding motion values.' },
  l40: { relevance: 'Boolean logic underpins control flow everywhere.', utility: 'Uses explicit true/false values for testing logic wiring.', imageIdea: 'Placeholder image idea: toggle switch true/false.' },
  l41: { relevance: 'Text values label keys, messages, and metadata.', utility: 'Creates reusable string inputs.', imageIdea: 'Placeholder image idea: labels/tags with text fields.' },
  l42: { relevance: 'Lists are essential for ordered collections.', utility: 'Creates, appends, and reads indexed values.', imageIdea: 'Placeholder image idea: checklist with numbered items.' },
  l43: { relevance: 'Objects model real entities with named properties.', utility: 'Sets and gets key-value data.', imageIdea: 'Placeholder image idea: profile card with named fields.' },
  l44: { relevance: 'Documentation improves maintainability and teamwork.', utility: 'Uses comments to explain intent.', imageIdea: 'Placeholder image idea: sticky notes on code printout.' },
  l45: { relevance: 'Event systems coordinate independent components.', utility: 'Broadcasts and listens to named messages.', imageIdea: 'Placeholder image idea: megaphone sending signals to listeners.' },
  l46: { relevance: 'View controls support inspection and presentation.', utility: 'Zooms in/out and resets camera scale.', imageIdea: 'Placeholder image idea: magnifier zoom controls.' },
  l47: { relevance: 'Grids help precision in design and debugging.', utility: 'Toggles alignment guides on demand.', imageIdea: 'Placeholder image idea: graph paper overlay.' },
  l48: { relevance: 'Functions reduce duplication and improve clarity.', utility: 'Defines reusable named behavior blocks.', imageIdea: 'Placeholder image idea: reusable component/module icon.' },
  l49: { relevance: 'Function calls are how reusable logic executes.', utility: 'Runs defined functions from main flow.', imageIdea: 'Placeholder image idea: call stack arrow into function box.' }
}

const LESSON_WORD_HELP = {
  l9: ['Condition: a rule your code checks (like "if this is true, then do this").'],
  l10: ['Axis: an invisible line used to measure position.', 'x-axis: left ↔ right.', 'Coordinate: a location address using numbers.'],
  l11: ['Logic: rule-thinking in code.', 'AND means both rules must be true. OR means at least one rule is true.'],
  l12: ['NOT means opposite. If something is true, NOT makes it false.'],
  l13: ['Variable: a labeled memory box that stores a value.'],
  l15: ['State: what your program currently remembers right now.'],
  l17: ['y-axis: up ↕ down.', 'Sensor (in coding): information your program can read.'],
  l18: ['Synchronize: make steps happen at the right time, in order.'],
  l19: ['Stop condition: the rule that tells a loop when to end.'],
  l20: ['Heading: the direction your turtle is facing, measured by an angle.'],
  l30: ['Recursion: when a function uses a smaller version of itself, with a stop rule.'],
  l33: ['Coordinates: two numbers (x, y) that point to one exact spot.'],
  l35: ['Deterministic: predictable; same input gives same result.'],
  l39: ['Operator: a math symbol like +, -, x, or /.'],
  l40: ['Boolean: a value that is only true or false.'],
  l42: ['Index: the position number of an item in a list.'],
  l43: ['Key-value: named data, like "name: turtle" or "score: 10".'],
  l45: ['Event: a signal that tells code to start doing something.'],
  l48: ['Function: a reusable named set of steps.'],
  l49: ['Main flow: the primary top-to-bottom script that runs first.']
}

const LESSONS = [
  {
    id: 'l0',
    level: 0,
    title: 'Welcome - What Blocks and Coding Are',
    goal: 'Run your first tiny block program and see your turtle draw a line.',
    intention: 'Your turtle only follows what each block says, in order from top to bottom—clear steps make clear ink.',
    task: 'Snap move forward under when Run clicked, press Run, then Check Lesson.',
    steps: [
      'Drag move forward under when Run clicked.',
      'Press Run + Check Lesson to test your first block program.'
    ],
    toolbox: ['when_run_clicked', 'move_forward', 'turn_right', 'pen_down', 'clear_screen', 'op_number'],
    focusBlocks: ['when_run_clicked', 'move_forward'],
    rules: { requiredTypes: ['when_run_clicked', 'move_forward'], requireStartLinked: true }
  },
  { id: 'l1', level: 1, title: 'Run Your First Program', goal: 'Make the turtle do one action when you press Run.', intention: 'The turtle waits for a start block so your first move actually runs.', task: 'Connect move forward under when Run clicked.', steps: ['Drag the green start block.', 'Snap one move block below it.', 'Press Check Lesson.'], toolbox: ['when_run_clicked', 'move_forward'], focusBlocks: ['when_run_clicked', 'move_forward'], rules: { requiredTypes: ['when_run_clicked', 'move_forward'], requireStartLinked: true } },
  { id: 'l2', level: 1, title: 'Two Steps in Order', goal: 'Make your turtle do two actions in order.', intention: 'The turtle runs moves and turns in stack order, which changes the trail on the canvas.', task: 'Use start, move, then turn.', steps: ['Start is already there — make sure move forward is connected below it.', 'Add turn right after move forward in the stack.', 'Run and watch the turtle go forward and then turn.'], toolbox: ['when_run_clicked', 'move_forward', 'turn_right', 'turn_left'], focusBlocks: ['move_forward', 'turn_right'], rules: { requiredTypes: ['when_run_clicked', 'move_forward', 'turn_right'], requireStartLinked: true } },
  { id: 'l3', level: 1, title: 'Pen Up, Pen Down', goal: 'Control when the turtle draws lines.', intention: 'Pen down leaves ink as the turtle moves. Pen up lifts the pen so the turtle can travel without drawing. Switching between them is how you make shapes with gaps.', task: 'Draw a line, lift the pen, move silently, then draw again to make a split line.', steps: ['Add pen down, then move forward to draw the first line.', 'Add pen up, then move forward to skip across without drawing.', 'Add pen down again and move forward to draw the second line.'], toolbox: ['when_run_clicked', 'pen_down', 'pen_up', 'move_forward'], focusBlocks: ['pen_down', 'pen_up', 'move_forward'], rules: { requiredTypes: ['when_run_clicked', 'pen_down', 'move_forward'], requireStartLinked: true } },
  { id: 'l4', level: 1, title: 'Clear and Draw Again', goal: 'Reset the canvas before drawing.', intention: 'Clearing wipes old ink so each run shows only what your turtle just did.', task: 'Use clear screen, then draw.', steps: ['Put clear screen under start.', 'Add pen down.', 'Add move forward.'], toolbox: ['when_run_clicked', 'clear_screen', 'pen_down', 'move_forward'], focusBlocks: ['clear_screen', 'pen_down'], rules: { requiredTypes: ['when_run_clicked', 'clear_screen', 'move_forward'], requireStartLinked: true } },
  { id: 'l5', level: 2, title: 'Your First Loop', goal: 'Use repeat instead of copying blocks.', intention: 'Instead of dragging the same block five times, a repeat loop does it for you. Change one number and the turtle runs that same step as many times as you want.', task: 'Use repeat with move inside.', steps: ['Drag a repeat block and connect it under start.', 'Put a move forward block inside the repeat.', 'Set the repeat count to 4 and press Run.'], toolbox: ['when_run_clicked', 'repeat_times', 'move_forward', 'op_number'], focusBlocks: ['repeat_times', 'move_forward'], rules: { requiredTypes: ['when_run_clicked', 'repeat_times', 'move_forward'], requireStartLinked: true } },
  { id: 'l6', level: 2, title: 'Square Loop', goal: 'Draw a square using one loop.', intention: 'A square on the canvas is the same corner move-and-turn pattern, looped four times.', task: 'Use repeat + move + turn right.', steps: ['Set repeat to 4.', 'Put move and turn inside.', 'Check your work.'], toolbox: ['when_run_clicked', 'repeat_times', 'move_forward', 'turn_right', 'op_number'], focusBlocks: ['repeat_times', 'turn_right'], rules: { requiredTypes: ['when_run_clicked', 'repeat_times', 'move_forward', 'turn_right'], requireStartLinked: true } },
  { id: 'l7', level: 2, title: 'Forever Animation', goal: 'Build a script that keeps moving.', intention: 'A forever loop keeps the turtle stepping so the picture keeps changing like a tiny animation.', task: 'Use forever with move or turn.', steps: ['Drag forever.', 'Place one motion block inside.', 'Add wait so movement is visible.'], toolbox: ['when_run_clicked', 'forever_loop', 'move_forward', 'turn_right', 'wait_seconds', 'op_number'], focusBlocks: ['forever_loop', 'wait_seconds'], rules: { requiredTypes: ['when_run_clicked', 'forever_loop'], requireStartLinked: true } },
  { id: 'l8', level: 2, title: 'Nested Pattern', goal: 'Use one repeat inside another repeat.', intention: 'A nested loop is a loop inside a loop. The inner loop finishes all of its steps, then the outer loop runs again. This is how you build radiating patterns — one small shape repeated in a circle.', task: 'Create nested loops with motion blocks.', steps: ['Connect a repeat block under start.', 'Drag another repeat block inside the first one.', 'Put move forward and turn right inside the inner repeat.'], toolbox: ['when_run_clicked', 'repeat_times', 'move_forward', 'turn_right', 'op_number'], focusBlocks: ['repeat_times', 'turn_right'], rules: { requiredTypes: ['when_run_clicked', 'repeat_times', 'move_forward', 'turn_right'], requireStartLinked: true } },
  { id: 'l9', level: 3, title: 'First If Rule', goal: 'Make code run only when a rule is true.', intention: 'An if block decides whether the turtle takes a stroke or skips it.', task: 'Use if + compare.', steps: ['Drag an if block and connect it under start.', 'Drag a compare block into the diamond-shaped slot on the if block.', 'Put a move forward block inside the if block where it says "do".'], toolbox: ['when_run_clicked', 'if_condition', 'op_compare', 'op_number', 'move_forward'], focusBlocks: ['if_condition', 'op_compare'], rules: { requiredTypes: ['when_run_clicked', 'if_condition', 'op_compare'], requireStartLinked: true } },
  { id: 'l10', level: 3, title: 'Use Turtle X', goal: 'Use turtle position in a rule.', intention: 'Reading x lets the turtle change its path depending on where it sits on the grid.', task: 'Use turtle x in compare block.', steps: ['Drag turtle x.', 'Connect to compare.', 'Use compare inside if.'], toolbox: ['when_run_clicked', 'if_condition', 'op_compare', 'get_x', 'op_number', 'move_forward'], focusBlocks: ['get_x', 'op_compare', 'if_condition'], rules: { requiredTypes: ['when_run_clicked', 'if_condition', 'op_compare', 'get_x'], requireStartLinked: true } },
  { id: 'l11', level: 3, title: 'Logic And / Or', goal: 'Combine two rules in one condition.', intention: 'AND/OR combines simple turtle checks into richer “should I draw?� decisions.', task: 'Use logic block inside if.', steps: ['Drag and/or block.', 'Fill both sides with compare checks.', 'Place in if condition.'], toolbox: ['when_run_clicked', 'if_condition', 'op_logic', 'op_compare', 'get_x', 'get_y', 'op_number', 'move_forward'], focusBlocks: ['op_logic', 'op_compare'], rules: { requiredTypes: ['when_run_clicked', 'if_condition', 'op_logic'], requireStartLinked: true } },
  { id: 'l12', level: 3, title: 'Logic Not', goal: 'Invert a condition using not.', intention: 'NOT flips a turtle rule so the opposite case gets the ink.', task: 'Use not in if condition.', steps: ['Drag not block.', 'Put compare inside not.', 'Use it in if.'], toolbox: ['when_run_clicked', 'if_condition', 'op_not', 'op_compare', 'op_number', 'get_y', 'move_forward'], focusBlocks: ['op_not', 'op_compare'], rules: { requiredTypes: ['when_run_clicked', 'if_condition', 'op_not'], requireStartLinked: true } },
  { id: 'l13', level: 4, title: 'Create a Score Variable', goal: 'Make your first memory box.', intention: 'A variable is scratch memory your turtle script can read on the next step.', task: 'Use set variable.', steps: ['Click on the Variables section in the block panel on the left.', 'Drag a set variable block and connect it under start.', 'Set the value to a number, like 0.'], toolbox: ['when_run_clicked', '__VARIABLES__', 'op_number'], focusBlocks: ['variables_set'], rules: { requiredTypes: ['when_run_clicked', 'variables_set'], requireStartLinked: true } },
  { id: 'l14', level: 4, title: 'Change a Variable', goal: 'Increase or decrease stored value.', intention: 'Changing a stored number lets the turtle react differently as the run progresses.', task: 'Use change variable block.', steps: ['Set a variable first.', 'Add change block.', 'Use number value.'], toolbox: ['when_run_clicked', '__VARIABLES__', 'op_number'], focusBlocks: ['variables_set', 'math_change'], rules: { requiredTypes: ['when_run_clicked', 'variables_set', 'math_change'], requireStartLinked: true } },
  { id: 'l15', level: 4, title: 'Read a Variable', goal: 'Use memory value in a rule.', intention: 'Reading that stored value lets the turtle pick moves based on its own history.', task: 'Use get variable inside compare.', steps: ['Set a variable.', 'Use get variable.', 'Place in compare and if.'], toolbox: ['when_run_clicked', '__VARIABLES__', 'if_condition', 'op_compare', 'op_number', 'move_forward'], focusBlocks: ['variables_get', 'op_compare'], rules: { requiredTypes: ['when_run_clicked', 'variables_set', 'variables_get', 'if_condition'], requireStartLinked: true } },
  { id: 'l16', level: 4, title: 'Loop + Score', goal: 'Update memory while repeating actions.', intention: 'Every time a loop runs, you can also update a variable. This is like counting laps — each time around, the counter goes up by one. By the end, your variable holds a record of how many times the loop ran.', task: 'Use repeat and change variable together.', steps: ['Set a variable to 0 under start.', 'Add a repeat block after it.', 'Put change variable by 1 inside the repeat.'], toolbox: ['when_run_clicked', '__VARIABLES__', 'repeat_times', 'op_number', 'move_forward'], focusBlocks: ['repeat_times', 'math_change'], rules: { requiredTypes: ['when_run_clicked', 'repeat_times', 'math_change'], requireStartLinked: true } },
  { id: 'l17', level: 5, title: 'Use Turtle Y', goal: 'Sense vertical position.', intention: 'Turtle y tells your program how high or low the turtle is on the canvas. You can use it in a rule to change what the turtle does depending on whether it is near the top or the bottom.', task: 'Use turtle y in compare rule.', steps: ['Drag the turtle y block into a compare block.', 'Set the compare to check if y is greater than 0.', 'Put the compare inside an if block so the turtle reacts when it is above center.'], toolbox: ['when_run_clicked', 'if_condition', 'op_compare', 'get_y', 'op_number', 'turn_right'], focusBlocks: ['get_y', 'op_compare'], rules: { requiredTypes: ['when_run_clicked', 'if_condition', 'get_y', 'op_compare'], requireStartLinked: true } },
  { id: 'l18', level: 5, title: 'Wait Until True', goal: 'Pause until a rule passes.', intention: 'Wait until pauses the turtle right where it is and does nothing until a condition becomes true — like waiting at a red light. Once the condition passes, the next blocks run.', task: 'Use wait until with compare.', steps: ['Add move forward under start to make the turtle move.', 'Add wait until after it, with a compare block checking turtle x.', 'Add one more move forward after the wait to see it resume.'], toolbox: ['when_run_clicked', 'wait_until', 'op_compare', 'get_x', 'op_number', 'move_forward'], focusBlocks: ['wait_until', 'op_compare'], rules: { requiredTypes: ['when_run_clicked', 'wait_until', 'op_compare'], requireStartLinked: true } },
  { id: 'l19', level: 5, title: 'Repeat Until', goal: 'Repeat until a condition is true.', intention: 'Repeat-until keeps the turtle stepping until a sensor says the goal is reached.', task: 'Use repeat until with compare.', steps: ['Drag a repeat until block and connect it under start.', 'Add a compare block into the condition slot of the repeat until.', 'Put a move forward block inside the repeat until where it says "do".'], toolbox: ['when_run_clicked', 'repeat_until', 'op_compare', 'get_x', 'op_number', 'move_forward', 'turn_right'], focusBlocks: ['repeat_until', 'op_compare'], rules: { requiredTypes: ['when_run_clicked', 'repeat_until', 'op_compare'], requireStartLinked: true } },
  { id: 'l20', level: 5, title: 'Heading Rule', goal: 'Use direction in a condition.', intention: 'Turtle heading is the angle the turtle is facing — 0 is right, 90 is down, 180 is left. Reading heading lets your program make different decisions depending on which way the turtle is pointing.', task: 'Use turtle heading with compare.', steps: ['Drag the turtle heading block into a compare block.', 'Set the compare to check if heading equals 90.', 'Place the compare inside an if block and add a move inside.'], toolbox: ['when_run_clicked', 'if_condition', 'op_compare', 'get_heading', 'op_number', 'move_forward'], focusBlocks: ['get_heading', 'op_compare'], rules: { requiredTypes: ['when_run_clicked', 'if_condition', 'get_heading', 'op_compare'], requireStartLinked: true } },
  { id: 'l21', level: 6, title: 'Setup Section', goal: 'Set up your turtle before you start drawing.', intention: 'Setup blocks tune color and pen before the turtle lays down the real picture.', task: 'Use clear, set color, and set pen size.', steps: ['Clear screen first.', 'Set color.', 'Set pen size before drawing.'], toolbox: ['when_run_clicked', 'clear_screen', 'set_color', 'color_value', 'set_pen_size', 'op_number', 'move_forward'], focusBlocks: ['clear_screen', 'set_color', 'set_pen_size'], rules: { requiredTypes: ['when_run_clicked', 'clear_screen', 'set_color', 'set_pen_size'], requireStartLinked: true } },
  { id: 'l22', level: 6, title: 'Shape System: Circle', goal: 'Draw a circle in a full script.', intention: 'Style setup plus one circle block gives a polished round trace fast.', task: 'Use setup blocks and draw circle.', steps: ['Add when Run clicked, then clear screen, then set color.', 'Add draw circle after the setup.', 'Run — the circle should match the dashed guide.'], toolbox: ['when_run_clicked', 'clear_screen', 'set_color', 'color_value', 'draw_circle', 'op_number'], focusBlocks: ['draw_circle', 'set_color'], rules: { requiredTypes: ['when_run_clicked', 'draw_circle', 'set_color'], requireStartLinked: true } },
  { id: 'l23', level: 6, title: 'Shape System: Polygon', goal: 'Use sides and length for polygons.', intention: 'Polygon parameters let the turtle hop through many regular shapes with one block.', task: 'Use draw polygon in script.', steps: ['Add draw polygon.', 'Set sides and length.', 'Run and check.'], toolbox: ['when_run_clicked', 'clear_screen', 'draw_polygon', 'op_number', 'set_color', 'color_value'], focusBlocks: ['draw_polygon', 'op_number'], rules: { requiredTypes: ['when_run_clicked', 'draw_polygon'], requireStartLinked: true } },
  { id: 'l24', level: 6, title: 'Multi-Part Program', goal: 'Combine setup, loop, and rule.', intention: 'Layering setup, loops, and ifs mirrors how bigger turtle sketches stay organized.', task: 'Use set color + repeat + if.', steps: ['Do setup first.', 'Add repeat block.', 'Add if rule in same script.'], toolbox: ['when_run_clicked', 'set_color', 'color_value', 'repeat_times', 'if_condition', 'op_compare', 'op_number', 'move_forward', 'turn_right'], focusBlocks: ['repeat_times', 'if_condition', 'set_color'], rules: { requiredTypes: ['when_run_clicked', 'set_color', 'repeat_times', 'if_condition'], requireStartLinked: true } },
  { id: 'l25', level: 7, title: 'Fix Missing Link', goal: 'Repair a broken connection.', intention: 'Blocks only run when they are connected in a chain from the start block. A block floating on its own will never do anything — the turtle never sees it. This lesson is about finding and fixing that kind of break.', task: 'Build start -> repeat -> move -> turn.', steps: ['Place the start block and snap repeat directly below it.', 'Drag move forward inside the repeat block.', 'Add turn right after move forward, inside the repeat.'], toolbox: ['when_run_clicked', 'repeat_times', 'move_forward', 'turn_right', 'op_number'], focusBlocks: ['when_run_clicked', 'repeat_times'], rules: { requiredTypes: ['when_run_clicked', 'repeat_times', 'move_forward', 'turn_right'], requireStartLinked: true } },
  { id: 'l26', level: 7, title: 'Fix Wrong Block Type', goal: 'Swap incorrect blocks for correct ones.', intention: 'If your drawing does not match the dashed guide, the right fix is often swapping one block for a different kind. Adding a turn makes the turtle change direction at each corner — without it, the turtle just goes straight.', task: 'Use move and turn, not only move.', steps: ['Add a repeat block with move forward inside.', 'Run it and notice the turtle only draws a straight line.', 'Add turn right after move forward inside the repeat, then run again to see the square form.'], toolbox: ['when_run_clicked', 'repeat_times', 'move_forward', 'turn_right', 'op_number'], focusBlocks: ['move_forward', 'turn_right'], rules: { requiredTypes: ['when_run_clicked', 'repeat_times', 'move_forward', 'turn_right'], requireStartLinked: true } },
  { id: 'l27', level: 7, title: 'Debug with Fast Tests', goal: 'Reset and rerun quickly while fixing.', intention: 'Good debugging means running your code, seeing what changed, adjusting one thing, and running again. Clear screen wipes previous marks so you can compare runs, and wait gives you time to see what happened.', task: 'Use clear + wait + draw.', steps: ['Add clear screen right after start so old marks disappear on each run.', 'Add draw circle after the clear.', 'Add wait seconds after the draw so you can see the result before the run ends.'], toolbox: ['when_run_clicked', 'clear_screen', 'draw_circle', 'wait_seconds', 'op_number'], focusBlocks: ['clear_screen', 'wait_seconds', 'draw_circle'], rules: { requiredTypes: ['when_run_clicked', 'clear_screen', 'draw_circle', 'wait_seconds'], requireStartLinked: true } },
  { id: 'l28', level: 8, title: 'Remix Starter', goal: 'Mix at least 5 different block types.', intention: 'Remixing motion, color, and shape blocks surfaces new turtle doodles fast.', task: 'Use 5 non-number blocks in one script.', steps: ['Start with when Run clicked.', 'Add at least five different block types — try mixing move, color, repeat, circle, and clear screen.', 'Run and check — keep adjusting until it passes.'], toolbox: ['when_run_clicked', 'clear_screen', 'set_color', 'color_value', 'set_pen_size', 'move_forward', 'turn_right', 'repeat_times', 'draw_circle', 'op_number'], focusBlocks: ['set_color', 'repeat_times', 'draw_circle'], rules: { requiredTypes: ['when_run_clicked'], minNonNumberBlocks: 5, requireStartLinked: true } },
  { id: 'l29', level: 8, title: 'Invent a Mini Tool', goal: 'Create your own drawing behavior.', intention: 'Your own if + loop + shape combo becomes a tiny turtle “tool� you can reuse.', task: 'Use loop + rule + shape together.', steps: ['Add repeat block.', 'Add if with compare.', 'Use circle or polygon.'], toolbox: ['when_run_clicked', 'repeat_times', 'if_condition', 'op_compare', 'op_number', 'draw_circle', 'draw_polygon', 'move_forward', 'turn_right'], focusBlocks: ['repeat_times', 'if_condition', 'draw_polygon'], rules: { requiredTypes: ['when_run_clicked', 'repeat_times', 'if_condition'], oneOfTypes: ['draw_circle', 'draw_polygon'], requireStartLinked: true } },
  { id: 'l30', level: 8, title: 'Recursion Basics', goal: 'Build your first self-calling function.', intention: 'A function that calls itself can spiral the turtle outward if each call shrinks the job and stops cleanly.', task: 'Define a function that calls itself with a counter and a stop condition.', steps: ['Create a function named spiralStep — define it with a variable as a counter.', 'Inside it, add move forward, turn right, then change the counter variable by -1.', 'Add an if block inside the function: if counter > 0, call spiralStep again — this stops the chain when counter reaches 0.'], toolbox: ['when_run_clicked', '__PROCEDURES__', '__VARIABLES__', 'if_condition', 'op_compare', 'op_math', 'op_number', 'move_forward', 'turn_right'], focusBlocks: ['if_condition', 'op_compare', 'variables_set'], rules: { requiredTypes: ['when_run_clicked', 'if_condition', 'op_compare'], oneOfTypes: ['procedures_defnoreturn', 'procedures_callnoreturn'], requireStartLinked: true } },
  { id: 'l31', level: 8, title: 'Capstone Build', goal: 'Build a full mini project with systems.', intention: 'A capstone turtle scene ties color, motion, variables, and rules into one coherent drawing.', task: 'Use start + loop + condition + variable + shape.', steps: ['Add setup blocks under start: clear screen, set color, set pen size.', 'Create at least one variable and give it a starting value.', 'Add a repeat block with an if rule inside, and use a shape block like draw circle or draw polygon.'], toolbox: ['when_run_clicked', '__VARIABLES__', 'repeat_times', 'if_condition', 'op_compare', 'op_number', 'draw_circle', 'draw_polygon', 'set_color', 'color_value', 'move_forward', 'turn_right'], focusBlocks: ['variables_set', 'repeat_times', 'if_condition', 'draw_circle'], rules: { requiredTypes: ['when_run_clicked', 'repeat_times', 'if_condition', 'variables_set'], oneOfTypes: ['draw_circle', 'draw_polygon'], minNonNumberBlocks: 7, requireStartLinked: true } },
  { id: 'l32', level: 9, title: 'Move Backward', goal: 'Control reverse movement.', intention: 'Move backward makes the turtle step in reverse without turning around. It is useful for creating symmetry, retracing a path, or navigating tight spaces where spinning the turtle would go out of bounds.', task: 'Use move backward under start.', steps: ['Place when Run clicked.', 'Add move backward below it.', 'Run and notice the turtle moves backward but still faces the same direction.'], toolbox: ['when_run_clicked', 'move_backward', 'op_number'], focusBlocks: ['move_backward'], rules: { requiredTypes: ['when_run_clicked', 'move_backward'], requireStartLinked: true } },
  { id: 'l33', level: 9, title: 'Jump to Coordinates', goal: 'Place the turtle at a specific point.', intention: 'Jump-to teleports the turtle so the next line starts exactly where you planned on the grid.', task: 'Use jump to with x and y values.', steps: ['Drag jump to.', 'Set x and y values.', 'Connect under start.'], toolbox: ['when_run_clicked', 'jump_to', 'op_number'], focusBlocks: ['jump_to'], rules: { requiredTypes: ['when_run_clicked', 'jump_to'], requireStartLinked: true } },
  { id: 'l34', level: 9, title: 'Return to Center', goal: 'Reset turtle location fast.', intention: 'Snapping back to center gives every section of a doodle the same anchor.', task: 'Use go to center in your script.', steps: ['Place start block.', 'Add go to center.', 'Add one move block after it.'], toolbox: ['when_run_clicked', 'go_to_center', 'move_forward', 'op_number'], focusBlocks: ['go_to_center'], rules: { requiredTypes: ['when_run_clicked', 'go_to_center'], requireStartLinked: true } },
  { id: 'l35', level: 9, title: 'Set Heading', goal: 'Point the turtle to an exact angle.', intention: 'Locking heading first makes the next forward stroke land at a known compass angle.', task: 'Set heading, then move forward.', steps: ['Add set heading under start and set the angle to 0 (facing right).', 'Add move forward after it.', 'Try changing the angle to 90, 180, or 270 and run each time to see which direction the turtle goes.'], toolbox: ['when_run_clicked', 'set_heading', 'move_forward', 'op_number'], focusBlocks: ['set_heading'], rules: { requiredTypes: ['when_run_clicked', 'set_heading', 'move_forward'], requireStartLinked: true } },
  { id: 'l36', level: 10, title: 'Random Color Fun', goal: 'Use random color changes in drawing.', intention: 'Random ink keeps the turtle’s same path feeling fresh on every run.', task: 'Use set random color before drawing.', steps: ['Add set random color.', 'Add move or shape block after it.', 'Run a few times and compare colors.'], toolbox: ['when_run_clicked', 'set_random_color', 'move_forward', 'op_number'], focusBlocks: ['set_random_color'], rules: { requiredTypes: ['when_run_clicked', 'set_random_color'], requireStartLinked: true } },
  { id: 'l37', level: 10, title: 'Draw Line Block', goal: 'Draw a precise line in one step.', intention: 'Instead of using a move forward block, the draw line block draws a straight segment of an exact length in one go. It is faster when you just need one clean stroke without any turning.', task: 'Use draw line with a chosen length.', steps: ['Add draw line under start.', 'Set the length number — try 100.', 'Run and then try different lengths to see how the line changes.'], toolbox: ['when_run_clicked', 'draw_line', 'op_number'], focusBlocks: ['draw_line'], rules: { requiredTypes: ['when_run_clicked', 'draw_line'], requireStartLinked: true } },
  { id: 'l38', level: 10, title: 'Draw Rectangle Block', goal: 'Draw box shapes using width and height.', intention: 'Instead of drawing four separate sides with move and turn, the draw rectangle block does it all in one go. You set a width and a height, and it builds the whole box for you.', task: 'Use draw rectangle with two values.', steps: ['Add draw rectangle under start.', 'Set the width to 80 and the height to 40.', 'Run, then try swapping the numbers to see how the proportions change.'], toolbox: ['when_run_clicked', 'draw_rectangle', 'op_number'], focusBlocks: ['draw_rectangle'], rules: { requiredTypes: ['when_run_clicked', 'draw_rectangle'], requireStartLinked: true } },
  { id: 'l39', level: 11, title: 'Math Expressions', goal: 'Compute values with math operators.', intention: 'Instead of typing a fixed number into move forward, you can use a math block to calculate the number on the fly. For example, 50 + 30 gives you 80 — and if you change the 30 to 10, the line shortens automatically.', task: 'Use an op math block to feed movement.', steps: ['Drag a math operator block and set it to addition.', 'Put two number blocks on each side.', 'Plug the math block into the move forward distance slot and run.'], toolbox: ['when_run_clicked', 'move_forward', 'op_math', 'op_number'], focusBlocks: ['op_math'], rules: { requiredTypes: ['when_run_clicked', 'op_math'], requireStartLinked: true } },
  { id: 'l40', level: 11, title: 'Boolean Values', goal: 'Use true/false directly.', intention: 'A true/false block is the simplest possible condition. Putting true inside an if block means that if will always run. Putting false means it will never run. This is useful for testing — you can lock a branch open or closed while you figure out the rest.', task: 'Use op boolean inside an if condition.', steps: ['Add an if block under start.', 'Drag a true/false block into the if condition slot.', 'Put a move forward inside the if block, then try switching true to false and run again.'], toolbox: ['when_run_clicked', 'if_condition', 'op_boolean', 'move_forward'], focusBlocks: ['op_boolean'], rules: { requiredTypes: ['when_run_clicked', 'if_condition', 'op_boolean'], requireStartLinked: true } },
  { id: 'l41', level: 11, title: 'String Values', goal: 'Create and use text values.', intention: 'A text block holds a word or sentence. In programming, a piece of text is called a string. You use strings to label events, give names to things, and write notes that the computer can read.', task: 'Use op string in a block input.', steps: ['Drag a text block into your workspace.', 'Click it and type a word, like "hello".', 'Connect it to a note block or an event name block.'], toolbox: ['when_run_clicked', 'op_string', 'note_comment'], focusBlocks: ['op_string'], rules: { requiredTypes: ['when_run_clicked', 'op_string'], requireStartLinked: true } },
  { id: 'l42', level: 12, title: 'Lists: Create + Add + Get', goal: 'Keep a list of values and use them one by one.', intention: 'A list stores many values in order, like a playlist or a shopping list. You can add items to the end, and then read them back by their position number — the first item is at position 1, the second at position 2, and so on.', task: 'Create a list, add an item, then read one item.', steps: ['Add a make list block and give it a name.', 'Add an add to list block and connect a number or text to it.', 'Add a list item block, set the position to 1, and connect it to a note block to see the value.'], toolbox: ['when_run_clicked', 'array_create', 'array_add_item', 'array_get', 'op_string', 'op_number'], focusBlocks: ['array_create', 'array_add_item', 'array_get'], rules: { requiredTypes: ['when_run_clicked', 'array_create', 'array_add_item', 'array_get'], requireStartLinked: true } },
  { id: 'l43', level: 12, title: 'Objects: Set + Get', goal: 'Store named information in one place.', intention: 'An object is like a labeled card that holds several pieces of information. Each piece has a name (the key) and a value — like "color: red" or "score: 10". This lets your program keep related data organized together.', task: 'Create an object, set one key, then read it.', steps: ['Add a make object block and give it a name.', 'Add a set object key block — set the key to "color" and the value to a text block saying "red".', 'Add a get object key block, use the same object name and key "color", and connect it to a note block.'], toolbox: ['when_run_clicked', 'object_create', 'object_set', 'object_get', 'op_string', 'op_number'], focusBlocks: ['object_create', 'object_set', 'object_get'], rules: { requiredTypes: ['when_run_clicked', 'object_create', 'object_set', 'object_get'], requireStartLinked: true } },
  { id: 'l44', level: 12, title: 'Comment Your Code', goal: 'Use notes to explain your code.', intention: 'A note block is a comment — it does not change what the turtle does at all. But it reminds you (or a friend reading your code later) what that part is supposed to do. Good programmers comment their code so it stays understandable even weeks later.', task: 'Add a note_comment block in your script.', steps: ['Add move forward under start.', 'Drag a note block and place it near the move block.', 'Click the note and write a short sentence explaining what the move does.'], toolbox: ['when_run_clicked', 'note_comment', 'move_forward', 'op_number'], focusBlocks: ['note_comment'], rules: { requiredTypes: ['when_run_clicked', 'note_comment'], requireStartLinked: true } },
  { id: 'l45', level: 13, title: 'Message Events', goal: 'Trigger code with named events.', intention: 'Events let one turtle stack nudge another stack after a named signal fires.', task: 'Use send event and on event with the same name.', steps: ['Start a new stack: drag when Run clicked, add send event, and type the name "go".', 'Start a second separate stack: drag on event, set its name to "go", then add move forward inside it.', 'Press Run — the first stack fires, the second stack catches it and moves the turtle.'], toolbox: ['when_run_clicked', 'send_event_message', 'on_event_message', 'move_forward', 'turn_right'], focusBlocks: ['send_event_message', 'on_event_message'], rules: { requiredTypes: ['send_event_message', 'on_event_message'], requireStartLinked: false } },
  { id: 'l46', level: 13, title: 'Canvas Zoom Controls', goal: 'Control view scale while drawing.', intention: 'Zooming in and out changes what you see, not what the turtle drew. Zoom in to inspect small details up close, zoom out to see the full picture, and reset zoom to return to the default view. The drawing itself does not change.', task: 'Use zoom in, zoom out, and reset zoom.', steps: ['Add zoom in under start.', 'Add zoom out after it.', 'Add reset zoom at the end so the view goes back to normal after the run.'], toolbox: ['when_run_clicked', 'canvas_zoom_in', 'canvas_zoom_out', 'canvas_reset_zoom', 'op_number'], focusBlocks: ['canvas_zoom_in', 'canvas_zoom_out', 'canvas_reset_zoom'], rules: { requiredTypes: ['when_run_clicked', 'canvas_zoom_in', 'canvas_zoom_out', 'canvas_reset_zoom'], requireStartLinked: true } },
  { id: 'l47', level: 13, title: 'Grid Visibility', goal: 'Use grid toggling intentionally.', intention: 'Toggling the grid helps line up turtle jumps and counts squares before you draw.', task: 'Toggle grid during a short script.', steps: ['Add toggle grid right after start to turn the grid on.', 'Add a movement or shape block so you can see the turtle against the grid.', 'Add toggle grid again at the end to turn the grid back off.'], toolbox: ['when_run_clicked', 'canvas_toggle_grid', 'move_forward', 'op_number'], focusBlocks: ['canvas_toggle_grid'], rules: { requiredTypes: ['when_run_clicked', 'canvas_toggle_grid'], requireStartLinked: true } },
  { id: 'l48', level: 13, title: 'Define a Function', goal: 'Create your own reusable block flow.', intention: 'A function is like your own custom block. You give it a name, put steps inside it, and then you can use that name anywhere to run all those steps at once. This lesson is just about defining one — the next lesson covers calling it.', task: 'Add a function definition and include steps inside it.', steps: ['Drag a define function block and give your function a name, like drawShape.', 'Put move forward and turn right inside the function definition.', 'Leave the function block in your workspace — you will call it in the next lesson.'], toolbox: ['when_run_clicked', '__PROCEDURES__', 'move_forward', 'turn_right', 'op_number'], focusBlocks: ['procedures_defnoreturn'], rules: { requiredTypes: ['procedures_defnoreturn'], requireStartLinked: false } },
  { id: 'l49', level: 13, title: 'Call a Function', goal: 'Run your custom function from main flow.', intention: 'Calling a function runs all the steps you defined in it, from wherever you placed the call block. This keeps your main script short and clean — the top stays readable while the function handles the details.', task: 'Define a function and call it from when Run clicked.', steps: ['Create function definition.', 'Add call function block under start.', 'Run to verify the call executes.'], toolbox: ['when_run_clicked', '__PROCEDURES__', 'move_forward', 'turn_right', 'op_number'], focusBlocks: ['procedures_callnoreturn', 'procedures_defnoreturn'], rules: { requiredTypes: ['when_run_clicked', 'procedures_defnoreturn', 'procedures_callnoreturn'], requireStartLinked: true } }
]

const LESSONS_WITH_NUMBERS = LESSONS.map((lesson, index) => ({
  ...lesson,
  lessonNumber: Number.isFinite(Number(String(lesson.id || '').replace(/^l/, '')))
    ? Number(String(lesson.id || '').replace(/^l/, ''))
    : index + 1
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

  // Ghost (x, y) uses the same mapping as the dashed preview: canvasX = w/2 + x, canvasY = h/2 - y.
  // move_forward(50) from center with heading 0 draws 50px to the right on the canvas �' (0,0)-(50,0) here.
  const lineGhostShort = { lines: [{ points: [{ x: 0, y: 0 }, { x: 50, y: 0 }] }] }
  const lineGhostRepeat4 = { lines: [{ points: [{ x: 0, y: 0 }, { x: 200, y: 0 }] }] }
  const cornerGhost = {
    lines: [{ points: [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: -50 }] }]
  }
  const splitLineGhost = {
    lines: [
      { points: [{ x: -45, y: 0 }, { x: -8, y: 0 }] },
      { points: [{ x: 8, y: 0 }, { x: 45, y: 0 }] }
    ]
  }
  const squareGhost = {
    lines: [{ points: [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: -50 }, { x: 0, y: -50 }], close: true }]
  }
  const circleGhost = { circles: [{ x: 0, y: 0, r: 50 }] }
  const triangleGhost = {
    lines: [{ points: [{ x: 0, y: 40 }, { x: 40, y: -30 }, { x: -40, y: -30 }], close: true }]
  }
  const pentagonGhost = {
    lines: [{ points: [{ x: 0, y: 45 }, { x: 43, y: 14 }, { x: 26, y: -37 }, { x: -26, y: -37 }, { x: -43, y: 14 }], close: true }]
  }

  const byLesson = {
    0: {
      starterXml: STARTER_XML.basic,
      ghostPreview: lineGhostShort
    },
    1: {
      starterXml: `
        <xml xmlns="https://developers.google.com/blockly/xml">
          <block type="when_run_clicked" x="30" y="24"></block>
        </xml>
      `,
      ghostPreview: lineGhostShort
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
      ghostPreview: lineGhostShort
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
      ghostPreview: lineGhostRepeat4
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
      ghostPreview: lineGhostRepeat4
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
const LESSONS_ORDERED = [...LESSONS_ENRICHED].sort((a, b) => a.lessonNumber - b.lessonNumber)

const LESSON_ID_SET = new Set(LESSONS_ORDERED.map((lesson) => lesson.id))
const LESSON_TAKEAWAYS = {
  l0: { summary: 'You ran your first program from top to bottom and made the turtle draw.', bullets: ['Start blocks decide when code begins.', 'One move block can already create visible output.'] },
  l1: { summary: 'You connected a valid start-to-action flow.', bullets: ['Programs need an entry point.', 'Connected blocks run as one sequence.'] },
  l2: { summary: 'You practiced sequence by chaining actions in order.', bullets: ['Order changes behavior.', 'Move then turn produces a different result than turn then move.'] },
  l3: { summary: 'You controlled when drawing happens with pen state.', bullets: ['Pen down draws; pen up repositions cleanly.', 'State blocks are as important as motion blocks.'] },
  l4: { summary: 'You reset the canvas before drawing so tests were cleaner.', bullets: ['Clear-first scripts are easier to debug.', 'Fresh runs make result comparisons reliable.'] },
  l5: { summary: 'You replaced repeated manual steps with a loop.', bullets: ['Loops reduce duplicate blocks.', 'Repeat count controls pattern size.'] },
  l6: { summary: 'You used repeat + turn to build a geometric shape.', bullets: ['Regular turns create corners.', 'Loop structure is ideal for polygons.'] },
  l7: { summary: 'You built continuous behavior with a forever loop.', bullets: ['Forever powers animations.', 'Small waits make motion readable.'] },
  l8: { summary: 'You combined nested loops to create richer patterns.', bullets: ['Inner loops define micro-patterns.', 'Outer loops replicate the pattern at a bigger scale.'] },
  l9: { summary: 'You introduced decision logic with an if condition.', bullets: ['Conditions gate actions.', 'Compare blocks produce the true/false value if needs.'] },
  l10: { summary: 'You used turtle X position as live input for behavior.', bullets: ['Programs can react to location.', 'Sensor values make movement context-aware.'] },
  l11: { summary: 'You combined multiple conditions with logic operators.', bullets: ['AND is strict, OR is flexible.', 'Complex behavior comes from composing small rules.'] },
  l12: { summary: 'You inverted behavior by wrapping a rule with NOT.', bullets: ['NOT flips true and false.', 'Inversion is useful for opposite-case handling.'] },
  l13: { summary: 'You created your first variable and stored state.', bullets: ['Variables are memory boxes.', 'Naming variables clearly helps later lessons.'] },
  l14: { summary: 'You updated stored state during runtime.', bullets: ['Change variable tracks progress over time.', 'Small increments/decrements create dynamic systems.'] },
  l15: { summary: 'You read variable values inside logic decisions.', bullets: ['Get variable connects memory to behavior.', 'State-driven conditions are core to game logic.'] },
  l16: { summary: 'You mixed loops with memory updates.', bullets: ['Repeated state changes build counters and timers.', 'Loop + variable is a foundational pattern.'] },
  l17: { summary: 'You used Y position sensing to control actions.', bullets: ['Vertical position can trigger behavior.', 'Sensors and rules create responsive scripts.'] },
  l18: { summary: 'You controlled timing with wait-until logic.', bullets: ['Execution can pause for a condition.', 'This helps coordinate multi-step sequences.'] },
  l19: { summary: 'You used repeat-until to stop looping intentionally.', bullets: ['Stop conditions prevent endless loops.', 'Loop exits are just as important as loop starts.'] },
  l20: { summary: 'You used heading as a condition input.', bullets: ['Direction can drive rule-based behavior.', 'Orientation checks improve movement control.'] },
  l21: { summary: 'You built a cleaner setup phase before drawing.', bullets: ['Style setup makes output consistent.', 'Organized startup improves readability.'] },
  l22: { summary: 'You integrated style setup with a circle drawing action.', bullets: ['Shape blocks speed up creation.', 'Radius choices strongly affect composition.'] },
  l23: { summary: 'You used polygon parameters to generate shape variants.', bullets: ['Side count changes geometry instantly.', 'Length tuning controls size and spacing.'] },
  l24: { summary: 'You combined setup, loops, and conditions in one flow.', bullets: ['Systems thinking means connecting multiple concepts.', 'Layered logic creates more intentional output.'] },
  l25: { summary: 'You debugged by repairing structure and connections.', bullets: ['Many bugs come from missing links.', 'Rebuild and retest is a strong debugging habit.'] },
  l26: { summary: 'You corrected block choices to match target behavior.', bullets: ['Choosing the right block matters.', 'Turn + move pairing is essential for closed shapes.'] },
  l27: { summary: 'You used fast test cycles to stabilize behavior.', bullets: ['Clear-and-rerun improves iteration speed.', 'Slower playback reveals subtle mistakes.'] },
  l28: { summary: 'You remixed with multiple block categories in one script.', bullets: ['Creative variety grows from block combinations.', 'Remixing is a practical invention skill.'] },
  l29: { summary: 'You built a mini system with loops, rules, and shapes.', bullets: ['Structured creativity beats random block stacking.', 'Behavior rules can shape visual style.'] },
  l30: { summary: 'You practiced recursion concepts with self-calling logic.', bullets: ['Recursive flows need a clear stop rule.', 'Counter-based stopping prevents infinite recursion.'] },
  l31: { summary: 'You completed a capstone by combining core systems.', bullets: ['Full projects use setup, state, loops, and rules together.', 'Complex results come from simple blocks composed well.'] },
  l32: { summary: 'You added backward motion for better movement control.', bullets: ['Reverse steps help symmetry and repositioning.', 'Direction control is more than turning.'] },
  l33: { summary: 'You positioned the turtle precisely with coordinates.', bullets: ['Jump-to is ideal for exact placement.', 'Coordinate control improves layout planning.'] },
  l34: { summary: 'You used center reset to simplify multi-part drawings.', bullets: ['Center is a reliable anchor point.', 'Reset blocks reduce drift between sections.'] },
  l35: { summary: 'You set an exact heading before movement.', bullets: ['Deterministic angles improve repeatability.', 'Heading setup prevents accidental orientation errors.'] },
  l36: { summary: 'You introduced randomness through color changes.', bullets: ['Randomness creates playful variation.', 'Same logic can yield varied visuals each run.'] },
  l37: { summary: 'You used a dedicated line primitive effectively.', bullets: ['Single-purpose shape blocks speed workflows.', 'Length control makes line output predictable.'] },
  l38: { summary: 'You drew parameterized rectangles with width and height.', bullets: ['Two parameters produce many box styles.', 'Dimension tuning changes proportion and design feel.'] },
  l39: { summary: 'You computed dynamic values with math operators.', bullets: ['Math blocks make motion adaptive.', 'Expressions reduce hardcoded constants.'] },
  l40: { summary: 'You tested direct boolean values in conditions.', bullets: ['Boolean blocks help validate logic wiring.', 'True/false thinking is core to control flow.'] },
  l41: { summary: 'You created and edited text values for scripts.', bullets: ['Strings label keys, events, and notes.', 'Text data broadens what programs can describe.'] },
  l42: { summary: 'You built list workflows: create, add, and retrieve.', bullets: ['Lists store ordered data.', 'Index access lets you reuse stored sequences.'] },
  l43: { summary: 'You worked with object key-value state.', bullets: ['Objects group related properties.', 'Set/get keys make named data easy to manage.'] },
  l44: { summary: 'You documented intent using comment blocks.', bullets: ['Readable code is easier to maintain.', 'Notes help collaborators and future-you.'] },
  l45: { summary: 'You coordinated scripts using named events.', bullets: ['Send and receive must match event names.', 'Event-driven design supports modular systems.'] },
  l46: { summary: 'You controlled zoom state with explicit canvas actions.', bullets: ['View controls aid inspection and demo quality.', 'Reset zoom keeps workspace navigation predictable.'] },
  l47: { summary: 'You toggled grid visibility for alignment support.', bullets: ['Grid helps spacing and placement checks.', 'View aids are part of practical debugging.'] },
  l48: { summary: 'You defined a reusable function block.', bullets: ['Functions package repeated logic.', 'Named actions improve program organization.'] },
  l49: { summary: 'You called a custom function from the main script.', bullets: ['Definition + call is the full function workflow.', 'Main scripts stay cleaner when logic is extracted.'] }
}

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
  // Keep editable text inputs readable in static lesson previews.
  clone.querySelectorAll('.blocklyEditableText text, .blocklyFieldTextInput').forEach((node) => {
    node.setAttribute('fill', '#111827')
  })
  clone.querySelectorAll('.blocklyEditableText rect, .blocklyFieldRect').forEach((node) => {
    node.setAttribute('fill', '#ffffff')
    node.setAttribute('stroke', '#94a3b8')
  })
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
      return 'Use this as one of the core building blocks for this mission.'
  }
}

function lessonFallbackVisual(level) {
  const byLevel = {
    1: '🚀',
    2: '�',
    3: '🧠',
    4: '📦',
    5: '🧭',
    6: '🛠�',
    7: '�',
    8: '🎨'
  }
  return byLevel[level] || '✨'
}

function lessonOpeningLeadIn(lesson, isIntro) {
  if (isIntro) {
    return 'This is your turtle’s first program: a short stack of blocks, a press of Run, and one line of ink so you can see cause and effect right away.'
  }
  const ghostHint = lesson.ghostPreview
    ? ' When you use Run + Check Lesson, your turtle’s ink should line up with the dashed guide on the canvas.'
    : ''
  return `${lesson.goal}${ghostHint}`
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
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false)
  const ghostPassRef = useRef(false)
  const runFinishResolverRef = useRef(null)
  const awaitingRunFinishRef = useRef(false)
  const isIntroLesson = lesson.id === 'l0'
  const lessonMedia = LESSON_MEDIA[lesson.id] || []
  const lessonContext = LESSON_REAL_WORLD_CONTEXT[lesson.id] || null
  const ensureProcedureNames = (ws) => {
    if (!ws) return
    const procedureBlocks = ws.getAllBlocks(false).filter((block) =>
      block.type === 'procedures_defnoreturn' || block.type === 'procedures_defreturn'
    )
    procedureBlocks.forEach((block) => {
      const name = (block.getFieldValue('NAME') || '').trim()
      if (!name) {
        block.setFieldValue('my_function', 'NAME')
      }
    })
    const callBlocks = ws.getAllBlocks(false).filter((block) =>
      block.type === 'procedures_callnoreturn' || block.type === 'procedures_callreturn'
    )
    callBlocks.forEach((block) => {
      const name = (block.getFieldValue('NAME') || '').trim()
      if (!name) {
        try {
          block.setFieldValue('my_function', 'NAME')
        } catch (error) {
          // Ignore if dropdown options are still initializing.
        }
      }
    })
  }

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
    ensureProcedureNames(workspaceRef.current)
    workspaceRef.current.addChangeListener(() => {
      ensureProcedureNames(workspaceRef.current)
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
    setShowCompletionOverlay(false)
    setRunSequence(0)
    setStopSequence(0)
    ghostPassRef.current = false
    awaitingRunFinishRef.current = false
    runFinishResolverRef.current = null
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [lesson.id])

  const handleCanvasRunStateChange = (running) => {
    setIsRunning(running)
    if (!running && awaitingRunFinishRef.current && runFinishResolverRef.current) {
      awaitingRunFinishRef.current = false
      const resolve = runFinishResolverRef.current
      runFinishResolverRef.current = null
      resolve()
    }
  }

  const handleGhostScore = (result) => {
    ghostPassRef.current = !!(result && result.pass)
  }

  const handleRunAndCheck = async () => {
    if (!workspaceRef.current || checking) return
    ghostPassRef.current = false
    awaitingRunFinishRef.current = true
    const runFinished = new Promise((resolve) => {
      runFinishResolverRef.current = resolve
    })
    setStopSequence((n) => n + 1)
    setRunSequence((n) => n + 1)
    setChecking(true)
    setMessage('')
    let runTimedOut = false
    await Promise.race([
      runFinished,
      new Promise((resolve) => {
        setTimeout(() => {
          runTimedOut = true
          resolve()
        }, 45000)
      })
    ])

    awaitingRunFinishRef.current = false
    if (runFinishResolverRef.current) {
      runFinishResolverRef.current = null
    }

    if (runTimedOut) {
      setMessage('That run took too long. If you used forever, add a wait or shorten the loop, then try Run + Check again.')
      setChecking(false)
      return
    }

    const blocksOk = isLessonComplete(workspaceRef.current, lesson)
    const needsGhostMatch = !!lesson.ghostPreview
    const ghostOk = !needsGhostMatch || ghostPassRef.current
    const passed = blocksOk && ghostOk

    if (passed) {
      setMessage('')
      setShowCompletionOverlay(true)
      window.setTimeout(() => setShowCompletionOverlay(false), 1800)
      onComplete(lesson.id)
    } else if (!blocksOk) {
      setMessage('Nice try. Follow the mission and steps, then check again.')
    } else if (needsGhostMatch && !ghostOk) {
      setMessage('Blocks look good, but your turtle’s drawing does not match the dashed guide yet. Run again and adjust distances, turns, or pen until the ink lines up.')
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

      {/* l0 only: brief explainers before anything else */}
      {isIntroLesson && (
        <>
          <h3 className='lesson-mini-title'>What Are Blocks?</h3>
          <p className='lesson-long-text'>
            Blocks are visual pieces of code. Each block gives one instruction, and snapping blocks
            together creates a program.
          </p>
          <h3 className='lesson-mini-title'>What Is Coding?</h3>
          <p className='lesson-long-text'>
            Coding means giving clear instructions to a computer. Your program starts at the top block
            and runs down, one step at a time.
          </p>
        </>
      )}

      {/* Opening sentence */}
      <p className='lesson-think-prompt'>
        {lessonOpeningLeadIn(lesson, isIntroLesson)}
      </p>

      {/* Block focus grid � show tools before introducing concepts */}
      <section className='lesson-block-focus-grid'>
        {lesson.focusBlocks.map((type) => (
          <article key={type} className='lesson-block-focus-item lesson-focus-card'>
            <InlineBlockToken type={type} svg={blockPreviews[type]} />
            <p className='lesson-long-text'>
              {BLOCK_TEACHING[type] || 'Use this block as part of your solution in this lesson.'}{' '}
              {blockUsagePrompt(type)}
            </p>
          </article>
        ))}
      </section>

      {/* l0: what you will accomplish */}
      {isIntroLesson && (
        <section className='lesson-focus-card'>
          <h3 className='lesson-mini-title'>Lesson Goal</h3>
          <p className='lesson-long-text'>
            By the end of this lesson you will run your very first block program and watch your turtle
            draw a line on the canvas.
          </p>
          <ul className='lesson-steps'>
            <li>Blocks are pieces of code you snap together.</li>
            <li>A program runs from the top block down to the bottom.</li>
            <li>Small changes to your blocks change what appears on the canvas.</li>
          </ul>
        </section>
      )}

      {/* Non-intro: what you will learn (goal already shown above) */}
      {!isIntroLesson && (
        <section className='lesson-focus-card'>
          <h3 className='lesson-mini-title'>What You'll Learn</h3>
          <p className='lesson-long-text'>{lesson.intention}</p>
        </section>
      )}

      {/* Word Help � vocabulary before the task */}
      {LESSON_WORD_HELP[lesson.id] && (
        <section className='lesson-focus-card'>
          <h3 className='lesson-mini-title'>Word Help</h3>
          <ul className='lesson-steps'>
            {LESSON_WORD_HELP[lesson.id].map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Mission � right before the studio so it is fresh when they start building */}
      <section className='lesson-focus-card lesson-focus-card--mission'>
        <h3 className='lesson-mini-title lesson-think-prompt'>Your Mission</h3>
        {isIntroLesson ? (
          <>
            <p className='lesson-long-text'>
              Build this tiny program: snap <strong>move forward</strong> under{' '}
              <strong>when Run clicked</strong>, then press Run.
            </p>
            <p className='lesson-long-text'>
              Your turtle should move forward and draw its first line.
            </p>
          </>
        ) : (
          <p className='lesson-long-text'>{lesson.task}</p>
        )}
      </section>

      {/* Media gallery � reference images near the task */}
      {lessonMedia.length > 0 && (
        <div className={`lesson-photo-gallery ${lessonMedia.length > 1 ? 'is-multi' : 'is-single'}`}>
          {lessonMedia.map((media) => (
            <figure
              key={media.src}
              className={[
                'lesson-photo-callout',
                media.imageSize && media.imageSize !== 'default' && `is-size-${media.imageSize}`
              ].filter(Boolean).join(' ')}
            >
              <img src={media.src} alt={media.alt} loading='lazy' />
              <figcaption>
                {media.showReferenceLabel && (
                  <span className='lesson-photo-reference-prefix'>Reference: </span>
                )}
                {media.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {/* l0 only: debugging tips before the studio */}
      {isIntroLesson && (
        <section className='lesson-mini-section lesson-focus-card'>
          <h3 className='lesson-mini-title'>If Something Looks Wrong</h3>
          <ul className='lesson-steps'>
            <li>Make sure move forward is snapped directly under when Run clicked.</li>
            <li>Press Run again after making any changes.</li>
            <li>If the line is too short, increase the number on the move block.</li>
            <li>If the turtle did not move at all, drag move forward from the block menu and try again.</li>
          </ul>
        </section>
      )}

      {/* Unified studio for all lessons */}
      <div className='studio-shell'>
        <div className='studio-toolbar'>
          <p>
            <strong>Mini Studio:</strong>{' '}
            {lesson.ghostPreview
              ? 'Build your program, run it, and make your turtle\'s ink line up with the dashed guide. Then hit Run + Check Lesson.'
              : 'Build your program, run it, and watch the turtle. When it does what the mission asks, hit Run + Check Lesson.'}
          </p>
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
              onRunStateChange={handleCanvasRunStateChange}
              onChallengeScore={handleGhostScore}
              ghostPreview={lesson.ghostPreview}
              scoreGhostPreview={lesson.ghostPreview}
              defaultPointerStyle='turtle'
            />
          </div>
        </div>
        {showCompletionOverlay && (
          <div className='studio-success-overlay' role='status' aria-live='polite'>
            Awesome work. Lesson complete.
          </div>
        )}
      </div>

      <p className={`lesson-status-message ${isDone ? 'done' : ''}`}>{message}</p>

      <section className='lesson-focus-card lesson-focus-card--try'>
        <h3 className='lesson-mini-title lesson-think-prompt'>Try This Next</h3>
        <p className='lesson-long-text'>{lessonChallengeText(lesson)}</p>
      </section>

      <hr className='lesson-divider' />

      {/* Real-world context � after building, as reflection */}
      {lessonContext && (
        <section className='lesson-focus-card lesson-focus-card--context'>
          <h3 className='lesson-mini-title'>Why Programmers Use This</h3>
          <p className='lesson-long-text'><strong>Relevance:</strong> {lessonContext.relevance}</p>
          <p className='lesson-long-text'><strong>Utility:</strong> {lessonContext.utility}</p>
        </section>
      )}

      <section className='lesson-takeaway lesson-focus-card lesson-focus-card--recap'>
        <h3>After-Lesson Takeaways</h3>
        {!isDone && (
          <div className='takeaway-lock' title='Pass the mini studio with Run + Check Lesson first.'>
            Locked until you pass the mini studio above (Run + Check Lesson).
          </div>
        )}
        {isDone ? (
          <>
            <p>{(LESSON_TAKEAWAYS[lesson.id] && LESSON_TAKEAWAYS[lesson.id].summary) || 'You completed this lesson and reached its mission goal.'}</p>
            <ul>
              {((LESSON_TAKEAWAYS[lesson.id] && LESSON_TAKEAWAYS[lesson.id].bullets) || ['You practiced targeted block usage for this mission.', 'You are ready to build on this in the next lesson.']).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        ) : (
          <p>Finish the mini studio and hit Run + Check Lesson so it turns green � then this recap unlocks.</p>
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
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const lessonPathMatch = pathname.match(/^\/lessons\/(l\d+)$/)
  const selectedLessonIdFromUrl = lessonPathMatch ? lessonPathMatch[1] : null
  const [completed, setCompleted] = useState(getCompletedFromStorage)
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
    LESSONS_ORDERED.forEach((lesson) => {
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
  const progressPercent = Math.round((completedCount / LESSONS_ORDERED.length) * 100)
  const selectedLesson = useMemo(() => {
    if (!selectedLessonIdFromUrl) return null
    return LESSONS_ORDERED.find((lesson) => lesson.id === selectedLessonIdFromUrl) || null
  }, [selectedLessonIdFromUrl])

  useEffect(() => {
    if (!lessonPathMatch) return
    if (!LESSONS_ORDERED.some((lesson) => lesson.id === lessonPathMatch[1])) {
      navigate('/lessons', { replace: true })
    }
  }, [lessonPathMatch, navigate])

  const selectedIndex = selectedLesson
    ? LESSONS_ORDERED.findIndex((lesson) => lesson.id === selectedLesson.id)
    : -1

  const featuredLessonIcons = {
    l0: '🐢',
    l6: '🟦',
    l9: '🤔',
    l13: '🧠',
    l27: '🐞',
    l30: '🌀',
    l41: '🔤'
  }

  const handleComplete = (lessonId) => {
    setCompleted((prev) => (prev.includes(lessonId) ? prev : [...prev, lessonId]))
  }

  return (
    <div className='lessons-page'>
      <main className='lessons-shell'>
        <header className='app-header lessons-app-header'>
          <h1
            className='app-title'
            onClick={onBack}
            style={{ cursor: 'pointer' }}
            title='Back to home'
          >
            <span className='title-block'>Block</span>
            <span className='title-comma'>,</span>{' '}
            <span className='title-code'>Code</span>
            <span className='title-comma'>,</span>{' '}
            <span className='title-draw'>Draw!</span>
          </h1>

          <div className='header-centre lessons-header-centre'>
            <div className='word-badge'>
              <span className='word-badge-label'>Learning Path:</span>
              <span className='word-badge-word'>{completedCount}/{LESSONS_ORDERED.length} complete</span>
            </div>
          </div>

          <div className='header-actions lessons-header-actions'>
            <button type='button' className='catalog-back-btn' onClick={onBack}>
              ← Back to Home
            </button>
            {selectedLesson && (
              <button type='button' className='catalog-back-btn' onClick={() => navigate('/lessons')}>
                ← Back to All {LESSONS_ORDERED.length} Lessons
              </button>
            )}
          </div>
        </header>

        <section className='lessons-hero-meta'>
          <p className='hero-sub'>Block, Code, Draw learning path with {LESSONS_ORDERED.length} lessons.</p>
          <div className='lessons-progress-wrap'>
            <div className='lessons-progress-bar'><div style={{ width: `${progressPercent}%` }} /></div>
            <span>{progressPercent}% progress</span>
          </div>
        </section>

        {!selectedLesson && (
          <section className='lesson-catalog'>
            <div className='catalog-grid'>
              {LESSONS_ORDERED.map((lesson) => {
                const done = completedSet.has(lesson.id)
                return (
                  <button
                    key={lesson.id}
                    type='button'
                    className={'catalog-card level-' + lesson.level + (done ? ' is-done' : '')}
                    onClick={() => navigate(`/lessons/${lesson.id}`)}
                  >
                    <div className='catalog-card-top'>
                      <span className='catalog-lesson-index'>Lesson {lesson.lessonNumber}</span>
                      <span className='catalog-status-pills'>
                        {done ? (
                          <span className='lesson-pill done'>Done</span>
                        ) : (
                          <span className='lesson-pill todo'>Start</span>
                        )}
                      </span>
                    </div>
                    <div className='catalog-card-level-badge'>
                      <span className='catalog-level-chip'>Lv {lesson.level}</span>
                      <span>{LEVEL_TITLES[lesson.level]}</span>
                    </div>
                    <div className='catalog-card-visual-wrap'>
                      {featuredLessonIcons[lesson.id] ? (
                        <span className='catalog-card-feature-emoji'>{featuredLessonIcons[lesson.id]}</span>
                      ) : catalogVisuals[lesson.id] ? (
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
        )}

        {selectedLesson && (
          <LessonDetail
            lesson={selectedLesson}
            isDone={completedSet.has(selectedLesson.id)}
            onComplete={handleComplete}
            onBackToCatalog={() => navigate('/lessons')}
            onPrev={() => {
              if (selectedIndex > 0) navigate(`/lessons/${LESSONS_ORDERED[selectedIndex - 1].id}`)
            }}
            onNext={() => {
              if (selectedIndex < LESSONS_ORDERED.length - 1) {
                navigate(`/lessons/${LESSONS_ORDERED[selectedIndex + 1].id}`)
              }
            }}
            canPrev={selectedIndex > 0}
            canNext={selectedIndex < LESSONS_ORDERED.length - 1}
          />
        )}
      </main>
    </div>
  )
}

