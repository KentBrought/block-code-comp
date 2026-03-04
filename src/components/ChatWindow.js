import React, { useState } from 'react';

const ChatWindow = () => {
    const [messages, setMessages] = useState([
        { user: 'System', text: 'Welcome to Block-Code-Draw!' },
        { user: 'Player1', text: 'Is it a square?' }
    ]);
    const [input, setInput] = useState('');

    const sendMessage = (e) => {
        e.preventDefault();
        if (input.trim()) {
            setMessages([...messages, { user: 'You', text: input }]);
            setInput('');
        }
    };

    return (
        <div className="chat-window">
            <div className="messages">
                {messages.map((m, i) => (
                    <div key={i} className="message">
                        <strong>{m.user}:</strong> {m.text}
                    </div>
                ))}
            </div>
            <form onSubmit={sendMessage}>
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Guess or chat..."
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
};

export default ChatWindow;
