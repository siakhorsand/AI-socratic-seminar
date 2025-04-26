import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import AgentSelector from './components/AgentSelector';
import { isAuthenticated, getCurrentUser, logout, apiCall } from './utils/auth';

// Remove old PERSONA_CATEGORIES and AGENT_PROMPTS...

function generateFallbackResponse(question, personaIds) {
  return personaIds.map(personaId => {
    const personaName = personaId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return {
      agent: personaId,
      response: `[Note: This is a fallback response generated client-side due to API issues]\n\nAs ${personaName}, I would respond to your question, but the backend service appears to be unavailable right now. Please try again in a few moments as the server might be starting up or under maintenance.`,
      model: "fallback"
    };
  });
}

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
  const [conversationId, setConversationId] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [hasMessages, setHasMessages] = useState(false);
  const personasBinRef = useRef(null);
  const [agentQuestionTarget, setAgentQuestionTarget] = useState(null);
  const chatContainerRef = useRef(null);
  const mentionDropdownRef = useRef(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [showRoundsChooser, setShowRoundsChooser] = useState(false);
  const [showAgentSelector, setShowAgentSelector] = useState(false);

  // Initialize conversation ID and check authentication status
  useEffect(() => {
    if (!conversationId) {
      setConversationId(generateUUID());
    }
    
    // Check if user is logged in
    const authStatus = isAuthenticated();
    setAuthenticated(authStatus);
    
    if (authStatus) {
      setUser(getCurrentUser());
    }

    // Check for dark mode preference in localStorage
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(savedDarkMode === 'true');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  }, [conversationId]);

  // Effect to apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Generate a random UUID for conversation ID
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Handle login success
  const handleLogin = (userData) => {
    setAuthenticated(true);
    setUser(userData);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setAuthenticated(false);
    setUser(null);
    setMessages([]);
  };

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

  // Update for smooth scrolling during text generation
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      });
    }
  };

  // Set hasMessages to true when first message is added
  useEffect(() => {
    if (messages.length > 0 && !hasMessages) {
      setHasMessages(true);
    }
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

  // Add event listener to detect clicks outside the personas bin and dismiss
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close personas bin when clicking outside
      if (showPersonasBin && personasBinRef.current && !personasBinRef.current.contains(event.target)) {
        setShowPersonasBin(false);
      }
      
      // Close any expanded categories when clicking outside
      if (expandedCategories.length > 0) {
        const categoryElements = document.querySelectorAll('.category-section');
        let clickedInsideCategory = false;
        
        categoryElements.forEach(element => {
          if (element.contains(event.target)) {
            clickedInsideCategory = true;
          }
        });
        
        if (!clickedInsideCategory) {
          setExpandedCategories([]);
        }
      }
      
      // Close mention dropdown when clicking outside
      if (showMentionDropdown && mentionDropdownRef.current && !mentionDropdownRef.current.contains(event.target)) {
        setShowMentionDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPersonasBin, expandedCategories, showMentionDropdown]);

  // Format a message for debate mode to ensure personas remain in character and interact naturally
  const formatDebateMessage = (message, selectedPersonaIds) => {
    const selectedPersonaPrompts = selectedPersonaIds.map(id => {
      const persona = Object.values(PERSONA_CATEGORIES)
        .flatMap(category => category.personas)
        .find(p => p.id === id);
      return `${persona.name} (${persona.description}): ${AGENT_PROMPTS[id] || ''}`;
    }).join('\n\n');

    return `${message}\n\n
[CRITICAL CHARACTER INSTRUCTIONS: 
1. You must never break character. You are ${Object.values(PERSONA_CATEGORIES)
    .flatMap(category => category.personas)
    .find(p => selectedPersonaIds.includes(p.id)).name}.
2. Maintain the authentic voice, beliefs, vocabulary, and perspective of your character at all times.
3. Keep your response brief (2-4 sentences maximum).
4. Based on what others have said, ask ONE thoughtful question to another participant.
5. Reference others' perspectives directly when appropriate.
6. Never use modern terminology or references that would be unknown to your character.

The following personas are participating in this discussion:
${selectedPersonaPrompts}]`;
  };

  // Format a message with instructions for the mentioned agent
  const formatMentionedMessage = (agentId, message, isMentioned, isPriorityMention) => {
    console.log(`Formatting message for ${agentId} - isMentioned: ${isMentioned}, isPriority: ${isPriorityMention}`);
    const personaName = getPersonaName(agentId);
    const agentPrompt = AGENT_PROMPTS[agentId] || "";
    
    // Base instruction that identifies the persona and includes their prompt
    const baseInstructions = `You are ${personaName}. ${agentPrompt}\n\n`;
    
    // Important character consistency instructions
    const characterConsistencyInstructions = `
IMPORTANT CHARACTER CONSISTENCY INSTRUCTIONS:
1. You must NEVER break character. Stay 100% in character as ${personaName} at all times.
2. Maintain your authentic voice, vocabulary, beliefs, and opinions that align with your character.
3. Use language, expressions, and references that would be natural for your character and time period.
4. Keep responses concise and direct - ${isPriorityMention ? "2-4 short sentences maximum" : "1-2 short sentences maximum"}.
5. When appropriate, ask thoughtful questions that your character would naturally ask.
6. Never reference being an AI, language model, or assistant - respond as the actual historical/fictional character.
7. Respond directly without phrases like "As [name]" or signing your name.
8. If your character wouldn't know about modern concepts, don't pretend that you do.
`;

    // Different instructions based on whether the agent is mentioned directly
    const mentionInstructions = isMentioned
      ? isPriorityMention 
        ? "You have been DIRECTLY addressed in this message. Provide a thoughtful, authentic response from your character's perspective. Express your views confidently and consider asking a follow-up question if appropriate."
        : "You were mentioned in this message, but are not the primary focus. Provide a brief but insightful comment that represents your character's unique perspective."
      : "You were NOT directly addressed in this message. Only respond if you have a strong perspective to add based on your character's unique viewpoint. Your response should be very brief (1 sentence). If you have nothing valuable to contribute from your character's perspective, don't respond at all.";

    // Return the formatted message with all instructions
    return `${baseInstructions}${characterConsistencyInstructions}${mentionInstructions}\n\nMessage: ${message}`;
  };

  // Enhanced function to detect when personas are asking questions to each other
  const detectQuestionTarget = (content, allAgents) => {
    if (!content) return null;
    
    // Check for question patterns directed at specific agents
    const sentences = content.split(/[.!?]\s+/);
    
    // Look at the last 2 sentences for questions
    const lastSentences = sentences.slice(-2).join('. ');
    
    // Check if the last part contains a question mark
    if (lastSentences.includes('?')) {
      // Check for agent names in the question context
      for (const agentId of allAgents) {
        const agentName = getPersonaName(agentId);
        const readableId = agentId.replace(/_/g, ' ');
        
        // Look for the agent name followed by a question mark somewhere after
        if ((lastSentences.toLowerCase().includes(agentName.toLowerCase()) || 
             lastSentences.toLowerCase().includes(readableId.toLowerCase())) && 
            lastSentences.indexOf('?') > lastSentences.toLowerCase().indexOf(agentName.toLowerCase())) {
          return agentId;
        }
        
        // Also check for direct @ mentions followed by a question
        if (lastSentences.includes(`@${agentName}`) || lastSentences.includes(`@${readableId}`)) {
          return agentId;
        }
        
        // Check for "What do you think, [name]?" pattern
        const thinkPattern = new RegExp(`what (do|would|does|might) (you|${agentName}|${readableId}) think`, 'i');
        if (thinkPattern.test(lastSentences)) {
          return agentId;
        }
        
        // Check for addressing someone by name at the beginning of a question
        const nameFirstPattern = new RegExp(`(${agentName}|${readableId})[,:]? (what|why|how|do|would|could|can|should)`, 'i');
        if (nameFirstPattern.test(lastSentences)) {
          return agentId;
        }
        
        // Check for agent questions like "Do you agree, [name]?"
        const agreePattern = new RegExp(`(do|would) (you|${agentName}|${readableId}) agree`, 'i');
        if (agreePattern.test(lastSentences)) {
          return agentId;
        }
      }
    }
    
    return null;
  };

  // Enhanced function to handle @ mentions with better persona awareness
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputText(value);
    
    // Check for @ mentions
    const lastAtSymbolIndex = value.lastIndexOf('@');
    
    // Only process mention if we have text after the @ symbol
    if (lastAtSymbolIndex !== -1 && 
        (lastAtSymbolIndex === 0 || value[lastAtSymbolIndex - 1] === ' ') &&
        lastAtSymbolIndex !== value.length - 1) {
      
      const cursorPosition = e.target.selectionStart;
      
      // Only process if cursor is after the @ symbol
      if (cursorPosition > lastAtSymbolIndex) {
        // Find the text after @ until a space or end of string
        const textAfterAt = value.substring(lastAtSymbolIndex + 1, cursorPosition);
        const nextSpaceIndex = textAfterAt.indexOf(' ');
        const searchText = nextSpaceIndex !== -1 ? textAfterAt.substring(0, nextSpaceIndex) : textAfterAt;
        
        // If we have search text, show dropdown and position it
        if (searchText.length > 0) {
          setMentionSearch(searchText);
          setShowMentionDropdown(true);
          
          // Set the direct mention target for faster mentions
          const matchingPersonas = selectedPersonas.filter(personaId => 
            getPersonaName(personaId).toLowerCase().includes(searchText.toLowerCase())
          );
          
          if (matchingPersonas.length === 1) {
            setDirectMentionTo(matchingPersonas[0]);
          } else {
            setDirectMentionTo(null);
          }
          
          // Position the dropdown near the @ symbol
          setTimeout(() => {
            if (inputRef.current) {
              const inputRect = inputRef.current.getBoundingClientRect();
              const atPosition = getTextWidth(value.substring(0, lastAtSymbolIndex), getComputedStyle(inputRef.current).font);
              
              setMentionPosition({
                top: inputRect.top - 150, // Position above the input
                left: inputRect.left + atPosition
              });
            }
          }, 0);
        } else {
          setShowMentionDropdown(false);
        }
      }
    } else {
      setShowMentionDropdown(false);
    }
  };

  // Helper function to get text width
  const getTextWidth = (text, font) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
  };

  // Handle mention selection
  const handleMentionSelect = (personaId) => {
    const personaName = getPersonaName(personaId);
    const lastAtSymbolIndex = inputText.lastIndexOf('@');
    
    if (lastAtSymbolIndex !== -1) {
      // Replace the @mention with the selected persona
      const textBeforeAt = inputText.substring(0, lastAtSymbolIndex);
      const textAfterAt = inputText.substring(lastAtSymbolIndex + 1);
      const nextSpaceIndex = textAfterAt.indexOf(' ');
      const restOfText = nextSpaceIndex !== -1 ? textAfterAt.substring(nextSpaceIndex) : '';
      
      const newText = `${textBeforeAt}@${personaName} ${restOfText}`;
      setInputText(newText);
      
      // Focus back on input and put cursor at the end of the mention
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const cursorPosition = textBeforeAt.length + personaName.length + 2; // +2 for @ and space
          inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
        }
      }, 0);
    }
    
    setShowMentionDropdown(false);
  };

  // Apply character consistency checks to agent responses
  const applyCharacterConsistencyCheck = (agentId, responseText) => {
    const personaName = getPersonaName(agentId);
    
    // Remove any auto-signatures or meta comments like "- [name]" that LLMs tend to add
    let enhancedResponse = responseText
      .replace(new RegExp(`- ${personaName}$`, 'i'), '')
      .replace(new RegExp(`—${personaName}$`, 'i'), '')
      .replace(/^\[.*?\]/, '') // Remove any meta instructions that leaked into responses
      .trim();
    
    // Check for inconsistent language based on persona characteristics
    // Historical figures shouldn't use modern colloquialisms
    const isHistoricalFigure = AGENT_PROMPTS[agentId]?.includes('historical') || 
                              AGENT_PROMPTS[agentId]?.includes('century') ||
                              /(\d{3,4}s|-\d{3,4})/.test(AGENT_PROMPTS[agentId] || '');
    
    if (isHistoricalFigure) {
      // Replace modern terms with more timeless equivalents
      const modernTerms = {
        'okay': 'very well',
        'ok': 'very well',
        'yeah': 'yes',
        'cool': 'excellent',
        'awesome': 'marvelous',
        'guy': 'man',
        'totally': 'completely',
        'wow': 'my word',
        'lol': '',
        'omg': 'goodness',
        'gonna': 'going to',
        'wanna': 'want to',
        'gotta': 'must',
        "don't": "do not",
        "can't": "cannot",
        "wouldn't": "would not",
        "shouldn't": "should not",
        "isn't": "is not"
      };
      
      Object.entries(modernTerms).forEach(([modern, historical]) => {
        const regex = new RegExp(`\\b${modern}\\b`, 'gi');
        enhancedResponse = enhancedResponse.replace(regex, historical);
      });
    }
    
    // Ensure response is concise (2-4 sentences for priority agent, 1-2 for others)
    const sentences = enhancedResponse.split(/[.!?]\s+/);
    if (sentences.length > 4) {
      // Keep only the first 4 sentences for priority responses, or 2 for others
      const keepSentences = 4;
      enhancedResponse = sentences.slice(0, keepSentences).join('. ') + '.';
    }
    
    return enhancedResponse;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputText.trim() || selectedPersonas.length === 0 || isLoading) return;
    
    setIsLoading(true);
    
    // Add user message
    const userMessage = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputText('');
    
    // Determine which agents should respond based on mentions
    const { priorityAgentId, nonPriorityAgentIds } = parseMentions(inputText);
    
    // Set hasMessages to true for UI display
    if (!hasMessages) {
      setHasMessages(true);
    }
    
    // Scroll to bottom when new message is added
    scrollToBottom();
    
    try {
      // Prepare the API payload
      const apiPayload = {
        question: inputText,
        agent_ids: selectedPersonas,
        conversation_id: conversationId,
        direct_mention: priorityAgentId || null,
        auto_conversation: autoDebate,
        max_rounds: maxRounds
      };
      
      // Use apiCall utility to handle the API request properly
      const response = await apiCall('/seminar', 'POST', apiPayload);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error response:', errorData);
        throw new Error(errorData.detail || `API responded with status: ${response.status}`);
      }
      
      const responseData = await response.json();
      
      // Process API responses
      let agentResponses = {};
      
      if (responseData.responses && typeof responseData.responses === 'object') {
        // New format with multiple agent responses
        agentResponses = responseData.responses;
      } else if (responseData.response) {
        // Legacy format with single response
        const priorityAgent = priorityAgentId || Object.keys(agentResponses)[0];
        agentResponses[priorityAgent] = responseData.response;
      } else {
        console.error('Unexpected response format:', responseData);
        throw new Error('Unexpected response format from API');
      }
      
      // Add responses to the messages list with a delay between each
      const addAgentMessage = (agentId, text, delay) => {
        return new Promise(resolve => {
          setTimeout(() => {
            const enhancedResponse = applyCharacterConsistencyCheck(agentId, text);
            
            setMessages(prevMessages => [
              ...prevMessages,
              {
                id: Date.now() + Math.random(),
                text: enhancedResponse,
                sender: agentId,
                timestamp: new Date().toISOString(),
                inReplyTo: userMessage.id
              }
            ]);
            resolve();
          }, delay);
        });
      };
      
      // Order the responses: priority agent first, then others
      const orderedAgentIds = [
        priorityAgentId || Object.keys(agentResponses)[0],
        ...Object.keys(agentResponses).filter(id => id !== (priorityAgentId || Object.keys(agentResponses)[0]))
      ];
      
      // Add each response with a natural delay
      let cumulativeDelay = 0;
      for (const agentId of orderedAgentIds) {
        if (agentResponses[agentId]) {
          // Base delay on message length for natural feeling
          const baseDelay = Math.min(agentResponses[agentId].length * 5, 800);
          await addAgentMessage(agentId, agentResponses[agentId], cumulativeDelay);
          cumulativeDelay += baseDelay;
        }
      }
      
      // Scroll to the newest message after all agents have responded
      setTimeout(() => {
        scrollToBottom();
      }, cumulativeDelay + 100);
      
    } catch (error) {
      console.error('Error generating response:', error);
      
      // Check if this is a connection error (backend unavailable)
      const isConnectionError = 
        error.message?.includes('Failed to connect') || 
        error.message?.includes('Network Error') ||
        error.originalError?.name === 'AbortError' ||
        error.message?.includes('timed out');
      
      if (isConnectionError && selectedPersonas.length > 0) {
        // Generate fallback responses client-side if backend is unavailable
        console.log('Generating fallback responses client-side');
        
        try {
          // Determine which personas should respond
          const respondingPersonas = priorityAgentId 
            ? [priorityAgentId, ...nonPriorityAgentIds].filter(id => selectedPersonas.includes(id))
            : [selectedPersonas[Math.floor(Math.random() * selectedPersonas.length)]];
          
          // Get fallback responses
          const fallbackResponses = generateFallbackResponse(inputText, respondingPersonas);
          
          // Display the fallback responses with delay
          let delay = 0;
          for (const response of fallbackResponses) {
            setTimeout(() => {
              setMessages(prevMessages => [
                ...prevMessages,
                {
                  id: Date.now() + Math.random(),
                  text: response.response,
                  sender: response.agent,
                  timestamp: new Date().toISOString(),
                  fallback: true
                }
              ]);
              
              // Scroll to bottom for each new message
              scrollToBottom();
            }, delay);
            
            delay += 800; // Add delay between messages
          }
          
          // Also add system message explaining the fallback
          setTimeout(() => {
            setMessages(prevMessages => [
              ...prevMessages,
              {
                id: Date.now() + Math.random(),
                text: "Note: Using fallback responses because the backend API appears to be unavailable. This could happen if the server is starting up (it can take 30-60 seconds on first use) or if there's a temporary connection issue. Please try again shortly.",
                sender: 'system',
                timestamp: new Date().toISOString(),
              }
            ]);
            scrollToBottom();
          }, delay + 500);
          
        } catch (fallbackError) {
          console.error('Error generating fallback responses:', fallbackError);
          // If even fallback generation fails, show the standard error message
          addSystemErrorMessage(error);
        }
      } else {
        // For non-connection errors, show the standard error message
        addSystemErrorMessage(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to add system error messages
  const addSystemErrorMessage = (error) => {
    setMessages(prevMessages => [
      ...prevMessages,
      {
        id: Date.now(),
        text: `I'm sorry, there was an error processing your request. ${error.message || 'Please try again.'}`,
        sender: 'system',
        timestamp: new Date().toISOString(),
      }
    ]);
    
    // Scroll to show the error message
    setTimeout(scrollToBottom, 100);
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
    setShowAgentSelector(prev => !prev);
  };

  // Get filtered mention suggestions based on search text
  const getMentionSuggestions = () => {
    if (!mentionSearch) return selectedPersonas;
    
    return selectedPersonas.filter(personaId => 
      getPersonaName(personaId).toLowerCase().includes(mentionSearch.toLowerCase())
    );
  };

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  // Add this effect to toggle debug mode with CTRL+SHIFT+D
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Ctrl+Shift+D (Debug mode toggle)
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        toggleDebugMode();
        console.log('Debug mode toggled:', !debugMode);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [debugMode]);

  // Enhanced function to detect replies between agents
  const detectReplyTarget = (content, currentPersonaId, allMessages) => {
    if (!content) return null;
    
    // Get all persona messages (excluding the current persona)
    const personaMessages = allMessages.filter(
      msg => msg.type === 'persona' && msg.personaId !== currentPersonaId
    );
    
    if (personaMessages.length === 0) return null;
    
    // Check for mentions of other personas by name
    for (const message of personaMessages) {
      const personaName = getPersonaName(message.personaId);
      const personaDisplayName = personaName.replace(/_/g, ' ');
      
      // Look for persona name patterns in the content
      if (
        content.includes(`@${personaName}`) || 
        content.includes(`@${personaDisplayName}`) ||
        content.toLowerCase().includes(`${personaName.toLowerCase()},`) ||
        content.toLowerCase().includes(`${personaDisplayName.toLowerCase()},`) ||
        (content.toLowerCase().includes(personaName.toLowerCase()) && 
         content.toLowerCase().includes('you said'))
      ) {
        return message;
      }
    }
    
    return null;
  };

  // New function to parse @ mentions and determine which agents should respond
  const parseMentions = (message) => {
    if (!message) return { priorityAgentId: null, nonPriorityAgentIds: [] };
    
    const mentionedAgentIds = [];
    const lowerMessage = message.toLowerCase();
    
    // Check for direct mentions using @ symbol
    const atMentions = message.match(/@(\w+)/g) || [];
    for (const mention of atMentions) {
      const mentionedName = mention.substring(1).toLowerCase(); // Remove the @ symbol
      
      // Look for a matching persona by name or ID
      for (const category of Object.values(PERSONA_CATEGORIES)) {
        for (const persona of category.personas) {
          const personaName = persona.name.toLowerCase();
          const personaId = persona.id.toLowerCase();
          
          if (personaName.includes(mentionedName) || mentionedName.includes(personaName) || 
              personaId.includes(mentionedName) || mentionedName.includes(personaId)) {
            if (!mentionedAgentIds.includes(persona.id)) {
              mentionedAgentIds.push(persona.id);
            }
          }
        }
      }
    }
    
    // Check for names mentioned without @ symbol
    if (atMentions.length === 0) {
      // Only check for name mentions if no @ mentions were found
      for (const category of Object.values(PERSONA_CATEGORIES)) {
        for (const persona of category.personas) {
          const personaName = persona.name.toLowerCase();
          const personaId = persona.id.toLowerCase().replace(/_/g, ' ');
          
          // Check if the persona name is mentioned in the message
          if (lowerMessage.includes(personaName) || lowerMessage.includes(personaId)) {
            if (!mentionedAgentIds.includes(persona.id)) {
              mentionedAgentIds.push(persona.id);
            }
          }
        }
      }
    }
    
    // Check for questions directed at specific personas
    const questionTarget = detectQuestionTarget(message, selectedPersonas);
    if (questionTarget && !mentionedAgentIds.includes(questionTarget)) {
      mentionedAgentIds.push(questionTarget);
    }
    
    // If no mentions were found and we have selected personas, we'll need a random response
    if (mentionedAgentIds.length === 0 && selectedPersonas.length > 0) {
      // Return no specific mentions - will trigger random response behavior
      return { priorityAgentId: null, nonPriorityAgentIds: [] };
    }
    
    // The first mentioned agent is the priority
    const priorityAgentId = mentionedAgentIds.length > 0 ? mentionedAgentIds[0] : null;
    
    // Other mentioned agents are non-priority
    const nonPriorityAgentIds = mentionedAgentIds.slice(1);
    
    return { priorityAgentId, nonPriorityAgentIds };
  };

  // Helper function to get persona icon
  const getPersonaIcon = (personaId) => {
    if (personaId.includes('scientist') || personaId === 'einstein' || personaId === 'newton' || personaId === 'feynman' || personaId === 'darwin') {
      return 'psychology';
    } else if (personaId.includes('philosopher') || personaId === 'socrates' || personaId === 'nietzsche') {
      return 'school';
    } else if (personaId.includes('innovator') || personaId === 'steve_jobs' || personaId === 'sam_altman') {
      return 'lightbulb';
    } else if (personaId.includes('expert')) {
      return 'analytics';
    } else if (personaId.includes('advocate')) {
      return 'gavel';
    }
    return 'person';
  };

  // Add handler for agent selection
  const handleAgentSelect = (agent) => {
    setSelectedPersonas(prev => {
      const isAlreadySelected = prev.some(p => p.id === agent.id);
      if (isAlreadySelected) {
        return prev.filter(p => p.id !== agent.id);
      } else {
        return [...prev, agent];
      }
    });
  };

  // If not authenticated, show the Login component
  if (!authenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div id="webcrumbs" className={`min-h-screen font-sans overflow-hidden transition-colors duration-300 ${darkMode ? 'dark bg-gradient-to-br from-slate-950 via-gray-900 to-slate-900 text-gray-100' : 'bg-gradient-to-br from-[#E8E1D9] via-[#D8CFC5] to-[#C9BFB2] text-[#67473B]'}`}>
      {/* Header - Apple-inspired minimal design with gradients */}
      <header className={`border-b backdrop-blur-xl p-4 flex justify-between items-center transition-colors duration-300 ${darkMode ? 'border-gray-800 bg-black/70' : 'border-[#B0A395]/40 bg-[#E8E1D9]/60'}`}>
        <div className="flex items-center gap-3">
          <svg
            className={`w-8 h-8 ${darkMode ? 'text-indigo-300' : 'text-[#67473B]'}`}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M7.5 12C7.5 12 9 9 12 9C15 9 16.5 12 16.5 12C16.5 12 15 15 12 15C9 15 7.5 12 7.5 12Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="12"
              cy="12"
              r="2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h1 className={`text-xl font-medium tracking-tight ${darkMode ? 'text-indigo-200' : 'text-[#67473B]'}`}>Socratic</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Dark Mode Toggle */}
          <button 
            onClick={toggleDarkMode}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all shadow-sm ${darkMode ? 'bg-gray-800/80 text-amber-300 hover:bg-gray-700/80 hover:text-amber-200' : 'bg-[#C2B5A8]/70 text-[#67473B] hover:bg-[#B0A395]/60'}`}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="material-symbols-outlined text-sm">
              {darkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              {user.picture ? (
                <img 
                  src={user.picture} 
                  alt={user.name} 
                  className={`w-8 h-8 rounded-full overflow-hidden ring-1 transition-all cursor-pointer shadow-sm ${darkMode ? 'ring-gray-700 bg-gray-800' : 'ring-[#B0A395]/60 bg-[#E8E1D9]'}`}
                />
              ) : (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ring-1 transition-all cursor-pointer shadow-sm ${darkMode ? 'ring-gray-700 bg-gray-800' : 'ring-[#B0A395]/60 bg-[#E8E1D9]'}`}>
                  <span className="material-symbols-outlined text-sm">person</span>
                </div>
              )}
              <button 
                onClick={handleLogout}
                className={`flex items-center gap-1 text-sm transition-colors hover:scale-105 ${darkMode ? 'text-gray-400 hover:text-indigo-300' : 'text-[#67473B]/80 hover:text-[#67473B]'}`}
              >
                <span className="material-symbols-outlined text-sm">logout</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setAuthenticated(false)} 
              className={`flex items-center gap-1 text-sm transition-colors hover:scale-105 ${darkMode ? 'text-gray-400 hover:text-indigo-300' : 'text-[#67473B]/80 hover:text-[#67473B]'}`}
            >
              <span className="material-symbols-outlined text-sm">login</span>
            </button>
          )}
        </div>
      </header>

      {/* Main content - clean, minimal layout with gradients */}
      <main className="relative flex h-[calc(100vh-64px)] overflow-hidden" onClick={(e) => {
        if (showPersonasBin) {
          e.stopPropagation(); // Stop propagation here to prevent the bin tab from interfering
          setShowPersonasBin(false);
        }
      }}>
        {/* Main chat area with centered content */}
        <div className="flex-1 flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="max-w-2xl mx-auto w-full px-4 flex-1 overflow-y-auto" ref={chatContainerRef}>
            {!hasMessages ? (
              // Virtual roundtable - minimalist redesign with gradients
              <div className="w-full mb-8 mt-12">
                <div className="flex flex-col items-center justify-center gap-2 mb-10">
                  <div className={`text-2xl font-medium tracking-tight ${darkMode ? 'text-indigo-200' : 'text-[#67473B]'}`}>
                    Select Personas
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-indigo-300/70' : 'text-[#67473B]/80'}`}>
                    Choose who you'd like to discuss with
                  </p>
                </div>

                {/* Persona circle - updated with gradient effects */}
                {selectedPersonas.length > 0 && (
                  <div className="relative h-[360px] w-[360px] mx-auto mb-8">
                    <div className={`absolute w-full h-full rounded-full border ${darkMode ? 'border-gray-800/80 shadow-inner shadow-indigo-900/10' : 'border-[#B0A395]/70 shadow-inner shadow-[#67473B]/5'}`}></div>
                    
                    {selectedPersonas.map((personaId, index) => {
                      const angle = ((2 * Math.PI) / selectedPersonas.length) * index - Math.PI / 2;
                      const radius = 140;
                      const top = 180 + radius * Math.sin(angle);
                      const left = 180 + radius * Math.cos(angle);
                      
                      return (
                        <div 
                          key={personaId}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-in-out" 
                          style={{ 
                            top: `${top}px`, 
                            left: `${left}px`,
                          }}
                        >
                          <div className="relative group">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md ring-1 transition-all duration-300 group-hover:scale-110 ${darkMode 
                              ? 'bg-gradient-to-br from-slate-800 via-indigo-900/30 to-slate-700 ring-indigo-900/30' 
                              : 'bg-gradient-to-br from-[#D8CFC5] via-[#C9BFB2] to-[#D8CFC5] ring-[#B0A395]/40'}`}
                            >
                              <span className={`material-symbols-outlined text-sm ${darkMode ? 'text-indigo-300' : 'text-[#67473B]'}`}>
                                {getPersonaIcon(personaId)}
                              </span>
                            </div>
                            <span className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap ${darkMode ? 'text-indigo-200/90' : 'text-[#67473B]'}`}>
                              {getPersonaName(personaId)}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Center User Avatar with gradient */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                      <div className="relative">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ring-1 ${darkMode 
                          ? 'bg-gradient-to-br from-indigo-900/40 via-indigo-800/30 to-blue-800/40 ring-indigo-700/50' 
                          : 'bg-gradient-to-br from-[#C9BFB2]/80 via-[#D8CFC5] to-[#E8E1D9] ring-[#B0A395]/50'}`}
                        >
                          <span className={`material-symbols-outlined ${darkMode ? 'text-indigo-300' : 'text-[#67473B]'}`}>person</span>
                        </div>
                        <span className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap ${darkMode ? 'text-indigo-200' : 'text-[#67473B]'}`}>
                          You
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Messages with gradients and modern design
              <div className="space-y-3 py-6">
                {messages.map((message, index) => {
                  const isUser = message.sender === 'user';
                  const isSystem = message.sender === 'system';
                  
                  return (
                    <div 
                      key={index} 
                      className={`p-4 rounded-xl transition-all shadow-sm ${
                        isUser 
                          ? darkMode
                            ? 'bg-gradient-to-r from-indigo-900/30 via-indigo-800/20 to-indigo-900/30 ml-12 border border-indigo-800/20' 
                            : 'bg-gradient-to-r from-[#C2B5A8]/60 via-[#B0A395]/50 to-[#C2B5A8]/60 ml-12 border border-[#B0A395]/30'
                          : isSystem
                            ? darkMode
                              ? 'bg-gradient-to-r from-gray-800/60 via-gray-800/40 to-gray-700/60 border border-gray-700/30'
                              : 'bg-gradient-to-r from-[#D8CFC5]/50 via-[#C9BFB2]/40 to-[#D8CFC5]/50 border border-[#B0A395]/20'
                            : darkMode
                              ? 'bg-gradient-to-r from-slate-900/40 via-slate-800/30 to-slate-900/40 mr-12 border border-slate-800/20'
                              : 'bg-gradient-to-r from-[#E8E1D9]/70 via-[#D8CFC5]/60 to-[#E8E1D9]/70 mr-12 border border-[#B0A395]/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {message.sender === 'system' ? (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                            darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-700' : 'bg-gradient-to-br from-[#C9BFB2] to-[#B0A395]'
                          }`}>
                            <span className={`material-symbols-outlined text-xs ${
                              darkMode ? 'text-indigo-300' : 'text-[#67473B]'
                            }`}>
                              {message.isLoading ? 'sync' : 'info'}
                            </span>
                          </div>
                        ) : message.sender === 'user' ? (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                            darkMode ? 'bg-gradient-to-br from-indigo-800/60 via-indigo-700/50 to-indigo-800/60' : 'bg-gradient-to-br from-[#C2B5A8]/70 via-[#B0A395]/60 to-[#C2B5A8]/70'
                          }`}>
                            <span className={`material-symbols-outlined text-xs ${
                              darkMode ? 'text-indigo-300' : 'text-[#67473B]'
                            }`}>person</span>
                          </div>
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                            darkMode ? 'bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800' : 'bg-gradient-to-br from-[#D8CFC5]/60 via-[#C9BFB2]/50 to-[#D8CFC5]/60'
                          }`}>
                            <span className={`material-symbols-outlined text-xs ${
                              darkMode ? 'text-indigo-300' : 'text-[#67473B]'
                            }`}>
                              {getPersonaIcon(message.sender)}
                            </span>
                          </div>
                        )}
                        
                        <div>
                          <h3 className={`text-sm font-medium ${
                            darkMode ? 'text-indigo-200' : 'text-[#67473B]'
                          }`}>
                            {message.sender === 'system' ? 'System' : message.sender === 'user' ? 'You' : getPersonaName(message.sender)}
                          </h3>
                          <div className={`text-sm mt-1 ${
                            darkMode ? 'text-indigo-100/90' : 'text-[#67473B]/90'
                          }`}>
                            {message.isAnimating ? (
                              <span className="inline-block typing-animation">
                                {message.displayedContent !== undefined ? message.displayedContent : message.text}
                                <span className="typing-cursor"></span>
                              </span>
                            ) : (
                              <p>{message.displayedContent !== undefined ? message.displayedContent : message.text}</p>
                            )}
                            {message.isLoading && (
                              <span className="inline-flex items-center gap-1">
                                <span className="animate-pulse">.</span>
                                <span className="animate-pulse animation-delay-200">.</span>
                                <span className="animate-pulse animation-delay-400">.</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input area with gradients and updated debate button */}
          <div className={`border-t backdrop-blur-xl transition-colors duration-300 ${darkMode ? 'border-gray-800 bg-black/70' : 'border-[#B0A395]/30 bg-[#E8E1D9]/60'}`}>
            <div className="max-w-2xl mx-auto px-4 py-3">
              <form className="relative" onSubmit={handleSubmit}>
                <textarea
                  ref={inputRef}
                  className={`w-full resize-none rounded-xl px-4 pr-24 py-3 border backdrop-blur-lg focus:ring-1 outline-none transition-all shadow-sm ${
                    darkMode 
                      ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-gray-800 focus:border-indigo-900/60 focus:ring-indigo-900/30 placeholder-gray-500 text-indigo-100' 
                      : 'bg-gradient-to-br from-[#E8E1D9]/60 to-[#D8CFC5]/60 border-[#B0A395]/40 focus:border-[#B0A395]/60 focus:ring-[#B0A395]/30 placeholder-[#67473B]/60 text-[#67473B]'
                  }`}
                  placeholder={selectedPersonas.length === 0 
                    ? "Select personas to begin..." 
                    : autoDebate 
                      ? "Type @ to mention a specific persona..." 
                      : "Ask a question..."}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  disabled={isLoading || animatingText || selectedPersonas.length === 0}
                  rows="1"
                ></textarea>
                
                {/* Updated Debate button with text and rounds chooser - positioned higher */}
                <div className="absolute right-1 top-[40%] -translate-y-1/2 flex items-center gap-1">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!autoDebate) {
                          setShowRoundsChooser(!showRoundsChooser);
                        } else {
                          setAutoDebate(false);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg transition-all text-sm font-medium flex items-center backdrop-blur-md shadow-sm hover:shadow ${
                        autoDebate 
                          ? darkMode
                            ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-700 text-white border border-indigo-600/50' 
                            : 'bg-gradient-to-r from-[#67473B] via-[#7D5A4C] to-[#67473B] text-white border border-[#67473B]/30'
                          : darkMode
                            ? 'bg-gradient-to-r from-gray-800/80 via-gray-700/80 to-gray-800/80 text-gray-300 hover:text-indigo-200 border border-gray-700/50' 
                            : 'bg-gradient-to-r from-[#C2B5A8]/70 via-[#B0A395]/60 to-[#C2B5A8]/70 text-[#67473B] hover:text-[#67473B] border border-[#B0A395]/40'
                      }`}
                    >
                      <span>Debate</span>
                      {autoDebate && (
                        <span className="ml-1 text-xs bg-white/20 px-1.5 py-0.5 rounded">
                          {maxRounds}
                        </span>
                      )}
                    </button>
                    
                    {/* Rounds chooser dropdown */}
                    {showRoundsChooser && (
                      <div 
                        className={`absolute bottom-full right-0 mb-1 py-2 rounded-lg shadow-lg z-10 min-w-[120px] backdrop-blur-lg ${
                          darkMode ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/80' : 'bg-gradient-to-br from-[#E8E1D9]/80 to-[#D8CFC5]/80 border border-[#B0A395]/50'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className={`px-3 py-1 text-xs font-medium ${darkMode ? 'text-indigo-300/80' : 'text-[#67473B]/80'}`}>
                          Choose rounds:
                        </div>
                        {[1, 2, 3, 4, 5].map(rounds => (
                          <button
                            key={rounds}
                            type="button"
                            className={`w-full px-3 py-1.5 text-left text-sm transition-colors hover:shadow-inner ${
                              darkMode 
                                ? 'hover:bg-indigo-900/30 text-indigo-100' 
                                : 'hover:bg-[#B0A395]/30 text-[#67473B]'
                            } ${maxRounds === rounds ? (darkMode ? 'bg-indigo-900/20' : 'bg-[#B0A395]/20') : ''}`}
                            onClick={() => {
                              setMaxRounds(rounds);
                              setAutoDebate(true);
                              setShowRoundsChooser(false);
                            }}
                          >
                            {rounds} {rounds === 1 ? 'round' : 'rounds'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={isLoading || animatingText || !inputText.trim() || selectedPersonas.length === 0}
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-white transition-all backdrop-blur-sm shadow-sm ${
                      darkMode
                        ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:via-indigo-400 hover:to-indigo-500 disabled:opacity-50 disabled:bg-gray-700 border border-indigo-500/50'
                        : 'bg-gradient-to-r from-[#67473B] via-[#7D5A4C] to-[#67473B] hover:from-[#7D5A4C] hover:via-[#67473B] hover:to-[#7D5A4C] disabled:opacity-50 disabled:bg-[#B0A395]/50 border border-[#67473B]/30'
                    }`}
                  >
                    {isLoading ? (
                      <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                    ) : animatingText ? (
                      <span className="material-symbols-outlined text-sm">more_horiz</span>
                    ) : (
                      <span className="material-symbols-outlined text-sm">arrow_upward</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Personas Bin Tab - side toggle instead of header button */}
        <button 
          onClick={(e) => {
            e.stopPropagation(); 
            setShowPersonasBin(!showPersonasBin);
          }}
          className={`fixed right-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-20 rounded-l-lg z-40 shadow-md ${
            darkMode 
              ? 'bg-gradient-to-b from-indigo-900/40 via-slate-800 to-indigo-900/40 text-indigo-300 hover:text-indigo-200 border border-r-0 border-gray-700/50' 
              : 'bg-gradient-to-b from-[#C2B5A8]/70 via-[#B0A395]/60 to-[#C2B5A8]/70 text-[#67473B]/80 hover:text-[#67473B] border border-r-0 border-[#B0A395]/40'
          } transition-all`}
        >
          <span className="material-symbols-outlined text-sm transform">
            {showPersonasBin ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>

        {/* Personas Bin - slide-in from right with glassy effect */}
        {showPersonasBin && (
          <div 
            ref={personasBinRef}
            onClick={(e) => e.stopPropagation()}
            className={`fixed top-0 right-0 bottom-0 w-80 shadow-lg transform transition-transform duration-300 ease-in-out z-30 backdrop-blur-xl ${
              darkMode ? 'bg-gradient-to-br from-slate-950/90 via-slate-900/90 to-slate-950/90 border-l border-gray-800/80' : 'bg-gradient-to-br from-[#E8E1D9]/80 via-[#D8CFC5]/80 to-[#E8E1D9]/80 border-l border-[#B0A395]/40'
            }`}
          >
            <div className={`p-4 border-b sticky top-0 backdrop-blur-md z-10 ${darkMode ? 'border-gray-800/80 bg-slate-950/80' : 'border-[#B0A395]/30 bg-[#E8E1D9]/70'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`font-medium ${darkMode ? 'text-indigo-200' : 'text-[#67473B]'}`}>Select Personas</h3>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPersonasBin(false);
                  }}
                  className={`hover:scale-110 transition-transform ${darkMode ? 'text-indigo-300 hover:text-indigo-200' : 'text-[#67473B]/80 hover:text-[#67473B]'}`}
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
              <p className={`text-sm mt-1 ${darkMode ? 'text-indigo-300/70' : 'text-[#67473B]/80'}`}>
                {selectedPersonas.length} selected
              </p>
            </div>
            
            <div className="p-4 overflow-y-auto h-[calc(100%-64px)]">
              {Object.entries(PERSONA_CATEGORIES).map(([categoryId, category]) => (
                <div key={categoryId} className="mb-4 category-section">
                  <button
                    onClick={() => toggleCategory(categoryId)}
                    className={`flex items-center justify-between w-full text-left p-2 rounded-lg transition-colors ${
                      darkMode ? 'hover:bg-indigo-900/20 text-indigo-200' : 'hover:bg-[#B0A395]/30 text-[#67473B]'
                    }`}
                  >
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className={`material-symbols-outlined text-sm ${darkMode ? 'text-indigo-300/70' : 'text-[#67473B]/70'}`}>
                      {expandedCategories.includes(categoryId) ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                  
                  {expandedCategories.includes(categoryId) && (
                    <div className="mt-1 ml-2 space-y-1">
                      {category.personas.map(persona => (
                        <button
                          key={persona.id}
                          onClick={() => togglePersona(persona.id)}
                          className={`flex items-center gap-2 w-full text-left p-2 rounded-lg transition-colors ${
                            selectedPersonas.includes(persona.id)
                              ? darkMode
                                ? 'bg-indigo-900/30 text-indigo-200 border border-indigo-700/30'
                                : 'bg-[#B0A395]/40 text-[#67473B] border border-[#B0A395]/30'
                              : darkMode
                                ? 'hover:bg-indigo-900/20 text-indigo-100/80'
                                : 'hover:bg-[#B0A395]/30 text-[#67473B]/90'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm ${
                            darkMode ? 'bg-gradient-to-br from-slate-800 to-slate-700' : 'bg-gradient-to-br from-[#D8CFC5] to-[#C9BFB2]'
                          }`}>
                            <span className={`material-symbols-outlined text-xs ${
                              darkMode ? 'text-indigo-300' : 'text-[#67473B]/80'
                            }`}>
                              {getPersonaIcon(persona.id)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{persona.name}</div>
                            <div className={`text-xs truncate ${darkMode ? 'text-indigo-200/60' : 'text-[#67473B]/70'}`}>{persona.description}</div>
                          </div>
                          {selectedPersonas.includes(persona.id) && (
                            <span className={`material-symbols-outlined text-sm ${darkMode ? 'text-indigo-400' : 'text-[#67473B]'}`}>check_circle</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mention dropdown */}
        {showMentionDropdown && (
          <div
            ref={mentionDropdownRef}
            className={`absolute shadow-lg border rounded-lg max-h-60 overflow-y-auto z-50 backdrop-blur-lg ${
              darkMode ? 'bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-gray-700/80' : 'bg-gradient-to-br from-[#E8E1D9]/90 to-[#D8CFC5]/90 border-[#B0A395]/50'
            }`}
            style={{
              top: `${mentionPosition.top}px`,
              left: `${mentionPosition.left}px`,
            }}
          >
            <div className="p-2">
              {getMentionSuggestions().length > 0 ? (
                getMentionSuggestions().map(personaId => (
                  <button
                    key={personaId}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-left rounded-md transition-colors ${
                      darkMode ? 'hover:bg-indigo-900/30 text-indigo-200' : 'hover:bg-[#B0A395]/30 text-[#67473B]'
                    }`}
                    onClick={() => handleMentionSelect(personaId)}
                  >
                    <span className={`material-symbols-outlined text-sm ${
                      darkMode ? 'text-indigo-300' : 'text-[#67473B]/70'
                    }`}>
                      {getPersonaIcon(personaId)}
                    </span>
                    <span className="text-sm">{getPersonaName(personaId)}</span>
                  </button>
                ))
              ) : (
                <div className={`text-sm px-3 py-2 ${darkMode ? 'text-indigo-300/70' : 'text-[#67473B]/70'}`}>No matching personas</div>
              )}
            </div>
          </div>
        )}
      </main>

      <AgentSelector 
        isOpen={showAgentSelector}
        onClose={togglePersonasBin}
        selectedAgents={selectedPersonas}
        onSelectAgent={handleAgentSelect}
      />
    </div>
  );
}

export default App; 