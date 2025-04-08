"""
Agent memory management system.
Stores conversation history and provides context for agents.
"""

import time
from typing import Dict, List, Optional, Any
from collections import defaultdict
from agent_config import get_agent_params, get_memory_template

class MemoryManager:
    def __init__(self):
        # Structure: {conversation_id: {agent_id: [messages]}}
        self.conversations: Dict[str, Dict[str, List[Dict[str, Any]]]] = defaultdict(lambda: defaultdict(list))
        
    def add_exchange(self, conversation_id: str, agent_id: str, question: str, response: str) -> None:
        """Add a question-response pair to an agent's memory for a specific conversation."""
        timestamp = time.time()
        
        # Store the exchange
        self.conversations[conversation_id][agent_id].append({
            "timestamp": timestamp,
            "question": question,
            "response": response
        })
    
    def get_context(self, conversation_id: str, agent_id: str, other_agents: bool = True) -> str:
        """
        Get conversation context for an agent.
        
        Args:
            conversation_id: Unique identifier for the conversation
            agent_id: The agent requesting context
            other_agents: Whether to include exchanges from other agents
            
        Returns:
            Formatted context string
        """
        if conversation_id not in self.conversations:
            return ""
            
        # Get agent-specific parameters
        params = get_agent_params(agent_id)
        memory_depth = params.get("memory_depth", 5)
        
        # Collect relevant exchanges
        exchanges = []
        
        # Add this agent's exchanges
        if agent_id in self.conversations[conversation_id]:
            agent_exchanges = self.conversations[conversation_id][agent_id]
            # Sort by timestamp and take the most recent up to memory_depth
            agent_exchanges = sorted(agent_exchanges, key=lambda x: x["timestamp"], reverse=True)[:memory_depth]
            
            for exchange in agent_exchanges:
                exchanges.append({
                    "agent": agent_id,
                    "question": exchange["question"],
                    "response": exchange["response"],
                    "timestamp": exchange["timestamp"]
                })
        
        # Add other agents' exchanges if requested
        if other_agents:
            other_exchanges = []
            for other_agent, agent_exchanges in self.conversations[conversation_id].items():
                if other_agent != agent_id:
                    for exchange in agent_exchanges:
                        other_exchanges.append({
                            "agent": other_agent,
                            "question": exchange["question"],
                            "response": exchange["response"],
                            "timestamp": exchange["timestamp"]
                        })
            
            # Take the most recent exchanges from other agents
            other_exchanges = sorted(other_exchanges, key=lambda x: x["timestamp"], reverse=True)[:memory_depth * 2]
            exchanges.extend(other_exchanges)
        
        # Sort all exchanges by timestamp
        exchanges = sorted(exchanges, key=lambda x: x["timestamp"])
        
        # Format the context
        context_parts = []
        for exchange in exchanges:
            context_parts.append(f"{exchange['agent'].replace('_', ' ').title()}: {exchange['response']}")
        
        context = "\n\n".join(context_parts)
        
        # Apply the appropriate memory template
        template = get_memory_template(agent_id)
        return template.format(context=context)
    
    def clear_conversation(self, conversation_id: str) -> None:
        """Clear the memory for a specific conversation."""
        if conversation_id in self.conversations:
            del self.conversations[conversation_id]

# Global memory manager instance
memory_manager = MemoryManager() 