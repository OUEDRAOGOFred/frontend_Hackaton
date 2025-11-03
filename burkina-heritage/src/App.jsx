import { useState, useEffect } from 'react';
import ChatMessage from './components/ChatMessage';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  // État pour la sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  
  // État pour les conversations
  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem('burkina_conversations');
    return saved ? JSON.parse(saved) : [{
      id: 1,
      title: 'Nouvelle conversation',
      date: new Date().toLocaleDateString('fr-FR'),
      messages: [
        {
          id: 1,
          text: "Bienvenue sur BurkinaHeritage ! Je suis votre assistant culturel. Posez-moi des questions sur l'histoire, les traditions et le patrimoine du Burkina Faso.",
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        }
      ]
    }];
  });
  
  const [currentConversationId, setCurrentConversationId] = useState(1);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Obtenir la conversation actuelle
  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const messages = currentConversation ? currentConversation.messages : [];

  // Sauvegarder les conversations dans localStorage
  useEffect(() => {
    localStorage.setItem('burkina_conversations', JSON.stringify(conversations));
  }, [conversations]);

  // Créer une nouvelle conversation
  const handleNewChat = () => {
    const newConv = {
      id: Date.now(),
      title: 'Nouvelle conversation',
      date: new Date().toLocaleDateString('fr-FR'),
      messages: [
        {
          id: Date.now() + 1,
          text: "Bienvenue sur BurkinaHeritage ! Je suis votre assistant culturel. Posez-moi des questions sur l'histoire, les traditions et le patrimoine du Burkina Faso.",
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
    
    setConversations(prev => [newConv, ...prev]);
    setCurrentConversationId(newConv.id);
    
    // Fermer la sidebar sur mobile
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  // Sélectionner une conversation
  const handleSelectConversation = (id) => {
    setCurrentConversationId(id);
    
    // Fermer la sidebar sur mobile
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  // Supprimer une conversation
  const handleDeleteConversation = (id) => {
    if (conversations.length === 1) {
      alert("Vous devez avoir au moins une conversation !");
      return;
    }
    
    const newConversations = conversations.filter(c => c.id !== id);
    setConversations(newConversations);
    
    // Si on supprime la conversation active, basculer vers la première
    if (id === currentConversationId) {
      setCurrentConversationId(newConversations[0].id);
    }
  };

  // Mettre à jour le titre de la conversation basé sur le premier message
  const updateConversationTitle = (conversationId, firstMessage) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId && conv.title === 'Nouvelle conversation') {
        return {
          ...conv,
          title: firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : '')
        };
      }
      return conv;
    }));
  };

  // Fonction pour envoyer un message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (inputValue.trim() === '') return;

    // Ajouter le message utilisateur
    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    // Mettre à jour la conversation avec le nouveau message
    setConversations(prev => prev.map(conv => {
      if (conv.id === currentConversationId) {
        const updatedMessages = [...conv.messages, userMessage];
        
        // Mettre à jour le titre si c'est le premier message utilisateur
        if (conv.title === 'Nouvelle conversation' && conv.messages.length === 1) {
          updateConversationTitle(conv.id, currentInput);
        }
        
        return { ...conv, messages: updatedMessages };
      }
      return conv;
    }));

    // Simuler la réponse de l'IA (à remplacer par l'appel API FastAPI)
    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        text: "Merci pour votre question ! Notre système RAG est en cours de traitement de votre demande sur la culture burkinabè. (Cette réponse sera générée par l'IA une fois l'API connectée)",
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };
      
      // Ajouter la réponse IA à la conversation
      setConversations(prev => prev.map(conv => {
        if (conv.id === currentConversationId) {
          return { ...conv, messages: [...conv.messages, aiMessage] };
        }
        return conv;
      }));
      
      setIsLoading(false);
    }, 1500);
  };

  // Fonction pour effacer la conversation actuelle
  const handleClearChat = () => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === currentConversationId) {
        return {
          ...conv,
          title: 'Nouvelle conversation',
          messages: [
            {
              id: Date.now(),
              text: "Bienvenue sur BurkinaHeritage ! Je suis votre assistant culturel. Posez-moi des questions sur l'histoire, les traditions et le patrimoine du Burkina Faso.",
              sender: 'ai',
              timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            }
          ]
        };
      }
      return conv;
    }));
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="app-wrapper">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
      />

      {/* Contenu principal */}
      <div className={`main-content ${isSidebarOpen ? 'with-sidebar' : ''}`}>
        {/* Header avec design culturel */}
        <header className="header">
          <button className="menu-toggle-btn" onClick={toggleSidebar} title="Menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          </button>
          <div className="header-pattern"></div>
          <div className="header-content">
            <div className="logo">
              <div className="logo-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                  <path d="M6 9h12"/>
                  <path d="M7 6h10"/>
                </svg>
              </div>
              <div className="logo-text">
                <h1>BurkinaHeritage</h1>
                <p className="subtitle">Assistant Culturel du Burkina Faso</p>
              </div>
            </div>
            <p className="tagline">
              Découvrez l'histoire, les traditions et les savoirs du pays des hommes intègres
            </p>
          </div>
        </header>

        {/* Zone principale de chat */}
        <main className="chat-container">
          <div className="chat-header">
            <div className="chat-info">
              <span className="status-indicator"></span>
              <span>Assistant en ligne</span>
            </div>
            <button 
              className="clear-btn" 
              onClick={handleClearChat}
              title="Effacer la conversation"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              <span>Effacer</span>
            </button>
          </div>

          <div className="messages-container">
            {messages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message}
              />
            ))}
            
            {isLoading && (
              <div className="loading-message">
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <p>L'IA réfléchit...</p>
              </div>
            )}
          </div>

          {/* Zone d'entrée utilisateur */}
          <form className="input-container" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="chat-input"
              placeholder="Posez votre question sur la culture burkinabè..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className="send-btn"
              disabled={isLoading || inputValue.trim() === ''}
            >
              <span>Envoyer</span>
              <span className="send-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m22 2-7 20-4-9-9-4Z"/>
                  <path d="M22 2 11 13"/>
                </svg>
              </span>
            </button>
          </form>
        </main>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <p>
              Propulsé par un système RAG 100% open source
            </p>
            <p className="copyright">
              BurkinaHeritage © 2025 • Hackathon IA & Culture
            </p>
          </div>
        </footer>

        {/* Section À propos (affichable via toggle) */}
        <div className="about-section">
          <details>
            <summary>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4M12 8h.01"/>
              </svg>
              À propos de BurkinaHeritage
            </summary>
            <div className="about-content">
              <p>
                <strong>BurkinaHeritage</strong> est un assistant culturel open source qui valorise 
                le patrimoine immatériel et historique des régions du Burkina Faso.
              </p>
              <p>
                Grâce à un système RAG (Retrieval-Augmented Generation), nous combinons 
                l'intelligence artificielle avec des sources documentaires fiables pour 
                vous offrir des réponses précises sur la culture burkinabè.
              </p>
              <ul>
                <li>🌍 Histoire des 13 régions</li>
                <li>🎭 Traditions et coutumes</li>
                <li>🎨 Art et artisanat local</li>
                <li>🗣️ Langues et sagesses populaires</li>
              </ul>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

export default App;
