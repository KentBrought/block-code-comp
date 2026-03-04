import React, { useState, useEffect } from 'react';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';

// Define custom blocks
Blockly.defineBlocksWithJsonArray([
    {
        "type": "move_forward",
        "message0": "move forward %1",
        "args0": [{ "type": "field_number", "name": "STEPS", "value": 50 }],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 160
    },
    {
        "type": "turn_right",
        "message0": "turn right %1 degrees",
        "args0": [{ "type": "field_number", "name": "DEGREES", "value": 90 }],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 160
    },
    {
        "type": "turn_left",
        "message0": "turn left %1 degrees",
        "args0": [{ "type": "field_number", "name": "DEGREES", "value": 90 }],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 160
    },
    {
        "type": "pen_up",
        "message0": "pen up",
        "previousStatement": null,
        "nextStatement": null,
        "colour": 160
    },
    {
        "type": "pen_down",
        "message0": "pen down",
        "previousStatement": null,
        "nextStatement": null,
        "colour": 160
    },
    {
        "type": "set_color",
        "message0": "set color %1",
        "args0": [{ "type": "field_colour", "name": "COLOR", "colour": "#4facfe" }],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 160
    }
]);

// Custom Generators
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
javascriptGenerator.forBlock['set_color'] = function (block) {
    const color = block.getFieldValue('COLOR');
    return `setColor('${color}');\n`;
};

const BlocklyEditor = ({ onCodeChange }) => {
    const blocklyDiv = React.useRef();
    const workspace = React.useRef();

    useEffect(() => {
        workspace.current = Blockly.inject(blocklyDiv.current, {
            toolbox: {
                "kind": "categoryToolbox",
                "contents": [
                    {
                        "kind": "category",
                        "name": "Drawing",
                        "contents": [
                            { "kind": "block", "type": "move_forward" },
                            { "kind": "block", "type": "turn_right" },
                            { "kind": "block", "type": "turn_left" },
                            { "kind": "block", "type": "pen_up" },
                            { "kind": "block", "type": "pen_down" },
                            { "kind": "block", "type": "set_color" }
                        ]
                    },
                    {
                        "kind": "category",
                        "name": "Loops",
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

    return <div ref={blocklyDiv} style={{ height: '600px', width: '100%' }} />;
};

export default BlocklyEditor;
