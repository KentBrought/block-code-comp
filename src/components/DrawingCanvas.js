import React, { useRef, useEffect } from 'react';

const DrawingCanvas = ({ commands, runSequence, onHighlight }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        let curX = canvas.width / 2;
        let curY = canvas.height / 2;
        let curAngle = 0;
        let curPenDown = true;

        const resetCanvas = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#f0f0f0';
            ctx.lineWidth = 0.5;
            for (let i = 0; i < canvas.width; i += 50) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
            }
            for (let i = 0; i < canvas.height; i += 50) {
                ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
            }
            ctx.strokeStyle = '#4facfe';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            curX = canvas.width / 2;
            curY = canvas.height / 2;
            curAngle = 0;
            curPenDown = true;
            ctx.moveTo(curX, curY);
        };

        const drawMarker = () => {
            ctx.save();
            ctx.translate(curX, curY);
            ctx.rotate((curAngle * Math.PI) / 180);
            ctx.fillStyle = '#ff4b2b';
            ctx.beginPath();
            ctx.moveTo(15, 0);
            ctx.lineTo(-7, -7);
            ctx.lineTo(-7, 7);
            ctx.fill();
            ctx.restore();
        };

        const runCommandsAsync = async () => {
            resetCanvas();
            const commandList = commands.split('\n');

            for (let cmd of commandList) {
                if (!cmd || !cmd.trim()) continue;

                const match = cmd.trim().match(/^(\w+)\((.*)\);?$/);
                if (!match) continue;

                const action = match[1];
                const argsStr = match[2];
                const args = argsStr.split(',').map(arg => {
                    const trimmed = arg.trim();
                    // Handle quoted strings for colors
                    if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
                        return trimmed.slice(1, -1);
                    }
                    return parseFloat(trimmed);
                });

                if (action === 'highlightBlock') {
                    const rawId = argsStr.trim();
                    const id = rawId.startsWith("'") ? rawId.slice(1, -1) : rawId;
                    if (onHighlight) onHighlight(id);
                    await new Promise(r => setTimeout(r, 400));
                    continue;
                } else if (action === 'moveForward') {
                    const val = args[0] || 0;
                    const rad = (curAngle * Math.PI) / 180;
                    curX += Math.cos(rad) * val;
                    curY += Math.sin(rad) * val;
                    if (curPenDown) ctx.lineTo(curX, curY);
                    else ctx.moveTo(curX, curY);
                } else if (action === 'moveBackward') {
                    const val = args[0] || 0;
                    const rad = (curAngle * Math.PI) / 180;
                    curX -= Math.cos(rad) * val;
                    curY -= Math.sin(rad) * val;
                    if (curPenDown) ctx.lineTo(curX, curY);
                    else ctx.moveTo(curX, curY);
                } else if (action === 'turnRight') {
                    curAngle += args[0] || 0;
                } else if (action === 'turnLeft') {
                    curAngle -= args[0] || 0;
                } else if (action === 'setHeading') {
                    curAngle = args[0] || 0;
                } else if (action === 'jumpTo') {
                    curX = canvas.width / 2 + (args[0] || 0);
                    curY = canvas.height / 2 - (args[1] || 0);
                    if (curPenDown) ctx.lineTo(curX, curY);
                    else ctx.moveTo(curX, curY);
                } else if (action === 'goToCenter') {
                    curX = canvas.width / 2;
                    curY = canvas.height / 2;
                    if (curPenDown) ctx.lineTo(curX, curY);
                    else ctx.moveTo(curX, curY);
                } else if (action === 'penUp') {
                    curPenDown = false;
                } else if (action === 'penDown') {
                    curPenDown = true;
                } else if (action === 'setColor') {
                    const color = args[0] || '#4facfe';
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.strokeStyle = color;
                    ctx.moveTo(curX, curY);
                } else if (action === 'setPenSize') {
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.lineWidth = args[0] || 3;
                    ctx.moveTo(curX, curY);
                } else if (action === 'clear') {
                    resetCanvas();
                } else if (action === 'setRandomColor') {
                    const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.strokeStyle = randomColor;
                    ctx.moveTo(curX, curY);
                } else if (action === 'drawCircle') {
                    const radius = args[0] || 50;
                    if (curPenDown) {
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.arc(curX, curY, radius, 0, 2 * Math.PI);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(curX, curY);
                    }
                } else if (action === 'drawPolygon') {
                    const sides = args[0] || 3;
                    const length = args[1] || 50;
                    if (curPenDown) {
                        const angleStep = (2 * Math.PI) / sides;
                        for (let i = 0; i < sides; i++) {
                            const rad = (curAngle * Math.PI) / 180;
                            curX += Math.cos(rad) * length;
                            curY += Math.sin(rad) * length;
                            ctx.lineTo(curX, curY);
                            curAngle += 360 / sides;
                        }
                    }
                }

                // Redraw instantly after command
                ctx.stroke();
                // Clear the whole canvas and redraw everything with marker? No, just redraw marker.
                // Wait, if we keep drawing the marker, it leaves a trail. 
                // We need to clear the whole canvas and replay? No, canvas is cumulative.
                // It's easier to just draw the lines, wait, and not draw the marker at every step unless we erase it.
            }

            if (onHighlight) onHighlight(null);
            drawMarker();
        };

        if (runSequence > 0) {
            runCommandsAsync();
        } else {
            resetCanvas();
            drawMarker();
        }
    }, [runSequence]);

    return (
        <div className="canvas-container">
            <canvas
                ref={canvasRef}
                width={800}
                style={{ border: '2px solid #dde1e6', background: '#fff', width: '100%', height: '100%' }}
            />
        </div>
    );
};

export default DrawingCanvas;
