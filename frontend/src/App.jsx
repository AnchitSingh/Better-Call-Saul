import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  const BACKEND_URL = 'https://better-call-saul-backend-139206786021.us-central1.run.app';

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Create or restore session on mount
  useEffect(() => {
    const initSession = async () => {
      // Generate a unique session ID for this browser session
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        // Create session on backend
        const response = await fetch(
          `${BACKEND_URL}/apps/corporate_law_squad/users/user_123/sessions/${newSessionId}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: {} })
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSessionId(data.id);
          console.log('Session created:', data.id);
        } else {
          console.error('Failed to create session:', await response.text());
        }
      } catch (error) {
        console.error('Error creating session:', error);
      }
    };

    initSession();
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading || !sessionId) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const runResponse = await fetch(`${BACKEND_URL}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_name: 'corporate_law_squad',
          user_id: 'user_123',
          session_id: sessionId,
          new_message: {
            role: 'user',
            parts: [{ text: userMessage }]
          }
        })
      });

      if (!runResponse.ok) {
        throw new Error(`Backend error: ${runResponse.status}`);
      }

      const data = await runResponse.json();
      
      // Extract text from the response events
      let agentText = '';
      if (Array.isArray(data)) {
        for (const event of data) {
          if (event.content && event.content.parts) {
            for (const part of event.content.parts) {
              if (part.text) {
                agentText += part.text;
              }
            }
          }
        }
      }

      // Add agent response to chat
      if (agentText) {
        setMessages(prev => [...prev, { role: 'agent', text: agentText }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'agent', 
          text: 'Sorry, I couldn\'t generate a response. Please try again.' 
        }]);
      }

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'agent', 
        text: `Error: ${error.message}. Please refresh and try again.` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="app">
      <div className="chat-container">
        <div className="chat-header">
          <h1>Better Call Saul</h1>
          <p>Corporate Law Advisory Squad</p>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="welcome-message">
              <h2>👔 Welcome to Better Call Saul!</h2>
              <p>Get expert advice on corporate formation from our team of specialists:</p>
              <ul>
                <li>🧮 Tax CPA - Tax strategy & savings</li>
                <li>⚖️ Corporate Attorney - Legal structure & compliance</li>
                <li>📈 Business Strategist - Growth & operations</li>
              </ul>
              <p className="example">
                <strong>Try asking:</strong> "I want to start a $500K SaaS company with 2 co-founders. What entity should I choose?"
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                <div className="message-text">
                  {msg.role === 'user' ? (
                    msg.text
                  ) : (
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="message agent">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          <textarea
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={sessionId ? "Describe your business situation..." : "Connecting to backend..."}
            disabled={loading || !sessionId}
            rows="3"
          />
          <button 
            className="send-button" 
            onClick={sendMessage}
            disabled={loading || !input.trim() || !sessionId}
          >
            {loading ? '⏳' : '📤'} Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;