import React, { useState } from 'react';
import BlocklyEditor from './components/BlocklyEditor';
import DrawingCanvas from './components/DrawingCanvas';
import ChatWindow from './components/ChatWindow';
import './App.css';

function App() {
  const [commands, setCommands] = useState('');
  const [runSequence, setRunSequence] = useState(0);
  const [highlightBlockId, setHighlightBlockId] = useState(null);

  const handleRun = () => {
    setRunSequence(s => s + 1);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>
          <span className="title-block">Block</span>
          <span className="title-comma">,</span>{' '}
          <span className="title-code">Code</span>
          <span className="title-comma">,</span>{' '}
          <span className="title-draw">Draw!</span>
        </h1>
        <button className="run-button" onClick={handleRun}>
          <span className="run-icon">▶</span> Run
        </button>
      </header>
      <main className="main-layout">
        {/* Blockly covers both the toolbox sidebar and the open canvas workspace */}
        <section className="editor-section">
          <BlocklyEditor onCodeChange={setCommands} highlightBlockId={highlightBlockId} />
        </section>

        {/* Right column: Drawing canvas stacked above Chat */}
        <aside className="right-column">
          <section className="canvas-section">
            <DrawingCanvas
              commands={commands}
              runSequence={runSequence}
              onHighlight={setHighlightBlockId}
            />
          </section>
          <section className="chat-section">
            <ChatWindow />
          </section>
        </aside>
      </main>
    </div>
  );
}

export default App;
