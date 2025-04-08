import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Trash2 } from 'lucide-react';
import ConvoModal from './ConvoModal';

export default function FloatingFAB({ conversations = [], onSelectConversation, onDeleteConversation }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleModal = () => {
    setIsOpen(!isOpen);
  };
  
  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={toggleModal}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full backdrop-blur-md 
                   bg-dark-100/60 border border-white/10 shadow-glass
                   flex items-center justify-center"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <MessageSquare className="w-6 h-6 text-white" />
              
              {/* Badge showing conversation count */}
              {conversations.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-neon-blue flex items-center justify-center text-white text-xs">
                  {conversations.length}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Glow effect */}
        <motion.div 
          animate={{ 
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            repeat: Infinity,
            duration: 4,
            ease: "easeInOut",
          }}
          className="absolute inset-0 rounded-full bg-neon-blue blur-lg opacity-30 -z-10"
        />
      </motion.button>
      
      {/* Modal backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={toggleModal}
          />
        )}
      </AnimatePresence>
      
      {/* Conversations Modal */}
      <AnimatePresence>
        {isOpen && (
          <ConvoModal 
            conversations={conversations}
            onClose={toggleModal}
            onSelect={(convo) => {
              onSelectConversation(convo);
              toggleModal();
            }}
            onDelete={onDeleteConversation}
          />
        )}
      </AnimatePresence>
    </>
  );
} 