import { motion } from 'framer-motion';

export default function PersonaAvatar({ agent, isActive, onClick, isSelected }) {
  // Format agent name for display
  const agentName = agent.name || (
    agent.id?.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  );
  
  // Get avatar image or emoji
  const avatarContent = agent.avatar || agentName.charAt(0);
  
  // Generate consistent color for personas without specific avatars
  const generateColor = (name) => {
    const colors = ['blue', 'purple', 'pink', 'indigo', 'cyan'];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };
  
  const color = agent.color || generateColor(agent.id || agent.name);
  const gradientMap = {
    'blue': 'from-blue-400 to-cyan-400',
    'purple': 'from-purple-400 to-pink-400',
    'pink': 'from-pink-400 to-rose-400',
    'indigo': 'from-indigo-400 to-blue-400',
    'cyan': 'from-cyan-400 to-teal-400',
  };
  
  const gradient = gradientMap[color] || 'from-blue-400 to-cyan-400';
  
  return (
    <motion.div
      onClick={onClick}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ 
        scale: isActive ? 1.05 : 1, 
        opacity: 1 
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 15 
      }}
      className="relative cursor-pointer"
    >
      {/* Selection ring */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, scale: 1.2 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`absolute -inset-1 rounded-full bg-gradient-to-r ${gradient} opacity-70 blur-sm`}
        />
      )}
      
      {/* Active pulse animation */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: [0.4, 0.2, 0.4], scale: [1, 1.15, 1] }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className={`absolute -inset-2 rounded-full bg-gradient-to-r ${gradient} opacity-30 blur-md`}
        />
      )}
      
      {/* Avatar circle */}
      <div className={`
        relative w-12 h-12 flex items-center justify-center rounded-full
        backdrop-blur-md border 
        ${isSelected 
          ? `border-white/30 bg-gradient-to-r ${gradient}` 
          : 'border-white/10 bg-dark-200/80'}
        shadow-glass z-10
      `}>
        <span className={`text-lg ${isSelected ? 'text-white' : 'text-white/80'}`}>
          {avatarContent}
        </span>
      </div>
      
      {/* Name tooltip */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
        <span className="text-xs text-white/60 font-medium">
          {agentName.length > 12 ? `${agentName.substring(0, 10)}...` : agentName}
        </span>
      </div>
    </motion.div>
  );
} 