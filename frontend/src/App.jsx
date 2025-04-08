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
  const [apiKey, setApiKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(true);
  const [conversationId, setConversationId] = useState('');

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

  // Initialize conversation ID if needed
  useEffect(() => {
    if (!conversationId) {
      setConversationId(generateUUID());
    }
  }, [conversationId]);

  // Generate a random UUID for conversation ID
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || selectedPersonas.length === 0 || isLoading || animatingText || !apiKey) return;

    setIsLoading(true);
    
    try {
      // Add the user message immediately
      const userMessage = { 
        type: 'user', 
        content: inputText,
        conversationId: conversationId 
      };
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

      // Collect all previous messages for context
      const contextMessages = messages.map(msg => {
        if (msg.type === 'user') {
          return { role: 'user', content: msg.content };
        } else if (msg.type === 'persona') {
          return { role: 'assistant', content: `${getPersonaName(msg.personaId)}: ${msg.content}` };
        } else {
          return { role: 'system', content: msg.content };
        }
      });

      // Array to store all persona responses
      const personaResponses = [];

      // Get responses from each selected persona
      for (const personaId of agentsToUse) {
        const prompt = AGENT_PROMPTS[personaId] || `You are ${getPersonaName(personaId)}, responding to a question in a multi-agent conversation.`;
        
        // Create the message array with system prompt + context + user query
        const messages = [
          { role: 'system', content: prompt },
          ...contextMessages,
          { role: 'user', content: inputText }
        ];

        // Call OpenAI API directly
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: messages,
            temperature: 0.7,
            max_tokens: 500
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`OpenAI API error: ${response.status}, ${errorText}`);
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Add to personaResponses
        personaResponses.push({
          type: 'persona',
          personaId: personaId,
          content: data.choices[0].message.content,
          timestamp: new Date().toISOString(),
          conversationId: conversationId,
          displayedContent: '', // Initialize with empty string for animation
          fullContent: data.choices[0].message.content // Store the full content
        });
      }

      // Reset direct mention after submission
      setDirectMentionTo(null);
      
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
      
      // If auto-debate is enabled and we have multiple personas, generate some additional conversation
      if (autoDebate && selectedPersonas.length > 1 && maxRounds > 0) {
        await generateAutoDebate(updatedMessages, maxRounds);
      }
      
      setAnimatingText(false);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      // Add error message to chat
      setMessages(prev => [...prev, {
        type: 'system',
        content: `Error: ${error.message || 'There was an error getting responses. Please check your API key and try again.'}`,
        displayedContent: `Error: ${error.message || 'There was an error getting responses. Please check your API key and try again.'}`,
        timestamp: new Date().toISOString(),
        error: true
      }]);
      setAnimatingText(false);
    } finally {
      setIsLoading(false);
      scrollToBottom(); // Ensure we're scrolled to bottom after everything
    }
  };

  // Function to generate auto-debate responses
  const generateAutoDebate = async (currentMessages, rounds) => {
    if (rounds <= 0 || selectedPersonas.length < 2) return;
    
    try {
      for (let round = 0; round < rounds; round++) {
        // Select 2-3 random personas for this round
        const numAgents = Math.min(Math.floor(Math.random() * 2) + 2, selectedPersonas.length);
        const roundAgents = [...selectedPersonas].sort(() => 0.5 - Math.random()).slice(0, numAgents);
        
        // Get responses for each agent
        for (const personaId of roundAgents) {
          // Build context from all previous messages
          const contextMessages = currentMessages.map(msg => {
            if (msg.type === 'user') {
              return { role: 'user', content: msg.content };
            } else if (msg.type === 'persona') {
              return { role: 'assistant', content: `${getPersonaName(msg.personaId)}: ${msg.content || msg.displayedContent}` };
            } else {
              return { role: 'system', content: msg.content || msg.displayedContent };
            }
          });
          
          // Create instruction for the agent to respond to the conversation
          const otherAgentNames = selectedPersonas
            .filter(id => id !== personaId)
            .map(id => getPersonaName(id))
            .join(', ');
          
          const prompt = AGENT_PROMPTS[personaId] || `You are ${getPersonaName(personaId)}, responding to a question in a multi-agent conversation.`;
          const continuationPrompt = `You are ${getPersonaName(personaId)} in a group chat. Please respond to the ongoing discussion ONLY IF you have a valuable perspective or can challenge an idea constructively. You may directly address any of these participants by name in your response: ${otherAgentNames}. Be selective about which points you address - you don't need to respond to everything. Keep your response brief and focused on making a single strong point.`;
          
          // Call OpenAI API for this agent
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              messages: [
                { role: 'system', content: prompt },
                ...contextMessages,
                { role: 'user', content: continuationPrompt }
              ],
              temperature: 0.7,
              max_tokens: 300
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`OpenAI API error in auto-debate: ${response.status}, ${errorText}`);
            continue; // Skip this agent and try the next one
          }
          
          const data = await response.json();
          const agentResponse = data.choices[0].message.content;
          
          // Determine if this message is replying to another agent
          const replyToMessage = detectReplyTarget(agentResponse, personaId, currentMessages);
          
          // Add this response to messages with animation
          const newMessage = {
            type: 'persona',
            personaId: personaId,
            fullContent: agentResponse,
            displayedContent: '',
            isAnimating: true,
            timestamp: new Date().toISOString(),
            conversationId: conversationId,
            replyTo: replyToMessage
          };
          
          currentMessages.push(newMessage);
          setMessages([...currentMessages]);
          scrollToBottom();
          
          // Animate the text
          let displayedText = '';
          for (let j = 0; j < agentResponse.length; j++) {
            displayedText += agentResponse[j];
            currentMessages[currentMessages.length - 1].displayedContent = displayedText;
            setMessages([...currentMessages]);
            if (j % 20 === 0) scrollToBottom();
            await new Promise(resolve => setTimeout(resolve, 20));
          }
          
          // Mark animation as complete
          currentMessages[currentMessages.length - 1].isAnimating = false;
          setMessages([...currentMessages]);
          scrollToBottom();
          
          // Add delay between responses
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Add a final message
      currentMessages.push({
        type: 'system',
        content: 'The discussion has concluded. You may now respond or ask a follow-up question.',
        displayedContent: 'The discussion has concluded. You may now respond or ask a follow-up question.',
        timestamp: new Date().toISOString(),
        conversationId: conversationId
      });
      
      setMessages([...currentMessages]);
      scrollToBottom();
      
    } catch (error) {
      console.error('Error in auto-debate:', error);
      // Add error message
      setMessages(prev => [...prev, {
        type: 'system',
        content: 'Error generating auto-debate responses. The conversation has been cut short.',
        displayedContent: 'Error generating auto-debate responses. The conversation has been cut short.',
        timestamp: new Date().toISOString(),
        error: true
      }]);
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
          {showApiInput && (
            <div className="api-key-container">
              <input
                type="password"
                placeholder="Enter your OpenAI API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="api-key-input"
              />
              {apiKey && (
                <button 
                  className="api-key-confirm"
                  onClick={() => setShowApiInput(false)}
                >
                  Confirm
                </button>
              )}
              <p className="api-key-info">
                Your API key stays in your browser and is not stored on any server.
              </p>
            </div>
          )}
          {!showApiInput && (
            <button 
              className="change-api-key"
              onClick={() => setShowApiInput(true)}
            >
              Change API Key
            </button>
          )}
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