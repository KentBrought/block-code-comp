import React, { useState } from 'react';
import BlocklyEditor from './components/BlocklyEditor';
import DrawingCanvas from './components/DrawingCanvas';
import ChatWindow from './components/ChatWindow';
import './App.css';

function App() {
  const [commands, setCommands] = useState('');

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Block-Code-Draw</h1>
      </header>
      <main className="main-layout">
        <section className="editor-section">
          <BlocklyEditor onCodeChange={setCommands} />
        </section>
        <section className="canvas-section">
          <DrawingCanvas commands={commands} />
        </section>
        <section className="chat-section">
          <ChatWindow />
        </section>
      </main>
    </div>
  );
}

export default App;
