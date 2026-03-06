import React, { useState, useEffect } from 'react';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { registerContinuousToolbox } from '@blockly/continuous-toolbox';

registerContinuousToolbox();

// Define custom blocks
Blockly.defineBlocksWithJsonArray([
    {
        "type": "when_run_clicked",
        "message0": "when Run clicked",
        "nextStatement": null,
        "colour": "#3bc75e",
        "hat": "cap"
    },
    {
        "type": "move_forward",
        "message0": "move forward %1",
        "args0": [{ "type": "field_number", "name": "STEPS", "value": 50 }],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#4895ef"
    },
    {
        "type": "move_backward",
        "message0": "move backward %1",
        "args0": [{ "type": "field_number", "name": "STEPS", "value": 50 }],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#4895ef"
    },
    {
        "type": "turn_right",
        "message0": "turn right %1 degrees",
        "args0": [{ "type": "field_number", "name": "DEGREES", "value": 90 }],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#4895ef"
    },
    {
        "type": "turn_left",
        "message0": "turn left %1 degrees",
        "args0": [{ "type": "field_number", "name": "DEGREES", "value": 90 }],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#4895ef"
    },
    {
        "type": "jump_to",
        "message0": "jump to x: %1 y: %2",
        "args0": [
            { "type": "field_number", "name": "X", "value": 0 },
            { "type": "field_number", "name": "Y", "value": 0 }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#4895ef"
    },
    {
        "type": "go_to_center",
        "message0": "go to center",
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#4895ef"
    },
    {
        "type": "set_heading",
        "message0": "set heading to %1 degrees",
        "args0": [{ "type": "field_angle", "name": "ANGLE", "angle": 0 }],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#4895ef"
    },
    {
        "type": "pen_up",
        "message0": "pen up",
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#06d6a0"
    },
    {
        "type": "pen_down",
        "message0": "pen down",
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#06d6a0"
    },
    {
        "type": "set_color",
        "message0": "set color %1",
        "args0": [{ "type": "field_colour", "name": "COLOR", "colour": "#f03e3e" }],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#06d6a0"
    },
    {
        "type": "set_pen_size",
        "message0": "set pen size to %1",
        "args0": [{ "type": "field_number", "name": "SIZE", "value": 3 }],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#06d6a0"
    },
    {
        "type": "clear_screen",
        "message0": "clear screen",
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#06d6a0"
    },
    {
        "type": "draw_circle",
        "message0": "draw circle with radius %1",
        "args0": [{ "type": "field_number", "name": "RADIUS", "value": 50 }],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#f72585"
    },
    {
        "type": "get_x",
        "message0": "marker x",
        "output": "Number",
        "colour": "#7b2ff7"
    },
    {
        "type": "get_y",
        "message0": "marker y",
        "output": "Number",
        "colour": "#7b2ff7"
    },
    {
        "type": "get_heading",
        "message0": "marker heading",
        "output": "Number",
        "colour": "#7b2ff7"
    },
    {
        "type": "set_random_color",
        "message0": "set random color",
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#06d6a0"
    },
    {
        "type": "draw_polygon",
        "message0": "draw polygon with %1 sides and length %2",
        "args0": [
            { "type": "field_number", "name": "SIDES", "value": 5 },
            { "type": "field_number", "name": "LENGTH", "value": 50 }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 340
    }
]);

// Custom Generators
javascriptGenerator.STATEMENT_PREFIX = 'highlightBlock(%1);\n';
javascriptGenerator.addReservedWords('highlightBlock');

javascriptGenerator.forBlock['when_run_clicked'] = function (block) {
    return ''; // The trigger is handled implicitly by starting execution
};
javascriptGenerator.forBlock['move_forward'] = function (block) {
    const steps = block.getFieldValue('STEPS');
    return `moveForward(${steps});\n`;
};
javascriptGenerator.forBlock['turn_right'] = function (block) {
    const degrees = block.getFieldValue('DEGREES');
    return `turnRight(${degrees});\n`;
};
javascriptGenerator.forBlock['turn_left'] = function (block) {
    const degrees = block.getFieldValue('DEGREES');
    return `turnLeft(${degrees});\n`;
};
javascriptGenerator.forBlock['pen_up'] = function (block) {
    return `penUp();\n`;
};
javascriptGenerator.forBlock['pen_down'] = function (block) {
    return `penDown();\n`;
};
javascriptGenerator.forBlock['move_backward'] = function (block) {
    const steps = block.getFieldValue('STEPS');
    return `moveBackward(${steps});\n`;
};
javascriptGenerator.forBlock['jump_to'] = function (block) {
    const x = block.getFieldValue('X');
    const y = block.getFieldValue('Y');
    return `jumpTo(${x}, ${y});\n`;
};
javascriptGenerator.forBlock['go_to_center'] = function (block) {
    return `goToCenter();\n`;
};
javascriptGenerator.forBlock['set_heading'] = function (block) {
    const angle = block.getFieldValue('ANGLE');
    return `setHeading(${angle});\n`;
};
javascriptGenerator.forBlock['clear_screen'] = function (block) {
    return `clear();\n`;
};
javascriptGenerator.forBlock['set_pen_size'] = function (block) {
    const size = block.getFieldValue('SIZE');
    return `setPenSize(${size});\n`;
};
javascriptGenerator.forBlock['get_x'] = function (block) {
    return [`getMarkerX()`, javascriptGenerator.ORDER_FUNCTION_CALL];
};
javascriptGenerator.forBlock['get_y'] = function (block) {
    return [`getMarkerY()`, javascriptGenerator.ORDER_FUNCTION_CALL];
};
javascriptGenerator.forBlock['get_heading'] = function (block) {
    return [`getMarkerHeading()`, javascriptGenerator.ORDER_FUNCTION_CALL];
};
javascriptGenerator.forBlock['set_random_color'] = function (block) {
    return `setRandomColor();\n`;
};
javascriptGenerator.forBlock['draw_polygon'] = function (block) {
    const sides = block.getFieldValue('SIDES');
    const length = block.getFieldValue('LENGTH');
    return `drawPolygon(${sides}, ${length});\n`;
};

const BlocklyEditor = ({ onCodeChange, highlightBlockId }) => {
    const blocklyDiv = React.useRef();
    const workspace = React.useRef();

    useEffect(() => {
        if (highlightBlockId) {
            workspace.current.highlightBlock(highlightBlockId);
        } else if (workspace.current && highlightBlockId === null) {
            workspace.current.highlightBlock(null);
        }
    }, [highlightBlockId]);

    useEffect(() => {
        workspace.current = Blockly.inject(blocklyDiv.current, {
            renderer: 'zelos',
            plugins: {
                'toolbox': 'ContinuousToolbox',
                'flyoutsVerticalToolbox': 'ContinuousFlyout',
                'metricsManager': 'ContinuousMetrics',
            },
            toolbox: {
                "kind": "categoryToolbox",
                "contents": [
                    {
                        "kind": "category",
                        "name": "Events",
                        "colour": "#3bc75e",
                        "contents": [
                            { "kind": "block", "type": "when_run_clicked" }
                        ]
                    },
                    {
                        "kind": "category",
                        "name": "Motion",
                        "colour": "#4895ef",
                        "contents": [
                            { "kind": "block", "type": "move_forward" },
                            { "kind": "block", "type": "move_backward" },
                            { "kind": "block", "type": "turn_right" },
                            { "kind": "block", "type": "turn_left" },
                            { "kind": "block", "type": "set_heading" },
                            { "kind": "block", "type": "jump_to" },
                            { "kind": "block", "type": "go_to_center" }
                        ]
                    },
                    {
                        "kind": "category",
                        "name": "Pen",
                        "colour": "#06d6a0",
                        "contents": [
                            { "kind": "block", "type": "pen_up" },
                            { "kind": "block", "type": "pen_down" },
                            { "kind": "block", "type": "set_color" },
                            { "kind": "block", "type": "set_random_color" },
                            { "kind": "block", "type": "set_pen_size" },
                            { "kind": "block", "type": "clear_screen" }
                        ]
                    },
                    {
                        "kind": "category",
                        "name": "Shapes",
                        "colour": "#f72585",
                        "contents": [
                            { "kind": "block", "type": "draw_circle" },
                            { "kind": "block", "type": "draw_polygon" }
                        ]
                    },
                    {
                        "kind": "category",
                        "name": "Sensing",
                        "colour": "#7b2ff7",
                        "contents": [
                            { "kind": "block", "type": "get_x" },
                            { "kind": "block", "type": "get_y" },
                            { "kind": "block", "type": "get_heading" }
                        ]
                    },
                    {
                        "kind": "category",
                        "name": "Loops",
                        "colour": "#ff9500",
                        "contents": [
                            { "kind": "block", "type": "controls_repeat_ext" }
                        ]
                    }
                ]
            }
        });

        workspace.current.addChangeListener(() => {
            const code = javascriptGenerator.workspaceToCode(workspace.current);
            onCodeChange(code);
        });

        return () => workspace.current.dispose();
    }, [onCodeChange]);

    return <div ref={blocklyDiv} style={{ height: '100%', width: '100%' }} />;
};

export default BlocklyEditor;
