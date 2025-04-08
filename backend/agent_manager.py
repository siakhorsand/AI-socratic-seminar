"""
Enhanced agent manager for handling all agent interactions.
"""

import asyncio
import time
import uuid
from typing import Dict, List, Optional, Any, Union
import logging

from openai import OpenAI
from memory import memory_manager
from agent_config import get_agent_params, get_few_shot_examples

logger = logging.getLogger(__name__)

class AgentManager:
    def __init__(self, client: OpenAI, agent_prompts: Dict[str, str]):
        self.client = client
        self.agent_prompts = agent_prompts
        
    async def get_response(self, 
                          agent_id: str, 
                          question: str, 
                          conversation_id: Optional[str] = None,
                          include_context: bool = True,
                          custom_context: Optional[str] = None) -> Dict[str, str]:
        """
        Get a response from an agent for a given question.
        
        Args:
            agent_id: The ID of the agent to query
            question: The question or prompt to send to the agent
            conversation_id: Optional ID for the conversation (for memory)
            include_context: Whether to include conversation context
            custom_context: Optional custom context string to use instead of memory context
            
        Returns:
            Dictionary with agent ID and response
        """
        try:
            # Generate a conversation ID if none provided
            if not conversation_id:
                conversation_id = str(uuid.uuid4())
                
            # Get base system prompt for the agent
            system_prompt = self.agent_prompts.get(agent_id, "You are an AI assistant. Please provide your perspective.")
            
            # Add group chat instructions to system prompt
            system_prompt += """

IMPORTANT INSTRUCTIONS FOR GROUP CHAT:
1. Keep your responses concise and to the point (2-3 paragraphs maximum).
2. Only respond to messages when you have a valuable perspective or can constructively challenge the previous point.
3. When responding to another agent, address them directly by name.
4. If an idea is complex, express it clearly but briefly - imagine this is a fast-moving group chat.
5. Focus on making one clear point rather than covering multiple angles.
"""
            
            # Get agent-specific parameters
            params = get_agent_params(agent_id)
            # Always use gpt-3.5-turbo regardless of what's in params
            model = "gpt-3.5-turbo"
            temperature = params.get("temperature", 0.8)
            max_tokens = params.get("max_tokens", 350)  # Reduced from 500 to encourage brevity
            frequency_penalty = params.get("frequency_penalty", 0.2)  # Increased to discourage repetition
            presence_penalty = params.get("presence_penalty", 0.2)  # Increased to encourage diversity
            top_p = params.get("top_p", 1.0)
            persona_strength = params.get("persona_strength", 1.0)
            
            # Log agent parameters
            logger.debug(f"Using agent {agent_id} with params: model={model}, temp={temperature}, tokens={max_tokens}")
            
            # Get conversation context if available and requested
            context = ""
            if custom_context is not None:
                logger.debug(f"Using custom context for agent {agent_id}")
                context = custom_context
            elif include_context:
                logger.debug(f"Using memory context for agent {agent_id}")
                context = memory_manager.get_context(conversation_id, agent_id)
                
            # Get few-shot examples if available
            few_shot_examples = get_few_shot_examples(agent_id)
            
            # Build the messages array
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add persona strength guidance
            if persona_strength != 1.0:
                persona_guidance = ""
                if persona_strength > 1.0:
                    # Stronger persona
                    strength_level = min(int((persona_strength - 1.0) * 10), 10)
                    persona_guidance = f"""
                    IMPORTANT: Embody this persona very strongly (level {strength_level}/10). 
                    Closely adopt the specific language patterns, philosophical frameworks, and 
                    communication style described. Your responses should be distinctively 
                    recognizable as this persona.
                    """
                else:
                    # Weaker persona
                    strength_level = min(int((1.0 - persona_strength) * 10), 10)
                    persona_guidance = f"""
                    Note: While maintaining the general expertise and perspective described,
                    speak with a more neutral and balanced tone (persona strength reduced by
                    level {strength_level}/10). Focus more on factual content than on stylistic 
                    elements of the persona.
                    """
                
                messages.append({"role": "system", "content": persona_guidance})
            
            # Add context if available
            if context:
                messages.append({"role": "system", "content": context})
            
            # Add few-shot examples if available
            for example in few_shot_examples:
                messages.append({"role": "user", "content": example["question"]})
                messages.append({"role": "assistant", "content": example["response"]})
            
            # Add the actual question
            messages.append({"role": "user", "content": question})
            
            # Log request details
            logger.debug(f"Making request for agent {agent_id} with {len(messages)} messages")
            start_time = time.time()
            
            # Make the API call
            response = await asyncio.to_thread(
                lambda: self.client.chat.completions.create(
                    model=model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    frequency_penalty=frequency_penalty,
                    presence_penalty=presence_penalty,
                    top_p=top_p
                )
            )
            
            # Extract and process the response
            duration = time.time() - start_time
            answer = response.choices[0].message.content
            
            logger.info(f"Received response from {agent_id} in {duration:.2f}s ({len(answer)} chars)")
            logger.debug(f"Response preview: {answer[:70]}...")
            
            # Store in memory
            memory_manager.add_exchange(conversation_id, agent_id, question, answer)
            
            return {
                "agent": agent_id,
                "response": answer,
                "model": model,
                "conversation_id": conversation_id
            }
            
        except Exception as e:
            logger.error(f"Error getting response from {agent_id}: {str(e)}")
            logger.error(f"Full error details: {repr(e)}")
            raise
    
    async def get_multiple_responses(self, 
                                    agent_ids: List[str], 
                                    question: str,
                                    conversation_id: Optional[str] = None) -> List[Dict[str, str]]:
        """
        Get responses from multiple agents concurrently.
        
        Args:
            agent_ids: List of agent IDs to query
            question: The question to send to all agents
            conversation_id: Optional ID for the conversation
            
        Returns:
            List of dictionaries with agent responses
        """
        if not conversation_id:
            conversation_id = str(uuid.uuid4())
            
        tasks = []
        for agent_id in agent_ids:
            tasks.append(self.get_response(agent_id, question, conversation_id))
            
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions
        valid_responses = [resp for resp in responses if isinstance(resp, dict)]
        
        return valid_responses
    
    def get_available_agents(self):
        """Return a list of available agents with their details."""
        available_agents = []
        
        # These are all the agents we support
        agent_ids = [
            # Thinkers and Philosophers
            "socrates", "nietzsche", "alan_watts", "simone_de_beauvoir",
            
            # Analysts and Experts
            "business_analyst", "financial_expert", "data_scientist", "market_strategist", "expert",
            
            # Historical Figures
            "einstein", "newton", "darwin", "feynman",
            
            # Fictional and Mythic
            "superhero", "mythical_sage", "fantasy_wizard", "legendary_warrior",
            
            # Archetypes and Vibes
            "scorpio", "visionary", "devil_advocate", "idealist"
        ]
        
        for agent_id in agent_ids:
            try:
                params = get_agent_params(agent_id)
                
                # Create a readable name from the agent ID
                name = agent_id.replace("_", " ").title()
                
                # Get debate style and reasoning framework if available
                debate_style = params.get("debate_style", "standard")
                reasoning_framework = params.get("reasoning_framework", "general")
                
                # Always use gpt-3.5-turbo model
                model = "gpt-3.5-turbo"
                
                agent_details = {
                    "id": agent_id,
                    "name": name,
                    "description": f"A {debate_style} agent using {reasoning_framework} reasoning",
                    "model": model,
                    "debate_style": debate_style,
                    "reasoning_framework": reasoning_framework
                }
                
                available_agents.append(agent_details)
            except Exception as e:
                logger.error(f"Error getting details for agent {agent_id}: {str(e)}")
        
        return available_agents 