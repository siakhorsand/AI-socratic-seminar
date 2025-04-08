import React, { useState, useRef, useEffect } from 'react';
import './App.css';

// Organized personas by categories
const PERSONA_CATEGORIES = {
  philosophers: {
    name: "Philosophers",
    personas: [
      { id: "socrates", name: "Socrates", description: "Ancient Greek philosopher known for the Socratic method" },
      { id: "nietzsche", name: "Nietzsche", description: "German philosopher exploring existentialism and morality" },
      { id: "simone_de_beauvoir", name: "Simone de Beauvoir", description: "Existentialist philosopher and feminist theorist" },
      { id: "alan_watts", name: "Alan Watts", description: "Philosopher known for interpreting Eastern wisdom" }
    ]
  },
  scientists: {
    name: "Scientists",
    personas: [
      { id: "einstein", name: "Einstein", description: "Revolutionary physicist and theoretical thinker" },
      { id: "feynman", name: "Feynman", description: "Quantum physicist and exceptional educator" },
      { id: "darwin", name: "Darwin", description: "Naturalist who developed evolution theory" },
      { id: "newton", name: "Newton", description: "Physicist who established classical mechanics" }
    ]
  },
  innovators: {
    name: "Innovators",
    personas: [
      { id: "steve_jobs", name: "Steve Jobs", description: "Visionary tech entrepreneur and design thinker" },
      { id: "sam_altman", name: "Sam Altman", description: "AI pioneer and startup ecosystem builder" },
      { id: "visionary", name: "The Visionary", description: "Forward-thinking innovator and strategist" }
    ]
  },
  experts: {
    name: "Domain Experts",
    personas: [
      { id: "data_scientist", name: "Data Scientist", description: "Expert in data analysis and ML" },
      { id: "financial_expert", name: "Financial Expert", description: "Specialist in economics and markets" },
      { id: "business_analyst", name: "Business Analyst", description: "Strategic business insights expert" },
      { id: "market_strategist", name: "Market Strategist", description: "Expert in market dynamics" },
      { id: "expert", name: "Domain Expert", description: "Specialized knowledge authority" }
    ]
  },
  archetypes: {
    name: "Archetypes",
    personas: [
      { id: "mythical_sage", name: "Mythical Sage", description: "Ancient wisdom keeper" },
      { id: "fantasy_wizard", name: "Fantasy Wizard", description: "Master of mystical knowledge" },
      { id: "legendary_warrior", name: "Legendary Warrior", description: "Strategic combat master" },
      { id: "superhero", name: "Superhero", description: "Inspiring force for good" },
      { id: "devil_advocate", name: "Devil's Advocate", description: "Critical perspective challenger" },
      { id: "idealist", name: "The Idealist", description: "Optimistic visionary thinker" },
      { id: "scorpio", name: "Scorpio", description: "Deep analytical investigator" }
    ]
  }
};

function App() {
  const [selectedPersonas, setSelectedPersonas] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState([]);
  const [autoDebate, setAutoDebate] = useState(false);
  const [maxRounds, setMaxRounds] = useState(3);
  const [animatingText, setAnimatingText] = useState(false);
  const messagesEndRef = useRef(null);
  const [showPersonasBin, setShowPersonasBin] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [directMentionTo, setDirectMentionTo] = useState(null);
  const inputRef = useRef(null);
  const mentionDropdownRef = useRef(null);

  const toggleCategory = (categoryId) => {
    if (expandedCategories.includes(categoryId)) {
      setExpandedCategories(prev => prev.filter(id => id !== categoryId));
    } else {
      setExpandedCategories(prev => [...prev, categoryId]);
    }
  };

  const togglePersona = (personaId) => {
    setSelectedPersonas(prev => 
      prev.includes(personaId)
        ? prev.filter(id => id !== personaId)
        : [...prev, personaId]
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add a new effect to ensure the input stays visible when the keyboard appears on mobile
  useEffect(() => {
    const handleResize = () => {
      // Force scroll to bottom when window resizes (handles mobile keyboard)
      if (window.innerHeight < window.outerHeight) {
        scrollToBottom();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Function to detect which agent a message is replying to
  const detectReplyTarget = (content, personaId, allMessages) => {
    if (!content || allMessages.length < 2) return null;
    
    // Get previous agent messages
    const previousAgentMessages = allMessages
      .filter(m => m.type === 'persona' && m.personaId !== personaId)
      .map(m => ({
        personaId: m.personaId,
        name: getPersonaName(m.personaId),
        nameLower: getPersonaName(m.personaId).toLowerCase(),
        message: m,
        index: allMessages.indexOf(m)
      }));
    
    // Skip if no previous messages to respond to
    if (previousAgentMessages.length === 0) return null;
    
    // Check for direct references to another agent in the first two sentences
    const firstTwoSentences = content.split(/[.!?]\s+/).slice(0, 2).join(". ") + ".";
    
    // Check for explicit reply patterns like "Replying to X" or "In response to X"
    const replyPatterns = [
      /replying\s+to\s+(\w+)/i,
      /in\s+response\s+to\s+(\w+)/i,
      /addressing\s+(\w+)/i,
      /to\s+answer\s+(\w+)/i,
    ];
    
    for (const pattern of replyPatterns) {
      const match = firstTwoSentences.match(pattern);
      if (match && match[1]) {
        const mentionedName = match[1].toLowerCase();
        // Find agent that matches this mention
        const matchedAgent = previousAgentMessages.find(agent => 
          agent.nameLower.toLowerCase().includes(mentionedName) || 
          agent.personaId.toLowerCase().includes(mentionedName)
        );
        if (matchedAgent) return matchedAgent.index;
      }
    }
    
    for (const prevAgent of previousAgentMessages.reverse()) { // Check most recent first
      // Check for direct name mentions
      if (
        firstTwoSentences.includes(prevAgent.name) || 
        firstTwoSentences.toLowerCase().includes(prevAgent.nameLower)
      ) {
        return prevAgent.index;
      }
      
      // Check for ID mentions (like "Socrates" for "socrates")
      const readableId = prevAgent.personaId.replace(/_/g, ' ');
      if (
        firstTwoSentences.includes(readableId) || 
        firstTwoSentences.toLowerCase().includes(readableId.toLowerCase())
      ) {
        return prevAgent.index;
      }
    }
    
    // If we've gone through multiple rounds and this is the first message in a new round,
    // assume it's replying to the last message from the previous round
    if (autoDebate && previousAgentMessages.length > 0) {
      return previousAgentMessages[0].index; // Most recent previous agent message
    }
    
    return null;
  };

  // Handle @ mentions
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputText(value);
    
    // Check for @ mentions
    const lastAtSymbolIndex = value.lastIndexOf('@');
    if (lastAtSymbolIndex !== -1 && (lastAtSymbolIndex === 0 || value[lastAtSymbolIndex - 1] === ' ')) {
      const cursorPosition = e.target.selectionStart;
      if (cursorPosition > lastAtSymbolIndex) {
        const searchText = value.substring(lastAtSymbolIndex + 1, cursorPosition);
        setMentionSearch(searchText);
        
        // Calculate position for dropdown
        const inputRect = inputRef.current.getBoundingClientRect();
        const textWidth = getTextWidth(value.substring(0, lastAtSymbolIndex), getComputedStyle(inputRef.current).font);
        
        setMentionPosition({
          top: inputRect.top - 5,
          left: inputRect.left + textWidth + 5
        });
        
        setShowMentionDropdown(true);
      }
    } else {
      setShowMentionDropdown(false);
    }
  };
  
  // Helper to calculate text width
  const getTextWidth = (text, font) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = font;
    return context.measureText(text).width;
  };
  
  // Handle selecting a persona from mention dropdown
  const selectMention = (personaId) => {
    const lastAtSymbolIndex = inputText.lastIndexOf('@');
    const beforeMention = inputText.substring(0, lastAtSymbolIndex);
    const afterMention = inputText.substring(inputRef.current.selectionStart);
    const personaName = getPersonaName(personaId);
    
    setInputText(`${beforeMention}@${personaName} ${afterMention}`);
    setShowMentionDropdown(false);
    setDirectMentionTo(personaId);
    
    // Focus and move cursor after the inserted mention
    setTimeout(() => {
      inputRef.current.focus();
      const newCursorPosition = beforeMention.length + personaName.length + 2; // +2 for @ and space
      inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };
  
  // Close mention dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mentionDropdownRef.current && !mentionDropdownRef.current.contains(event.target)) {
        setShowMentionDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || selectedPersonas.length === 0 || isLoading || animatingText) return;

    setIsLoading(true);
    
    try {
      // Add the user message immediately
      const userMessage = { type: 'user', content: inputText };
      setMessages(prev => [...prev, userMessage]);
      
      // Clear input immediately after submitting
      setInputText('');

      // Determine which agents should respond based on direct mention
      let agentsToUse = selectedPersonas;
      
      // If there's a direct mention, prioritize that agent first
      if (directMentionTo && selectedPersonas.includes(directMentionTo)) {
        // Move the mentioned agent to the front of the array
        agentsToUse = [directMentionTo, ...selectedPersonas.filter(id => id !== directMentionTo)];
      }

      // Get responses from each selected persona
      const response = await fetch('http://localhost:8002/seminar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: inputText,
          agent_ids: agentsToUse,
          conversation_id: messages.length > 0 ? messages[0].conversationId : undefined,
          auto_conversation: autoDebate,
          max_rounds: maxRounds,
          direct_mention: directMentionTo // Pass direct mention to backend
        }),
        timeout: 60000 // 60 second timeout
      });

      // Reset direct mention after submission
      setDirectMentionTo(null);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received data:', data); // Log the response data
      
      // Map responses to message objects
      const personaResponses = data.answers.map(answer => ({
        type: answer.agent === 'system' ? 'system' : 'persona',
        personaId: answer.agent,
        content: answer.response,
        timestamp: new Date().toISOString(),
        conversationId: data.conversation_id,
        displayedContent: '', // Initialize with empty string for animation
        fullContent: answer.response // Store the full content
      }));
      
      // Add responses one by one with animation
      setAnimatingText(true);
      
      let updatedMessages = [...messages, userMessage];
      
      for (let i = 0; i < personaResponses.length; i++) {
        const response = personaResponses[i];
        
        // Determine if this message is replying to another agent
        const replyToMessage = response.type === 'persona' 
          ? detectReplyTarget(response.fullContent, response.personaId, updatedMessages)
          : null;
        
        // Add initial response with empty content
        const newMessage = {
          ...response,
          displayedContent: '',
          isAnimating: true,
          replyTo: replyToMessage
        };
        
        updatedMessages.push(newMessage);
        setMessages([...updatedMessages]);
        scrollToBottom(); // Ensure we scroll as new messages are added
        
        // Animate the text
        const text = response.fullContent;
        let displayedText = '';
        
        for (let j = 0; j < text.length; j++) {
          // Add one character at a time
          displayedText += text[j];
          
          updatedMessages[updatedMessages.length - 1] = {
            ...updatedMessages[updatedMessages.length - 1],
            displayedContent: displayedText
          };
          
          setMessages([...updatedMessages]);
          
          // Only scroll periodically during animation to avoid jerky scrolling
          if (j % 20 === 0) scrollToBottom();
          
          // Delay between each character (faster for system messages)
          await new Promise(resolve => setTimeout(resolve, 
            response.type === 'system' ? 10 : 20
          ));
        }
        
        // Mark animation as complete for this message
        updatedMessages[updatedMessages.length - 1] = {
          ...updatedMessages[updatedMessages.length - 1],
          isAnimating: false
        };
        
        setMessages([...updatedMessages]);
        scrollToBottom(); // Final scroll once message is complete
        
        // Delay between each message
        if (i < personaResponses.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      setAnimatingText(false);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      // Add error message to chat
      setMessages(prev => [...prev, {
        type: 'system',
        content: 'Sorry, there was an error getting responses. Please try again.',
        displayedContent: 'Sorry, there was an error getting responses. Please try again.',
        timestamp: new Date().toISOString(),
        error: true
      }]);
      setAnimatingText(false);
    } finally {
      setIsLoading(false);
      scrollToBottom(); // Ensure we're scrolled to bottom after everything
    }
  };

  // Get persona name by ID
  const getPersonaName = (personaId) => {
    const persona = Object.values(PERSONA_CATEGORIES)
      .flatMap(category => category.personas)
      .find(p => p.id === personaId);
    return persona ? persona.name : personaId;
  };

  // Toggle personas bin
  const togglePersonasBin = () => {
    setShowPersonasBin(!showPersonasBin);
  };

  // Get filtered mention suggestions based on search text
  const getMentionSuggestions = () => {
    if (!mentionSearch) return selectedPersonas;
    
    return selectedPersonas.filter(personaId => 
      getPersonaName(personaId).toLowerCase().includes(mentionSearch.toLowerCase())
    );
  };

  return (
    <div className="app-container">
      <div className="glass-panel">
        <header className="app-header">
          <h1>AI Socratic Seminar</h1>
          <div className="selected-personas">
            {selectedPersonas.map(personaId => (
              <div key={personaId} className="selected-persona">
                <div className="persona-initial">
                  {getPersonaName(personaId).charAt(0)}
                </div>
                <span className="selected-persona-name">{getPersonaName(personaId)}</span>
                <button 
                  className="remove-persona" 
                  onClick={() => togglePersona(personaId)}
                  aria-label={`Remove ${getPersonaName(personaId)}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </header>

        <main className="chat-container">
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="welcome-message">
                <h2>Welcome to the AI Socratic Seminar</h2>
                <p>Select personas from the categories above and ask a question to begin the dialogue</p>
                {autoDebate && (
                  <p className="auto-debate-info">
                    <strong>Debate Mode is active.</strong> After your question, the selected personas will engage in a multi-round discussion with each other.
                  </p>
                )}
              </div>
            ) : (
              <div className="messages-list">
                {messages.map((message, index) => {
                  // Determine if this message is being replied to by the next message
                  const isRepliedTo = messages.some((m, i) => i > index && m.replyTo === index);
                  
                  return (
                    <div 
                      key={index} 
                      className={`message ${
                        message.type === 'user' 
                          ? 'user-message' 
                          : message.type === 'system' 
                            ? 'system-message' 
                            : 'persona-message'
                      } ${message.replyTo !== undefined && message.replyTo !== null ? 'reply-message' : ''}
                      ${isRepliedTo ? 'is-replied-to' : ''}`}
                    >
                      {message.replyTo !== undefined && message.replyTo !== null && (
                        <div className="reply-indicator">
                          <div className="reply-line"></div>
                          <div className="reply-to">
                            <span className="reply-icon">↩</span>
                            Replying to {getPersonaName(messages[message.replyTo].personaId)}
                          </div>
                        </div>
                      )}
                      
                      {message.type === 'persona' && (
                        <div className="message-header">
                          <div className="persona-initial">
                            {getPersonaName(message.personaId).charAt(0)}
                          </div>
                          <span className="persona-name">
                            {getPersonaName(message.personaId)}
                          </span>
                        </div>
                      )}
                      {message.type === 'system' && (
                        <div className="message-header">
                          <div className="system-indicator">i</div>
                          <span className="system-label">System</span>
                        </div>
                      )}
                      <div className="message-content">
                        {message.displayedContent !== undefined ? message.displayedContent : message.content}
                        {message.isAnimating && <span className="cursor-blink">|</span>}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="input-container">
            <div className="input-options">
              <div className="debate-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={autoDebate}
                    onChange={() => setAutoDebate(!autoDebate)}
                    className="toggle-input"
                  />
                  <span className="toggle-switch"></span>
                  <span className="toggle-text">Auto-Debate</span>
                </label>
              </div>
              
              {autoDebate && (
                <div className="rounds-selector">
                  <label>
                    Rounds:
                    <select 
                      value={maxRounds} 
                      onChange={(e) => setMaxRounds(Number(e.target.value))}
                      className="rounds-select"
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                    </select>
                  </label>
                </div>
              )}
            </div>
            
            <form className="input-form" onSubmit={handleSubmit}>
              <textarea
                ref={inputRef}
                className="input-control"
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder={autoDebate 
                  ? "Type @ to mention a specific persona..." 
                  : "Ask a philosophical question..."}
                disabled={isLoading || animatingText}
                rows="1"
              />
              <button
                type="submit"
                className="button button-primary"
                disabled={isLoading || animatingText || !inputText.trim() || selectedPersonas.length === 0}
              >
                <span className="button-text">{isLoading ? 'Thinking...' : animatingText ? 'Typing...' : 'Send'}</span>
                <span className="button-icon">➤</span>
              </button>
            </form>
          </div>
        </main>
      </div>

      {/* Floating Button for Personas Bin */}
      <button 
        className="floating-button"
        onClick={togglePersonasBin}
        title="Select Personas"
        aria-label="Open personas selection"
      >
        <span className="floating-button-icon">
          <svg width="14" height="24" viewBox="0 0 14 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.999999 1L13 12L1 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>

      {/* Personas Bin */}
      <div className={`personas-bin ${showPersonasBin ? 'show' : ''}`}>
        <div className="personas-bin-header">
          <h3>Select Personas</h3>
          <button 
            className="close-bin" 
            onClick={togglePersonasBin}
            aria-label="Close personas selection"
          >
            ×
          </button>
        </div>
        <div className="categories-container">
          {Object.keys(PERSONA_CATEGORIES).map(categoryId => {
            const category = PERSONA_CATEGORIES[categoryId];
            return (
              <div key={categoryId} className="category-section">
                <button
                  className={`category-button ${expandedCategories.includes(categoryId) ? 'expanded' : ''}`}
                  onClick={() => toggleCategory(categoryId)}
                  aria-expanded={expandedCategories.includes(categoryId)}
                >
                  <span className="category-name">{category.name}</span>
                  <span className="category-arrow"></span>
                </button>
                <div className={`persona-list ${expandedCategories.includes(categoryId) ? 'expanded' : ''}`}>
                  {category.personas.map(persona => (
                    <button
                      key={persona.id}
                      className={`persona-button ${selectedPersonas.includes(persona.id) ? 'selected' : ''}`}
                      onClick={() => togglePersona(persona.id)}
                      aria-pressed={selectedPersonas.includes(persona.id)}
                    >
                      <div className="persona-initial">
                        {persona.name.charAt(0)}
                      </div>
                      <div className="persona-info">
                        <span className="persona-name">{persona.name}</span>
                        <span className="persona-description">{persona.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mention Dropdown */}
      {showMentionDropdown && (
        <div 
          className="mention-dropdown"
          ref={mentionDropdownRef}
          style={{
            top: mentionPosition.top + 'px',
            left: mentionPosition.left + 'px'
          }}
        >
          {getMentionSuggestions().length > 0 ? (
            getMentionSuggestions().map(personaId => (
              <div 
                key={personaId} 
                className="mention-item"
                onClick={() => selectMention(personaId)}
              >
                <div className="mention-initial">
                  {getPersonaName(personaId).charAt(0)}
                </div>
                <span className="mention-name">
                  {getPersonaName(personaId)}
                </span>
              </div>
            ))
          ) : (
            <div className="mention-empty">No matching personas</div>
          )}
        </div>
      )}
    </div>
  );
}

export default App; 