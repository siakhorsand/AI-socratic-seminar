import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import PersonaAvatar from './PersonaAvatar';
import { Users, Loader2 } from 'lucide-react';

const AgentSelector = ({ onSelectAgent, selectedAgents }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8001/api/agents');
      setCategories(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError('Failed to load agents. Please try again later.');
      setLoading(false);
    }
  };

  const handleAgentClick = (agent) => {
    onSelectAgent(agent);
  };

  // Check if an agent is selected
  const isAgentSelected = (agent) => {
    return selectedAgents.some(a => a.id === agent.id);
  };

  if (loading) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-white/30 animate-spin mb-4" />
        <p className="text-white/50 text-sm">Loading agents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center text-red-400 bg-red-500/10 rounded-lg border border-red-500/20 backdrop-blur-sm">
        <p className="text-lg font-medium mb-2">Unable to load agents</p>
        <p className="text-sm opacity-80">{error}</p>
        <button 
          onClick={fetchAgents}
          className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md text-sm transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full mb-6">
      {/* Category tabs */}
      <div className="relative flex items-center overflow-x-auto mb-6 pb-2 hide-scrollbar">
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
      </div>

      {/* Selected agents row */}
      {selectedAgents.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6"
        >
          <h3 className="text-white/60 text-xs uppercase mb-3 font-medium tracking-wider">Selected Personas</h3>
          <div className="flex flex-wrap items-center gap-4">
            {selectedAgents.map((agent, index) => (
              <PersonaAvatar
                key={agent.id}
                agent={agent}
                isSelected={true}
                onClick={() => handleAgentClick(agent)}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Agent grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
        >
          {categories[activeTab]?.agents.map((agent) => (
            <motion.div
              key={agent.id}
              whileHover={{ y: -4 }}
              className="flex flex-col items-center"
            >
              <PersonaAvatar
                agent={agent}
                isSelected={isAgentSelected(agent)}
                onClick={() => handleAgentClick(agent)}
              />
              
              <div className="mt-6 text-center">
                <h3 className="text-white/80 text-sm font-medium">{agent.name}</h3>
                <p className="text-white/40 text-xs mt-1 line-clamp-2 max-w-[120px] mx-auto">{agent.description}</p>
                
                <div className="flex flex-wrap justify-center mt-2 gap-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50">
                    {agent.model?.replace('gpt-', '')}
                  </span>
                  {agent.debate_style && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50">
                      {agent.debate_style}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AgentSelector; 