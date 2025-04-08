import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';

export default function InputBar({ onSubmit, isLoading }) {
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);
  
  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSubmit(message);
      setMessage('');
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky bottom-0 w-full py-4 z-10"
    >
      <div className="max-w-4xl mx-auto px-4">
        <form 
          onSubmit={handleSubmit}
          className="relative flex items-center w-full backdrop-blur-lg bg-dark-100/60 border border-white/10 rounded-2xl shadow-glass overflow-hidden"
        >
          {/* Glow effect at the border */}
          <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/10 to-neon-purple/10 opacity-50" />
          
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading}
            placeholder="Ask a question..."
            className="flex-1 bg-transparent border-0 focus:ring-0 text-white/90 placeholder-white/40 py-4 px-5 text-base"
          />
          
          <div className="px-3">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 className="animate-spin text-white/60 w-5 h-5" />
                  <span className="text-white/60 text-sm">Thinking</span>
                </motion.div>
              ) : (
                <motion.button
                  key="send"
                  type="submit"
                  disabled={!message.trim() || isLoading}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: message.trim() ? 1 : 0.5, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`rounded-full p-2 ${
                    message.trim() 
                      ? 'bg-gradient-to-r from-neon-blue to-neon-purple hover:shadow-glow-blue' 
                      : 'bg-white/10'
                  } transition-all duration-300 ease-in-out`}
                >
                  <Send size={18} className="text-white" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </form>
      </div>
    </motion.div>
  );
} 