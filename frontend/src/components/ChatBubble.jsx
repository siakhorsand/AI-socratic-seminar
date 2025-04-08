import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTypewriter } from 'react-simple-typewriter';

export function ChatBubble({ agent, text, index, isTyping = false }) {
  const [isMounted, setIsMounted] = useState(false);
  
  // Format agent name for display
  const agentName = agent.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
  
  // Typing effect
  const [typedText] = useTypewriter({
    words: [text],
    typeSpeed: 40,
    deleteSpeed: 50,
    delaySpeed: 1000,
    loop: 0,
  });
  
  // Delayed mount for animation sequence
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, index * 200);
    
    return () => clearTimeout(timer);
  }, [index]);
  
  // Generate a consistent avatar color based on agent name
  const getAvatarColor = (name) => {
    const colors = ['blue', 'purple', 'pink', 'indigo', 'cyan'];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };
  
  const avatarColor = getAvatarColor(agent);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={isMounted ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20,
        duration: 0.3 
      }}
      className={`w-full max-w-3xl mx-auto mb-4 ${index % 2 === 0 ? 'self-start mr-auto' : 'self-end ml-auto'}`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`shrink-0 mt-1 w-10 h-10 rounded-full flex items-center justify-center bg-${avatarColor}-500/20 backdrop-blur-md border border-${avatarColor}-500/30 shadow-glow-${avatarColor.includes('blue') ? 'blue' : 'purple'}`}
        >
          <span className={`text-${avatarColor}-400 font-bold text-lg`}>
            {agentName.charAt(0)}
          </span>
        </motion.div>
        
        {/* Chat bubble */}
        <div 
          className="flex-1 rounded-2xl px-5 py-4 bg-dark-100/60 backdrop-blur-md border border-white/10 shadow-glass overflow-hidden"
        >
          {/* Agent name */}
          <div className="flex items-center mb-2">
            <h4 className="font-semibold text-white/90 text-sm">
              {agentName}
            </h4>
          </div>
          
          {/* Message content with typing effect */}
          <p className="text-white/80 whitespace-pre-wrap text-sm leading-relaxed">
            {isTyping ? typedText : text}
            {isTyping && text !== typedText && (
              <span className="inline-flex gap-1 ml-1">
                <span className="w-1 h-1 rounded-full bg-white/60 animate-typing" />
                <span className="w-1 h-1 rounded-full bg-white/60 animate-typing" style={{ animationDelay: '0.2s' }} />
                <span className="w-1 h-1 rounded-full bg-white/60 animate-typing" style={{ animationDelay: '0.4s' }} />
              </span>
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
} 