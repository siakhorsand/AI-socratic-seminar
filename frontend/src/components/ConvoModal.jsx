import { motion } from 'framer-motion';
import { Trash2, MessageSquareText } from 'lucide-react';

export default function ConvoModal({ conversations = [], onClose, onSelect, onDelete }) {
  if (conversations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed bottom-24 left-6 z-50 w-80 rounded-xl backdrop-blur-lg 
                 bg-dark-100/80 border border-white/10 shadow-glass
                 py-4 px-4 overflow-hidden"
      >
        <h2 className="text-white font-semibold text-lg mb-4">Conversations</h2>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MessageSquareText className="text-white/30 w-12 h-12 mb-4" />
          <p className="text-white/60 text-sm">No conversations yet</p>
          <p className="text-white/40 text-xs mt-2">Start a new conversation to see it here</p>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="fixed bottom-24 left-6 z-50 w-80 rounded-xl backdrop-blur-lg 
               bg-dark-100/80 border border-white/10 shadow-glass
               py-4 px-1 overflow-hidden"
    >
      <div className="px-3 mb-2">
        <h2 className="text-white font-semibold text-lg">Conversations</h2>
      </div>
      
      <div className="max-h-96 overflow-y-auto custom-scrollbar pr-2">
        {conversations.map((convo, index) => (
          <ConversationCard
            key={convo.id}
            conversation={convo}
            index={index}
            onSelect={() => onSelect(convo)}
            onDelete={() => onDelete(convo.id)}
          />
        ))}
      </div>
    </motion.div>
  );
}

// Card component for each conversation
function ConversationCard({ conversation, index, onSelect, onDelete }) {
  // Generate a truncated preview from the conversation
  const preview = conversation.preview || 
    (conversation.question ? 
      `${conversation.question.substring(0, 60)}${conversation.question.length > 60 ? '...' : ''}` : 
      'Conversation');
  
  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Recent';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  const formattedDate = formatDate(conversation.timestamp);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, x: 5 }}
      className="relative mx-2 my-2 rounded-lg backdrop-blur-sm bg-white/5 border border-white/10 
                 overflow-hidden group cursor-pointer"
    >
      {/* Interactive card with hover effects */}
      <div 
        onClick={onSelect}
        className="p-3 relative z-10"
      >
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-white/90 text-sm line-clamp-1">
            {conversation.title || 'Untitled Conversation'}
          </h3>
          <span className="text-white/40 text-xs">{formattedDate}</span>
        </div>
        
        <p className="text-white/60 text-xs mt-1 line-clamp-2">
          {preview}
        </p>
        
        {/* Agent avatars */}
        {conversation.agents && conversation.agents.length > 0 && (
          <div className="flex -space-x-2 mt-2">
            {conversation.agents.slice(0, 3).map((agent, i) => (
              <div 
                key={i}
                className="w-6 h-6 rounded-full bg-dark-200 border border-white/10 flex items-center justify-center"
              >
                <span className="text-white/70 text-xs">
                  {agent.charAt(0).toUpperCase()}
                </span>
              </div>
            ))}
            {conversation.agents.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-dark-200 border border-white/10 flex items-center justify-center">
                <span className="text-white/70 text-xs">+{conversation.agents.length - 3}</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Delete button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity 
                   w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center"
      >
        <Trash2 className="w-3 h-3 text-red-400" />
      </motion.button>
      
      {/* Background gradient highlight on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/5 to-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
} 