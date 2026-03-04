import React, { useRef, useEffect } from 'react';

const DrawingCanvas = ({ commands }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw grid
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

            let curX = canvas.width / 2;
            let curY = canvas.height / 2;
            let curAngle = 0;
            let curPenDown = true;

            ctx.moveTo(curX, curY);

            const commandList = commands.split('\n');
            commandList.forEach(cmd => {
                if (!cmd) return;
                const parts = cmd.trim().split('(');
                const action = parts[0];
                const val = parts[1] ? parseFloat(parts[1].replace(')', '')) : 0;

                if (action === 'moveForward') {
                    const rad = (curAngle * Math.PI) / 180;
                    curX += Math.cos(rad) * val;
                    curY += Math.sin(rad) * val;
                    if (curPenDown) ctx.lineTo(curX, curY);
                    else ctx.moveTo(curX, curY);
                } else if (action === 'turnRight') {
                    curAngle += val;
                } else if (action === 'turnLeft') {
                    curAngle -= val;
                } else if (action === 'penUp') {
                    curPenDown = false;
                } else if (action === 'penDown') {
                    curPenDown = true;
                } else if (action === 'setColor') {
                    const colorParts = parts[1].split("'");
                    const color = colorParts[1] || '#4facfe';
                    ctx.stroke(); // Stroke current path before changing color
                    ctx.beginPath();
                    ctx.strokeStyle = color;
                    ctx.moveTo(curX, curY);
                }
            });
            ctx.stroke();

            // Draw marker (arrow)
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

        render();
    }, [commands]);

    return (
        <div className="canvas-container">
            <canvas
                ref={canvasRef}
                width={800}
                height={600}
                style={{ border: '2px solid #555', background: '#fff' }}
            />
        </div>
    );
};

export default DrawingCanvas;
