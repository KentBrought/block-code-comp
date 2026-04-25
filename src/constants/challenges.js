const SQUARE_BUG_XML = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="when_run_clicked" x="60" y="40">
    <next>
      <block type="set_pen_size">
        <value name="SIZE">
          <block type="op_number">
            <field name="NUM">4</field>
          </block>
        </value>
        <next>
          <block type="repeat_times">
            <value name="TIMES">
              <block type="op_number">
                <field name="NUM">4</field>
              </block>
            </value>
            <statement name="DO">
              <block type="move_forward">
                <value name="STEPS">
                  <block type="op_number">
                    <field name="NUM">140</field>
                  </block>
                </value>
                <next>
                  <block type="turn_right">
                    <value name="DEGREES">
                      <block type="op_number">
                        <field name="NUM">80</field>
                      </block>
                    </value>
                  </block>
                </next>
              </block>
            </statement>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>
`

const TRIANGLE_BUG_XML = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="when_run_clicked" x="60" y="40">
    <next>
      <block type="set_color">
        <value name="COLOR">
          <block type="color_value">
            <field name="COLOR">#2563eb</field>
          </block>
        </value>
        <next>
          <block type="repeat_times">
            <value name="TIMES">
              <block type="op_number">
                <field name="NUM">2</field>
              </block>
            </value>
            <statement name="DO">
              <block type="move_forward">
                <value name="STEPS">
                  <block type="op_number">
                    <field name="NUM">170</field>
                  </block>
                </value>
                <next>
                  <block type="turn_right">
                    <value name="DEGREES">
                      <block type="op_number">
                        <field name="NUM">120</field>
                      </block>
                    </value>
                  </block>
                </next>
              </block>
            </statement>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>
`

const BULLSEYE_BUG_XML = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="when_run_clicked" x="60" y="40">
    <next>
      <block type="clear_screen">
        <next>
          <block type="set_color">
            <value name="COLOR">
              <block type="color_value">
                <field name="COLOR">#0f172a</field>
              </block>
            </value>
            <next>
              <block type="jump_to">
                <value name="X">
                  <block type="op_number">
                    <field name="NUM">45</field>
                  </block>
                </value>
                <value name="Y">
                  <block type="op_number">
                    <field name="NUM">0</field>
                  </block>
                </value>
                <next>
                  <block type="draw_circle">
                    <value name="RADIUS">
                      <block type="op_number">
                        <field name="NUM">80</field>
                      </block>
                    </value>
                    <next>
                      <block type="draw_circle">
                        <value name="RADIUS">
                          <block type="op_number">
                            <field name="NUM">45</field>
                          </block>
                        </value>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>
`

export const CHALLENGES = [
  {
    id: 'square-angle-bug',
    title: 'Square Angle Drift',
    hint:
      'One turn angle is slightly wrong. A square uses the same right angle every side.',
    starterXml: SQUARE_BUG_XML,
    // Matches actual marker path: start at center (0,0), move_forward(140)
    // rightward, turn_right(90°) × 4. Canvas angle 0 = right, 90 = down.
    ghostPreview: {
      lines: [
        {
          points: [
            { x: 0, y: 0 },
            { x: 140, y: 0 },
            { x: 140, y: -140 },
            { x: 0, y: -140 }
          ],
          close: true
        }
      ]
    }
  },
  {
    id: 'triangle-loop-bug',
    title: 'Missing Triangle Side',
    hint:
      'The rotation is correct for a triangle. Check how many times the loop repeats.',
    starterXml: TRIANGLE_BUG_XML,
    // Matches actual marker path: start at center (0,0), move_forward(170)
    // at angle 0, turn_right(120°) × 3. Vertices derived from turtle geometry.
    ghostPreview: {
      lines: [
        {
          points: [
            { x: 0, y: 0 },
            { x: 170, y: 0 },
            { x: 85, y: -147 }
          ],
          close: true
        }
      ]
    }
  },
  {
    id: 'bullseye-offset-bug',
    title: 'Off-Center Bullseye',
    hint:
      'The circles are the right size, but their center point is shifted from the target.',
    starterXml: BULLSEYE_BUG_XML,
    ghostPreview: {
      circles: [
        { x: 0, y: 0, r: 80 },
        { x: 0, y: 0, r: 45 }
      ]
    }
  }
]
