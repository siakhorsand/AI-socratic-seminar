import React, { useState, useEffect } from 'react';
import '../styles/AgentConfig.css';

const modelOptions = [
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Default)' },
  { value: 'gpt-4', label: 'GPT-4 (Advanced)' },
];

const AgentConfig = ({ agent, onSave, onClose }) => {
  const [config, setConfig] = useState({
    model: 'gpt-3.5-turbo',
    temperature: 0.8,
    max_tokens: 500,
    persona_strength: 1.0,
    memory_depth: 5,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Set initial values based on agent
    if (agent) {
      // In a real app, you would fetch the current config from the backend
      setConfig({
        model: agent.model || 'gpt-3.5-turbo',
        temperature: 0.8,
        max_tokens: 500,
        persona_strength: 1.0,
        memory_depth: 5,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
      });
    }
  }, [agent]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;
    
    // Parse numeric values
    if (['temperature', 'max_tokens', 'persona_strength', 'memory_depth', 
         'frequency_penalty', 'presence_penalty'].includes(name)) {
      parsedValue = parseFloat(value);
    }
    
    setConfig({
      ...config,
      [name]: parsedValue
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // This would update the backend in a real implementation
      // const response = await fetch('/api/agent/configure', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     agent_id: agent.id,
      //     parameters: config
      //   })
      // });
      // 
      // if (!response.ok) throw new Error('Failed to update configuration');
      // const data = await response.json();
      
      // For now, just simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onSave && onSave({
        ...agent,
        ...config
      });
      
      onClose && onClose();
    } catch (err) {
      setError(err.message || 'Failed to update configuration');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!agent) return null;
  
  return (
    <div className="agent-config-overlay">
      <div className="agent-config-modal">
        <div className="agent-config-header">
          <h2>Configure {agent.name}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="config-section">
            <h3>Basic Settings</h3>
            
            <div className="form-group">
              <label htmlFor="model">Model</label>
              <select 
                id="model" 
                name="model" 
                value={config.model}
                onChange={handleChange}
              >
                {modelOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="field-description">
                GPT-4 provides higher quality responses but may be slower and more expensive.
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="temperature">Temperature: {config.temperature.toFixed(1)}</label>
              <input 
                type="range" 
                id="temperature" 
                name="temperature"
                min="0.0" 
                max="2.0" 
                step="0.1" 
                value={config.temperature}
                onChange={handleChange}
              />
              <div className="range-labels">
                <span>Focused</span>
                <span>Creative</span>
              </div>
              <div className="field-description">
                Controls creativity and randomness. Lower values are more focused,
                higher values are more creative.
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="max_tokens">Max Tokens: {config.max_tokens}</label>
              <input 
                type="range" 
                id="max_tokens" 
                name="max_tokens"
                min="100" 
                max="1000" 
                step="50" 
                value={config.max_tokens}
                onChange={handleChange}
              />
              <div className="range-labels">
                <span>Shorter</span>
                <span>Longer</span>
              </div>
              <div className="field-description">
                Maximum length of the response.
              </div>
            </div>
          </div>
          
          <div className="config-section">
            <h3>Advanced Settings</h3>
            
            <div className="form-group">
              <label htmlFor="persona_strength">Persona Strength: {config.persona_strength.toFixed(1)}</label>
              <input 
                type="range" 
                id="persona_strength" 
                name="persona_strength"
                min="0.1" 
                max="2.0" 
                step="0.1" 
                value={config.persona_strength}
                onChange={handleChange}
              />
              <div className="range-labels">
                <span>Neutral</span>
                <span>Strong</span>
              </div>
              <div className="field-description">
                How strongly the agent adheres to its defined persona.
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="memory_depth">Memory Depth: {config.memory_depth}</label>
              <input 
                type="range" 
                id="memory_depth" 
                name="memory_depth"
                min="1" 
                max="10" 
                step="1" 
                value={config.memory_depth}
                onChange={handleChange}
              />
              <div className="range-labels">
                <span>Recent</span>
                <span>Deep</span>
              </div>
              <div className="field-description">
                How many previous exchanges the agent remembers.
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="frequency_penalty">Frequency Penalty: {config.frequency_penalty.toFixed(1)}</label>
              <input 
                type="range" 
                id="frequency_penalty" 
                name="frequency_penalty"
                min="0.0" 
                max="2.0" 
                step="0.1" 
                value={config.frequency_penalty}
                onChange={handleChange}
              />
              <div className="field-description">
                Reduces repetition of the same phrases. Higher values reduce repetition.
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="presence_penalty">Presence Penalty: {config.presence_penalty.toFixed(1)}</label>
              <input 
                type="range" 
                id="presence_penalty" 
                name="presence_penalty"
                min="0.0" 
                max="2.0" 
                step="0.1" 
                value={config.presence_penalty}
                onChange={handleChange}
              />
              <div className="field-description">
                Encourages discussing new topics. Higher values increase topic diversity.
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="secondary-button" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            
            <button 
              type="submit" 
              className="primary-button" 
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgentConfig; 