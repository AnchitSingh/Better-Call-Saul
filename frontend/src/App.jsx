/**
 * @fileoverview Better Call Saul - Corporate Law Advisory Chat Interface
 * 
 * Main chat application component that provides an interactive interface for the
 * Better Call Saul multi-agent corporate formation advisory system. This component
 * handles real-time communication with the backend agent orchestrator and displays
 * streaming responses from tax, legal, and business strategy specialists.
 * 
 * Features:
 * - Session management with unique browser-scoped session IDs
 * - Real-time message streaming with markdown support
 * - Auto-scrolling chat interface
 * - Keyboard shortcuts for message submission
 * 
 * Backend Integration:
 * - Communicates with Google ADK-powered agent system via REST API
 * - Maintains session state across the conversation lifecycle
 */

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './App.css';

/**
 * App Component
 * 
 * Main application component that renders the chat interface and manages
 * communication with the Better Call Saul backend agent system.
 * 
 * @component
 * @returns {JSX.Element} The rendered chat application
 */
function App() {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  // Chat message history - array of {role: 'user'|'agent', text: string}
  const [messages, setMessages] = useState([]);
  
  // Current user input text in the textarea
  const [input, setInput] = useState('');
  
  // Loading state - true when waiting for agent response
  const [loading, setLoading] = useState(false);
  
  // Unique session identifier for this conversation thread
  const [sessionId, setSessionId] = useState(null);
  
  // Reference to scroll container for auto-scrolling to latest message
  const messagesEndRef = useRef(null);

  // Backend API endpoint (Cloud Run deployment)
  const BACKEND_URL = 'https://better-call-saul-backend-139206786021.us-central1.run.app';

  // ============================================================================
  // SIDE EFFECTS
  // ============================================================================

  /**
   * Auto-scroll Effect
   * Scrolls the chat window to the bottom whenever new messages are added
   * to ensure the latest message is always visible.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Session Initialization Effect
   * Creates a new session on component mount by generating a unique session ID
   * and registering it with the backend. This session persists for the lifetime
   * of the browser tab and maintains conversation context.
   */
  useEffect(() => {
    const initSession = async () => {
      // Generate a unique session ID for this browser session
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        // Create session on backend with empty initial state
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

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Send Message Handler
   * 
   * Sends the user's message to the backend agent system and processes the response.
   * This function:
   * 1. Validates input and session state
   * 2. Adds user message to chat UI immediately
   * 3. Calls backend /run endpoint with message payload
   * 4. Parses streaming response events and extracts agent text
   * 5. Displays agent response in chat UI
   * 6. Handles errors with user-friendly messages
   * 
   * @async
   * @function
   */
  const sendMessage = async () => {
    // Validation: ensure input exists, not loading, and session is initialized
    if (!input.trim() || loading || !sessionId) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message to chat immediately for responsive UX
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      // Send message to backend agent orchestrator
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
      
      // Extract text from the response events (multi-agent responses)
      // The backend returns an array of events, each potentially containing content parts
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

      // Add agent response to chat UI
      if (agentText) {
        setMessages(prev => [...prev, { role: 'agent', text: agentText }]);
      } else {
        // Fallback message if no text was extracted
        setMessages(prev => [...prev, { 
          role: 'agent', 
          text: 'Sorry, I couldn\'t generate a response. Please try again.' 
        }]);
      }

    } catch (error) {
      console.error('Error:', error);
      // Display user-friendly error message in chat
      setMessages(prev => [...prev, { 
        role: 'agent', 
        text: `Error: ${error.message}. Please refresh and try again.` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Keyboard Event Handler
   * 
   * Enables Enter key to send messages (Shift+Enter for new line).
   * Prevents default form submission behavior.
   * 
   * @param {KeyboardEvent} e - The keyboard event object
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="app">
      <div className="chat-container">
        {/* Header Section - App branding and description */}
        <div className="chat-header">
          <h1>Better Call Saul</h1>
          <p>Corporate Law Advisory Squad</p>
        </div>

        {/* Messages Section - Chat history and welcome screen */}
        <div className="chat-messages">
          {/* Welcome screen - displayed when no messages exist */}
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

          {/* Message history - renders all user and agent messages */}
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                <div className="message-text">
                  {/* User messages: plain text | Agent messages: markdown-rendered */}
                  {msg.role === 'user' ? (
                    msg.text
                  ) : (
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator - animated typing dots while waiting for response */}
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

          {/* Scroll anchor - invisible div that we scroll to for auto-scroll behavior */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Section - Message composition area */}
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
