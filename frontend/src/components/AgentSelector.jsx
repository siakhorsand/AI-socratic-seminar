import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import PersonaAvatar from './PersonaAvatar';
import { Users, Loader2 } from 'lucide-react';

// Predefined categories and agents based on our JSONL files
const AGENT_CATEGORIES = [
  {
    category: "Philosophers & Thinkers",
    agents: [
      { id: "socrates", name: "Socrates", description: "Ancient Greek philosopher focused on questioning and critical thinking" },
      { id: "coyote_void", name: "Coyote Void", description: "Trickster philosopher exploring paradox and uncertainty" },
      { id: "mira_tide", name: "Mira Tide", description: "Empathic philosopher focused on emotional intelligence" },
      { id: "athena_vox", name: "Athena Vox", description: "Strategic wisdom keeper and decision maker" }
    ]
  },
  {
    category: "Scientists & Innovators",
    agents: [
      { id: "nikola_tesla", name: "Nikola Tesla", description: "Visionary inventor focused on electricity and energy" },
      { id: "ada_lovelace", name: "Ada Lovelace", description: "Pioneer of computational thinking and algorithms" },
      { id: "lyra_quark", name: "Lyra Quark", description: "Quantum physics explorer and theorist" }
    ]
  },
  {
    category: "Strategists & Analysts",
    agents: [
      { id: "jade_loop", name: "Jade Loop", description: "Lean startup methodology expert" },
      { id: "sabine_flux", name: "Sabine Flux", description: "Market trend analyst and strategist" },
      { id: "nadia_zenith", name: "Nadia Zenith", description: "Operational excellence specialist" }
    ]
  },
  {
    category: "Storytellers & Creatives",
    agents: [
      { id: "duke_noir", name: "Duke Noir", description: "Noir storyteller exploring shadows and mysteries" },
      { id: "seren_aria", name: "Seren Aria", description: "Mythic storyteller working with archetypes" },
      { id: "ava_prism", name: "Ava Prism", description: "Cinematic storyteller crafting visual narratives" },
      { id: "haru_pulse", name: "Haru Pulse", description: "Haiku minimalist focused on essence" }
    ]
  },
  {
    category: "Visionaries & Innovators",
    agents: [
      { id: "solaris_blaze", name: "Solaris Blaze", description: "Optimistic visionary focused on future possibilities" },
      { id: "nova_verge", name: "Nova Verge", description: "AI alignment and safety specialist" },
      { id: "kai_helix", name: "Kai Helix", description: "Synthetic biology and biohacking expert" }
    ]
  }
];

const AgentSelector = ({ onSelectAgent, selectedAgents, isOpen, onClose }) => {
  const [categories] = useState(AGENT_CATEGORIES);
  const [activeTab, setActiveTab] = useState(0);

  // Animation variants for the slide-in/out effect
  const containerVariants = {
    hidden: { 
      x: "100%",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40
      }
    },
    visible: { 
      x: 0,
      transition: { 
        type: "spring",
        stiffness: 400,
        damping: 40,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: { 
      x: "100%",
      transition: { 
        type: "spring",
        stiffness: 400,
        damping: 40,
        when: "afterChildren",
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      opacity: 0, 
      y: 20,
      transition: {
        duration: 0.2
      }
    }
  };

  const handleAgentClick = (agent) => {
    onSelectAgent(agent);
  };

  const isAgentSelected = (agent) => {
    return selectedAgents.some(a => a.id === agent.id);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[600px] bg-dark-200/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-50 overflow-hidden"
          >
            <motion.div className="h-full overflow-y-auto">
              <div className="p-6">
                <motion.div 
                  variants={itemVariants}
                  className="flex items-center justify-between mb-8"
                >
                  <h2 className="text-xl font-semibold text-white">Select Agents</h2>
                  <button 
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <span className="text-white/60 hover:text-white">×</span>
                  </button>
                </motion.div>

                {/* Category tabs */}
                <motion.div 
                  variants={itemVariants}
                  className="relative flex items-center overflow-x-auto mb-6 pb-2 hide-scrollbar"
                >
                  <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
                  
                  {categories.map((category, index) => (
                    <button
                      key={index}
                      className={`px-4 py-2 flex-none text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 ${
                        activeTab === index 
                          ? 'text-white border-neon-blue' 
                          : 'text-white/40 border-transparent hover:text-white/70 hover:border-white/20'
                      }`}
                      onClick={() => setActiveTab(index)}
                    >
                      {category.category}
                    </button>
                  ))}
                </motion.div>

                {/* Selected agents row */}
                {selectedAgents.length > 0 && (
                  <motion.div 
                    variants={itemVariants}
                    className="mb-6"
                  >
                    <h3 className="text-white/60 text-xs uppercase mb-3 font-medium tracking-wider">Selected Personas</h3>
                    <div className="flex flex-wrap items-center gap-4">
                      {selectedAgents.map((agent) => (
                        <motion.div
                          key={agent.id}
                          variants={itemVariants}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <PersonaAvatar
                            agent={agent}
                            isSelected={true}
                            onClick={() => handleAgentClick(agent)}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Agent grid */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-6"
                  >
                    {categories[activeTab]?.agents.map((agent) => (
                      <motion.div
                        key={agent.id}
                        variants={itemVariants}
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex flex-col items-center"
                      >
                        <PersonaAvatar
                          agent={agent}
                          isSelected={isAgentSelected(agent)}
                          onClick={() => handleAgentClick(agent)}
                        />
                        
                        <div className="mt-4 text-center">
                          <h3 className="text-white/80 text-sm font-medium">{agent.name}</h3>
                          <p className="text-white/40 text-xs mt-1 line-clamp-2 max-w-[140px] mx-auto">{agent.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AgentSelector; 