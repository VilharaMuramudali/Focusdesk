import React, { useRef, useState, useEffect } from 'react';
import './Whiteboard.scss';

export default function Whiteboard({ socket, roomId, userId, onClose }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen'); // pen, eraser, line, rectangle, circle, text
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState(null);
  const contextRef = useRef(null);
  const startPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const container = canvas.parentElement;
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;

    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineJoin = 'round';
    contextRef.current = context;

    // Initial save
    saveToHistory();
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for remote drawing events
    socket.on('whiteboard-draw', ({ drawing }) => {
      if (drawing.userId !== userId) {
        drawRemote(drawing);
      }
    });

    socket.on('whiteboard-clear', () => {
      clearCanvas();
    });

    return () => {
      socket.off('whiteboard-draw');
      socket.off('whiteboard-clear');
    };
  }, [socket, userId]);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imageData = canvas.toDataURL();
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(imageData);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = () => {
    if (historyStep <= 0) return;
    
    const newStep = historyStep - 1;
    setHistoryStep(newStep);
    
    const canvas = canvasRef.current;
    const context = contextRef.current;
    const img = new Image();
    img.src = history[newStep];
    img.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0);
    };
  };

  const redo = () => {
    if (historyStep >= history.length - 1) return;
    
    const newStep = historyStep + 1;
    setHistoryStep(newStep);
    
    const canvas = canvasRef.current;
    const context = contextRef.current;
    const img = new Image();
    img.src = history[newStep];
    img.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0);
    };
  };

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    const pos = getMousePos(e);
    startPosRef.current = pos;

    if (tool === 'text') {
      setTextPosition(pos);
      return;
    }

    setIsDrawing(true);
    const context = contextRef.current;
    
    if (tool === 'pen' || tool === 'eraser') {
      context.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
      context.lineWidth = tool === 'eraser' ? lineWidth * 3 : lineWidth;
      context.beginPath();
      context.moveTo(pos.x, pos.y);
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const pos = getMousePos(e);
    const context = contextRef.current;

    if (tool === 'pen' || tool === 'eraser') {
      context.lineTo(pos.x, pos.y);
      context.stroke();

      // Emit drawing to other users
      if (socket) {
        socket.emit('whiteboard-draw', {
          roomId,
          drawing: {
            type: tool,
            from: startPosRef.current,
            to: pos,
            color: tool === 'eraser' ? '#ffffff' : color,
            lineWidth: tool === 'eraser' ? lineWidth * 3 : lineWidth,
            userId
          }
        });
      }
      
      startPosRef.current = pos;
    } else {
      // For shapes, show preview
      const canvas = canvasRef.current;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempContext = tempCanvas.getContext('2d');
      tempContext.drawImage(canvas, 0, 0);

      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Restore previous state
      if (history[historyStep]) {
        const img = new Image();
        img.src = history[historyStep];
        context.drawImage(img, 0, 0);
      }

      // Draw preview
      drawShape(context, tool, startPosRef.current, pos, color, lineWidth);
    }
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const pos = getMousePos(e);
    const context = contextRef.current;

    if (tool !== 'pen' && tool !== 'eraser') {
      drawShape(context, tool, startPosRef.current, pos, color, lineWidth);
      
      // Emit shape to other users
      if (socket) {
        socket.emit('whiteboard-draw', {
          roomId,
          drawing: {
            type: tool,
            from: startPosRef.current,
            to: pos,
            color,
            lineWidth,
            userId
          }
        });
      }
    }

    saveToHistory();
  };

  const drawShape = (context, shapeType, from, to, strokeColor, width) => {
    context.strokeStyle = strokeColor;
    context.lineWidth = width;
    context.beginPath();

    switch (shapeType) {
      case 'line':
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();
        break;

      case 'rectangle': {
        const rectWidth = to.x - from.x;
        const rectHeight = to.y - from.y;
        context.strokeRect(from.x, from.y, rectWidth, rectHeight);
        break;
      }

      case 'circle': {
        const radius = Math.sqrt(
          Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2)
        );
        context.arc(from.x, from.y, radius, 0, 2 * Math.PI);
        context.stroke();
        break;
      }

      default:
        break;
    }
  };

  const drawRemote = (drawing) => {
    const context = contextRef.current;
    if (!context) return;

    if (drawing.type === 'pen' || drawing.type === 'eraser') {
      context.strokeStyle = drawing.color;
      context.lineWidth = drawing.lineWidth;
      context.beginPath();
      context.moveTo(drawing.from.x, drawing.from.y);
      context.lineTo(drawing.to.x, drawing.to.y);
      context.stroke();
    } else {
      drawShape(context, drawing.type, drawing.from, drawing.to, drawing.color, drawing.lineWidth);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    context.clearRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  };

  const handleClear = () => {
    clearCanvas();
    if (socket) {
      socket.emit('whiteboard-clear', { roomId, userId });
    }
  };

  const addText = () => {
    if (!textInput.trim() || !textPosition) return;

    const context = contextRef.current;
    context.font = `${lineWidth * 8}px Arial`;
    context.fillStyle = color;
    context.fillText(textInput, textPosition.x, textPosition.y);

    if (socket) {
      socket.emit('whiteboard-draw', {
        roomId,
        drawing: {
          type: 'text',
          text: textInput,
          position: textPosition,
          color,
          fontSize: lineWidth * 8,
          userId
        }
      });
    }

    setTextInput('');
    setTextPosition(null);
    saveToHistory();
  };

  const downloadWhiteboard = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const colors = [
    '#000000', '#ff0000', '#00ff00', '#0000ff', 
    '#ffff00', '#ff00ff', '#00ffff', '#ffffff',
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#f7b731',
    '#5f27cd', '#00d2d3', '#ee5a6f', '#c44569'
  ];

  return (
    <div className="whiteboard-modal">
      <div className="whiteboard-container">
        <div className="whiteboard-header">
          <h4>📝 Collaborative Whiteboard</h4>
          <div className="header-actions">
            <button onClick={undo} disabled={historyStep <= 0} title="Undo">
              ↶
            </button>
            <button onClick={redo} disabled={historyStep >= history.length - 1} title="Redo">
              ↷
            </button>
            <button onClick={downloadWhiteboard} title="Download">
              💾
            </button>
            <button onClick={onClose} className="close-btn">✕</button>
          </div>
        </div>

        <div className="whiteboard-toolbar">
          <div className="tool-section">
            <label>Tool:</label>
            <div className="tool-buttons">
              <button 
                className={tool === 'pen' ? 'active' : ''} 
                onClick={() => setTool('pen')}
                title="Pen"
              >
                ✏️
              </button>
              <button 
                className={tool === 'eraser' ? 'active' : ''} 
                onClick={() => setTool('eraser')}
                title="Eraser"
              >
                🧹
              </button>
              <button 
                className={tool === 'line' ? 'active' : ''} 
                onClick={() => setTool('line')}
                title="Line"
              >
                📏
              </button>
              <button 
                className={tool === 'rectangle' ? 'active' : ''} 
                onClick={() => setTool('rectangle')}
                title="Rectangle"
              >
                ▭
              </button>
              <button 
                className={tool === 'circle' ? 'active' : ''} 
                onClick={() => setTool('circle')}
                title="Circle"
              >
                ⭕
              </button>
              <button 
                className={tool === 'text' ? 'active' : ''} 
                onClick={() => setTool('text')}
                title="Text"
              >
                T
              </button>
            </div>
          </div>

          <div className="tool-section">
            <label>Size:</label>
            <input 
              type="range" 
              min="1" 
              max="20" 
              value={lineWidth} 
              onChange={(e) => setLineWidth(parseInt(e.target.value))}
              className="size-slider"
            />
            <span className="size-value">{lineWidth}</span>
          </div>

          <div className="tool-section">
            <label>Color:</label>
            <div className="color-palette">
              {colors.map((c) => (
                <button
                  key={c}
                  className={`color-btn ${color === c ? 'active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  title={c}
                />
              ))}
            </div>
          </div>

          <div className="tool-section">
            <button onClick={handleClear} className="clear-btn">
              🗑️ Clear All
            </button>
          </div>
        </div>

        <div className="whiteboard-canvas-container">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="whiteboard-canvas"
          />
          
          {textPosition && (
            <div 
              className="text-input-overlay"
              style={{
                left: textPosition.x,
                top: textPosition.y
              }}
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addText()}
                placeholder="Type text..."
                autoFocus
              />
              <button onClick={addText}>✓</button>
              <button onClick={() => setTextPosition(null)}>✕</button>
            </div>
          )}
        </div>

        <div className="whiteboard-footer">
          <span className="participant-info">👥 Collaborative mode active</span>
          <span className="hint">💡 Tip: All participants can draw together in real-time</span>
        </div>
      </div>
    </div>
  );
}
