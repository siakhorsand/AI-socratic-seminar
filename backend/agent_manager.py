"""
Enhanced agent manager for handling all agent interactions.
"""

import asyncio
import time
import uuid
from typing import Dict, List, Optional, Any, Union
import logging

from memory import memory_manager
from agent_config import get_agent_params, get_few_shot_examples
from huggingface_client import HuggingFaceClient, HuggingFaceError, retry_with_exponential_backoff
from websocket_manager import manager

logger = logging.getLogger(__name__)

class AgentManager:
    def __init__(self, huggingface_client: HuggingFaceClient, agent_prompts: Dict[str, str]):
        self.client = huggingface_client
        self.agent_prompts = agent_prompts
        self.conversations: Dict[str, List[Dict[str, Any]]] = {}
        logger.info("AgentManager initialized with enhanced error handling")
        
    @retry_with_exponential_backoff()
    async def get_agent_response(self, agent_id: str, conversation_context: List[Dict[str, Any]], conversation_id: str, **kwargs) -> str:
        """
        Get a response from an agent with enhanced error handling, retry logic, and WebSocket updates
        """
        message_id = str(uuid.uuid4())
        try:
            # Signal that agent is typing
            await manager.send_agent_typing(conversation_id, agent_id, True)
            
            # Build the prompt for the agent
            system_prompt = self.agent_prompts.get(agent_id, "You are a helpful AI assistant.")
            messages = [{"role": "system", "content": system_prompt}]
            messages.extend(conversation_context)

            # Get completion from Hugging Face
            agent_params = get_agent_params(agent_id)
            response = await self.client.create_chat_completion(
                messages=messages,
                max_tokens=agent_params.get("max_tokens", 500),
                temperature=agent_params.get("temperature", 0.7),
                top_p=agent_params.get("top_p", 0.95),
                **kwargs
            )

            # Extract the response text
            response_text = response["choices"][0]["message"]["content"].strip()
            
            # Send the complete response through WebSocket
            await manager.send_agent_response(conversation_id, agent_id, response_text, message_id)
            
            # Signal that agent is done typing
            await manager.send_agent_typing(conversation_id, agent_id, False)

            return response_text

        except HuggingFaceError as e:
            # Signal that agent is no longer typing and send error
            await manager.send_agent_typing(conversation_id, agent_id, False)
            await manager.send_error(conversation_id, agent_id, str(e))
            
            logger.error(f"Error getting agent response for {agent_id}",
                        extra={
                            "error": str(e),
                            "agent_id": agent_id,
                            "error_type": type(e).__name__
                        })
            raise
        except Exception as e:
            # Signal that agent is no longer typing and send error
            await manager.send_agent_typing(conversation_id, agent_id, False)
            await manager.send_error(conversation_id, agent_id, "An unexpected error occurred")
            
            logger.error(f"Unexpected error in get_agent_response for {agent_id}: {str(e)}",
                        extra={
                            "error": str(e),
                            "agent_id": agent_id,
                            "error_type": type(e).__name__
                        })
            raise

    async def create_conversation(self, conversation_id: str, question: str, agent_ids: List[str], **kwargs) -> List[Dict[str, Any]]:
        """
        Create a new conversation with enhanced error handling and WebSocket updates
        """
        try:
            # Initialize conversation history
            self.conversations[conversation_id] = []
            
            # Add the user's question
            self.conversations[conversation_id].append({
                "role": "user",
                "content": question
            })

            responses = []
            for agent_id in agent_ids:
                try:
                    response = await self.get_agent_response(
                        agent_id,
                        self.conversations[conversation_id],
                        conversation_id,
                        **kwargs
                    )
                    
                    agent_message = {
                        "role": "assistant",
                        "content": response,
                        "agent_id": agent_id
                    }
                    
                    self.conversations[conversation_id].append(agent_message)
                    responses.append(agent_message)
                
                except HuggingFaceError as e:
                    logger.error(f"Error getting response from agent {agent_id}",
                               extra={
                                   "error": str(e),
                                   "conversation_id": conversation_id,
                                   "agent_id": agent_id
                               })
                    # Continue with other agents if one fails
                    continue

            if not responses:
                raise HuggingFaceError("Failed to get any valid responses from agents")
                
            # Broadcast conversation update to all connected clients
            await manager.broadcast_conversation_update(conversation_id, responses)

            return responses

        except Exception as e:
            logger.error(f"Error in create_conversation",
                        extra={
                            "error": str(e),
                            "conversation_id": conversation_id,
                            "error_type": type(e).__name__
                        })
            raise

    async def continue_conversation(self, conversation_id: str, question: Optional[str], agent_ids: List[str], **kwargs) -> List[Dict[str, Any]]:
        """
        Continue an existing conversation with enhanced error handling and WebSocket updates
        """
        try:
            if conversation_id not in self.conversations:
                raise ValueError(f"Conversation {conversation_id} not found")

            if question:
                self.conversations[conversation_id].append({
                    "role": "user",
                    "content": question
                })

            responses = []
            for agent_id in agent_ids:
                try:
                    response = await self.get_agent_response(
                        agent_id,
                        self.conversations[conversation_id],
                        conversation_id,
                        **kwargs
                    )
                    
                    agent_message = {
                        "role": "assistant",
                        "content": response,
                        "agent_id": agent_id
                    }
                    
                    self.conversations[conversation_id].append(agent_message)
                    responses.append(agent_message)
                
                except HuggingFaceError as e:
                    logger.error(f"Error getting response from agent {agent_id}",
                               extra={
                                   "error": str(e),
                                   "conversation_id": conversation_id,
                                   "agent_id": agent_id
                               })
                    # Continue with other agents if one fails
                    continue

            if not responses:
                raise HuggingFaceError("Failed to get any valid responses from agents")
                
            # Broadcast conversation update to all connected clients
            await manager.broadcast_conversation_update(conversation_id, responses)

            return responses

        except Exception as e:
            logger.error(f"Error in continue_conversation",
                        extra={
                            "error": str(e),
                            "conversation_id": conversation_id,
                            "error_type": type(e).__name__
                        })
            raise

    def get_conversation_history(self, conversation_id: str) -> List[Dict[str, Any]]:
        """
        Get the conversation history for a given conversation ID
        """
        if conversation_id not in self.conversations:
            raise ValueError(f"Conversation {conversation_id} not found")
        return self.conversations[conversation_id]

    def delete_conversation(self, conversation_id: str) -> None:
        """
        Delete a conversation and its history
        """
        if conversation_id in self.conversations:
            del self.conversations[conversation_id]
            logger.info(f"Deleted conversation {conversation_id}")
        else:
            logger.warning(f"Attempted to delete non-existent conversation {conversation_id}")
        
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
            model = params.get("model", "meta-llama/Llama-3-8B-Instruct")
            temperature = params.get("temperature", 0.8)
            max_tokens = params.get("max_tokens", 350)  # Reduced from 500 to encourage brevity
            top_p = params.get("top_p", 0.95)
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
                
                # Truncate context if it's too long to prevent token limit issues
                if len(context) > 4000:  # Approx 1000 tokens
                    logger.warning(f"Context for {agent_id} is too long ({len(context)} chars). Truncating...")
                    # Keep the beginning and end of the context, removing the middle
                    context_start = context[:1500]
                    context_end = context[-2500:]
                    context = f"{context_start}\n...\n[Context truncated for brevity]\n...\n{context_end}"
                
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
            
            # Add few-shot examples if available (limit to 2 examples max to save tokens)
            for example in few_shot_examples[:2]:
                messages.append({"role": "user", "content": example["question"]})
                messages.append({"role": "assistant", "content": example["response"]})
            
            # Add the actual question
            messages.append({"role": "user", "content": question})
            
            # Estimate total token count and truncate if necessary
            # Rough estimate: 4 chars ≈ 1 token
            total_chars = sum(len(msg["content"]) for msg in messages)
            estimated_tokens = total_chars // 4
            
            # If we're approaching the model's token limit, truncate the context
            if estimated_tokens > 3500:  # Leave room for response
                logger.warning(f"Total context for {agent_id} is too large ({estimated_tokens} est. tokens). Reducing...")
                # Find and truncate the context message which is typically the largest
                for i, msg in enumerate(messages):
                    if msg["role"] == "system" and len(msg["content"]) > 1000 and i > 0:  # Skip the first system message
                        content_len = len(msg["content"])
                        # Keep 30% of the content, prioritizing recent context
                        keep_chars = min(1500, int(content_len * 0.3))
                        messages[i]["content"] = f"[Context truncated]...\n{msg['content'][-keep_chars:]}"
                        logger.info(f"Truncated context message from {content_len} to {len(messages[i]['content'])} chars")
                        break
            
            # Log request details
            logger.debug(f"Making request for agent {agent_id} with {len(messages)} messages")
            start_time = time.time()
            
            # Make the API call
            response = await self.client.create_chat_completion(
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p
            )
            
            # Extract and process the response
            duration = time.time() - start_time
            answer = response["choices"][0]["message"]["content"]
            
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
                
                # Get model from params, default to Llama-3
                model = params.get("model", "meta-llama/Llama-3-8B-Instruct")
                
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