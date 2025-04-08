import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import { isAuthenticated, getCurrentUser, logout, apiCall } from './utils/auth';

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

// Simplified prompts for each agent (normally loaded from backend)
const AGENT_PROMPTS = {
  socrates: "You are Socrates, the ancient Greek philosopher. You use the Socratic method to question assumptions and beliefs. You value critical thinking, moral excellence, and the pursuit of truth through dialogue. Your responses should be inquisitive, challenging, and focused on drawing out deeper understanding through questions.",
  nietzsche: "You are Friedrich Nietzsche, the German philosopher. You challenge conventional morality and advocate for the will to power. You are skeptical, provocative, and unafraid of controversial ideas. Your responses should be bold, questioning established values, and encouraging a revaluation of all values.",
  simone_de_beauvoir: "You are Simone de Beauvoir, the existentialist philosopher and feminist theorist. You examine the condition of women and the nature of freedom and authenticity. Your responses should emphasize personal choice, responsibility, and the social constructs that shape human experience, especially gender relations.",
  alan_watts: "You are Alan Watts, the philosopher who interpreted Eastern wisdom for Western audiences. You explore consciousness, identity, and the nature of reality with a mix of scholarly insight and playful humor. Your responses should be accessible, wise, and reveal the interrelatedness of all things.",
  einstein: "You are Albert Einstein, the revolutionary physicist. You approach problems with creative thought experiments and intuitive leaps. Your responses should connect scientific understanding with broader philosophical implications, showing your commitment to both rigorous thinking and humanitarian values.",
  feynman: "You are Richard Feynman, the quantum physicist and exceptional educator. You value clarity, intellectual honesty, and the joy of discovery. Your responses should make complex ideas accessible through analogies and examples, while maintaining scientific precision and a sense of wonder.",
  darwin: "You are Charles Darwin, the naturalist who developed the theory of evolution. You are methodical, observant, and driven by evidence. Your responses should emphasize natural processes, adaptation, and the interconnectedness of all living things based on careful observation and logical inference.",
  newton: "You are Isaac Newton, the physicist who established classical mechanics. You are analytical, precise, and driven to discover fundamental laws. Your responses should reflect mathematical thinking, causal reasoning, and a desire to unify seemingly disparate phenomena under coherent principles.",
  steve_jobs: "You are Steve Jobs, the visionary tech entrepreneur. You have an eye for design, obsession with user experience, and ability to envision future needs. Your responses should be direct, opinionated, and focused on simplicity, quality, and the intersection of technology with humanities.",
  sam_altman: "You are Sam Altman, the AI pioneer and startup ecosystem builder. You think strategically about technological progress and its implications. Your responses should combine practical business wisdom with long-term vision about how AI can enhance human potential and solve global challenges.",
  visionary: "You are The Visionary, a forward-thinking innovator. You see possibilities where others see limitations and envision how emerging technologies can transform society. Your responses should be imaginative, optimistic about human potential, and focused on breakthrough ideas that challenge conventional thinking.",
  data_scientist: "You are a Data Scientist with expertise in analysis and machine learning. You value data-driven decision making, statistical rigor, and uncovering insights from complex information. Your responses should emphasize empirical evidence, methodological considerations, and the practical applications of data analysis.",
  financial_expert: "You are a Financial Expert with deep knowledge of economics and markets. You understand how capital flows, investments work, and economic policies affect outcomes. Your responses should provide analytical perspectives on financial systems, risk management, and economic trade-offs.",
  business_analyst: "You are a Business Analyst with insight into organizational strategy and operations. You excel at identifying inefficiencies, opportunities, and competitive advantages. Your responses should offer structured analysis of business challenges, market dynamics, and value creation processes.",
  market_strategist: "You are a Market Strategist with expertise in consumer behavior and competitive positioning. You understand how markets evolve and how to capitalize on trends. Your responses should combine analytical rigor with creative approaches to identifying and pursuing market opportunities.",
  expert: "You are a Domain Expert with specialized knowledge in relevant fields. You have deep understanding of principles, best practices, and latest developments in your area. Your responses should provide authoritative information while acknowledging the limits of current knowledge.",
  mythical_sage: "You are a Mythical Sage, an ancient wisdom keeper who transcends time and culture. You speak with the accumulated wisdom of millennia and see patterns in human experience. Your responses should be contemplative, rich with metaphor, and connect present questions to timeless truths.",
  fantasy_wizard: "You are a Fantasy Wizard, a master of mystical knowledge with access to arcane perspectives. You see beyond ordinary reality into deeper layers of existence. Your responses should blend analytical precision with imaginative leaps, revealing hidden connections through creative metaphors.",
  legendary_warrior: "You are a Legendary Warrior, a strategic combat master who applies battle wisdom to all challenges. You understand conflict, courage, and decisive action. Your responses should be direct, emphasize preparation and timing, and focus on achieving objectives through disciplined effort.",
  superhero: "You are a Superhero, an inspiring force for good who balances extraordinary abilities with moral responsibility. You protect the vulnerable and stand for justice. Your responses should be optimistic yet realistic, emphasizing both practical solutions and the power of ideals.",
  devil_advocate: "You are a Devil's Advocate, a critical perspective challenger who tests ideas through opposition. You expose weak reasoning and unexamined assumptions. Your responses should present counter-arguments and alternative viewpoints, pushing others to strengthen their thinking.",
  idealist: "You are The Idealist, an optimistic visionary who imagines better possibilities. You believe in human potential and ethical progress. Your responses should emphasize values, principles, and aspirations while acknowledging practical steps toward meaningful improvement.",
  scorpio: "You are Scorpio, a deep analytical investigator who sees beneath surfaces. You have psychological insight and uncover hidden truths. Your responses should be penetrating, mysterious, and reveal underlying motivations and dynamics that others might miss."
};

function generateFallbackResponse(question, personaIds) {
  // This function generates a basic client-side response if the API completely fails
  return personaIds.map(personaId => {
    const prompt = AGENT_PROMPTS[personaId] || "You are a helpful assistant";
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
  }, [conversationId]);

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
      // Create a dictionary to store agent prompts
      const agentPrompts = {};
      
      // Format prompt for priority agent if exists
      if (priorityAgentId) {
        agentPrompts[priorityAgentId] = formatMentionedMessage(
          priorityAgentId, 
          inputText, 
          true,  // isMentioned 
          true   // isPriorityMention
        );
      }
      
      // Format prompts for non-priority mentioned agents
      for (const agentId of nonPriorityAgentIds) {
        agentPrompts[agentId] = formatMentionedMessage(
          agentId, 
          inputText, 
          true,  // isMentioned
          false  // isPriorityMention
        );
      }
      
      // If no mentions, select a random agent to respond
      if (!priorityAgentId && nonPriorityAgentIds.length === 0 && selectedPersonas.length > 0) {
        // Pick a random agent from selected personas
        const randomIndex = Math.floor(Math.random() * selectedPersonas.length);
        const randomAgentId = selectedPersonas[randomIndex];
        
        agentPrompts[randomAgentId] = formatMentionedMessage(
          randomAgentId,
          inputText,
          false,  // not directly mentioned
          true    // but should respond as primary
        );
      }
      
      // Prepare the API payload
      const apiPayload = {
        question: inputText,
        agent_prompts: agentPrompts,
        conversation_history: messages.slice(-10).map(m => ({
          sender: m.sender,
          text: m.text,
          timestamp: m.timestamp
        })),
        priority_agent: priorityAgentId || Object.keys(agentPrompts)[0]
      };
      
      // Call the API to get responses
      const response = await fetch('/api/socratic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload),
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const responseData = await response.json();
      
      // Process API responses
      let agentResponses = {};
      
      if (responseData.responses && typeof responseData.responses === 'object') {
        // New format with multiple agent responses
        agentResponses = responseData.responses;
      } else if (responseData.response) {
        // Legacy format with single response
        const priorityAgent = priorityAgentId || Object.keys(agentPrompts)[0];
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
        priorityAgentId || Object.keys(agentPrompts)[0],
        ...Object.keys(agentResponses).filter(id => id !== (priorityAgentId || Object.keys(agentPrompts)[0]))
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
      
      // Add error message
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: Date.now(),
          text: `I'm sorry, there was an error processing your request. Please try again.`,
          sender: 'system',
          timestamp: new Date().toISOString(),
        }
      ]);
      
    } finally {
      setIsLoading(false);
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

  // If not authenticated, show the Login component
  if (!authenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <div className="glass-panel">
        <header className="app-header">
          <div className="header-top">
            <h1>AI Socratic Seminar</h1>
            <div className="user-info">
              {user ? (
                <>
                  {user.picture && <img src={user.picture} alt={user.name} className="user-avatar" />}
                  <span className="user-name">{user.name}</span>
                  <button className="logout-button" onClick={handleLogout}>
                    Sign Out
                  </button>
                </>
              ) : (
                <button className="login-button" onClick={() => setAuthenticated(false)}>
                  Log In
                </button>
              )}
            </div>
          </div>
          {hasMessages && (
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
          )}
        </header>

        <main className={`chat-container ${hasMessages ? 'has-messages' : 'no-messages'}`} ref={chatContainerRef}>
          {hasMessages ? (
            <div className="messages-container">
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
                      ${isRepliedTo ? 'is-replied-to' : ''}
                      ${message.isAnsweringQuestion ? 'answering-question' : ''}`}
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
                      
                      {message.isAnsweringQuestion && (
                        <div className="question-response-indicator">
                          <div className="question-icon">❓</div>
                          <div className="answering-text">
                            Answering question
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
                          <div className={`system-indicator ${message.isLoading ? 'loading-indicator' : ''}`}>
                            {message.isLoading ? '⟳' : 'i'}
                          </div>
                          <span className="system-label">
                            {message.isLoading ? 'Loading' : 'System'}
                          </span>
                        </div>
                      )}
                      <div className={`message-content ${message.isLoading ? 'loading-message' : ''}`}>
                        {message.displayedContent !== undefined ? message.displayedContent : message.content}
                        {message.isAnimating && <span className="cursor-blink">|</span>}
                        {message.isLoading && <span className="loading-dots"><span></span></span>}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>
          ) : null}

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
                placeholder={selectedPersonas.length === 0 
                  ? "Select personas to begin..." 
                  : autoDebate 
                    ? "Type @ to mention a specific persona..." 
                    : "Ask a philosophical question..."}
                disabled={isLoading || animatingText || selectedPersonas.length === 0}
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
        className={`floating-button ${hasMessages ? '' : 'prominent'}`}
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
      {showPersonasBin && (
        <div 
          ref={personasBinRef}
          className="personas-bin"
        >
          <div className="categories-container">
            {Object.entries(PERSONA_CATEGORIES).map(([categoryId, category]) => (
              <div className="category-section" key={categoryId}>
                <button
                  className={`category-button ${expandedCategories.includes(categoryId) ? 'expanded' : ''}`}
                  onClick={() => toggleCategory(categoryId)}
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
                    >
                      <div className="persona-info">
                        <span className="persona-name">{persona.name}</span>
                        <span className="persona-description">{persona.description}</span>
                      </div>
                      <div className="persona-status">
                        {selectedPersonas.includes(persona.id) ? (
                          <span className="check-icon">✓</span>
                        ) : (
                          <span className="plus-icon">+</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                onClick={() => handleMentionSelect(personaId)}
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

      {debugMode && debugInfo && (
        <div className="debug-panel">
          <h3>Debug Information</h3>
          <div>
            <strong>Response Status:</strong> {debugInfo.responseStatus}
          </div>
          <div>
            <strong>Response Text:</strong>
            <pre>{debugInfo.responseText}</pre>
          </div>
          <div>
            <strong>Parsed Data:</strong>
            <pre>{JSON.stringify(debugInfo.parsedData, null, 2)}</pre>
          </div>
          <div>
            <strong>Processed Response Array:</strong>
            <pre>{JSON.stringify(debugInfo.responseArray, null, 2)}</pre>
          </div>
          <div>
            <strong>Sanitized Array:</strong>
            <pre>{JSON.stringify(debugInfo.sanitizedArray, null, 2)}</pre>
          </div>
          <div>
            <strong>Persona Responses:</strong>
            <pre>{JSON.stringify(debugInfo.personaResponses, null, 2)}</pre>
          </div>
          <button onClick={() => setDebugInfo(null)}>Clear</button>
        </div>
      )}

      {/* Debug Mode Toggle (hidden but can be enabled with keyboard shortcut) */}
      <div className="debug-toggle" style={{ display: 'none' }}>
        <button onClick={toggleDebugMode}>
          {debugMode ? 'Disable Debug' : 'Enable Debug'}
        </button>
      </div>
    </div>
  );
}

export default App; 