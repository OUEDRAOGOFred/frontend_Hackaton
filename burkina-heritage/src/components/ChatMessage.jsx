import './ChatMessage.css';

/**
 * Composant ChatMessage
 * Affiche un message dans la conversation (utilisateur ou IA)
 * 
 * Props:
 * - message: { id, text, sender, timestamp }
 */
function ChatMessage({ message }) {
  const isAI = message.sender === 'ai';
  
  return (
    <div className={`message ${isAI ? 'message-ai' : 'message-user'}`}>
      <div className="message-avatar">
        {isAI ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="10" rx="2"/>
            <circle cx="12" cy="5" r="2"/>
            <path d="M12 7v4M8 16h.01M16 16h.01"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        )}
      </div>
      <div className="message-content">
        <div className="message-header">
          <span className="message-sender">
            {isAI ? 'Assistant BurkinaHeritage' : 'Vous'}
          </span>
          <span className="message-time">{message.timestamp}</span>
        </div>
        <div className="message-text">
          {message.text}
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;
