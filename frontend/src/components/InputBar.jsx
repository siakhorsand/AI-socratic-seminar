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
      className="fixed bottom-0 left-0 right-0 z-20 pointer-events-none"
    >
      <div className="max-w-4xl mx-auto px-4 pb-4">
        <form 
          onSubmit={handleSubmit}
          className="relative flex items-center w-full pointer-events-auto"
        >
          {/* Glassy background effect */}
          <div className="absolute inset-0 rounded-2xl backdrop-blur-xl bg-gradient-to-b from-black/30 via-black/20 to-black/30 border border-white/10 shadow-lg" />
          
          {/* Subtle glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-neon-blue/5 to-neon-purple/5 opacity-50" />
          
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading}
            placeholder="Ask a question..."
            className="relative flex-1 bg-transparent border-0 focus:ring-0 text-white/90 placeholder-white/40 py-4 px-5 text-base"
          />
          
          <div className="relative px-3 flex items-center h-full">
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
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center justify-center h-10 w-10 rounded-xl transition-all duration-300 ease-out ${
                    message.trim() 
                      ? 'bg-gradient-to-br from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 shadow-sm' 
                      : 'bg-white/5'
                  }`}
                >
                  <Send size={18} className={`${message.trim() ? 'text-white' : 'text-white/40'} transition-colors duration-300`} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </form>
      </div>
    </motion.div>
  );
} 