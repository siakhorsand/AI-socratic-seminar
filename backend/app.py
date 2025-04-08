import os
import logging
import json
import time
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv
import random
import asyncio
import uuid
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
logger.info("Checking OpenAI API key...")
if not api_key:
    logger.error("OPENAI_API_KEY not found in environment variables!")
    raise ValueError("OPENAI_API_KEY not found in environment variables")
logger.info(f"OpenAI API key loaded successfully (starts with: {api_key[:8]}...)")

# Import enhanced agent management
from agent_manager import AgentManager
from memory import memory_manager
# Import auth module
from auth import GoogleSignInRequest, TokenResponse, UserResponse, verify_google_token, create_access_token, get_current_user, TokenData

app = FastAPI(title="AI Socratic Seminar API")

# Simple rate limiter
class RateLimiter:
    def __init__(self):
        self.requests = {}
        self.MAX_REQUESTS = 60  # Max requests per hour per IP
        self.WINDOW = timedelta(hours=1)
        
    def is_rate_limited(self, ip: str) -> bool:
        now = datetime.now()
        if ip not in self.requests:
            self.requests[ip] = []
        
        # Remove old requests
        self.requests[ip] = [time for time in self.requests[ip] 
                            if now - time < self.WINDOW]
        
        # Check rate limit
        if len(self.requests[ip]) >= self.MAX_REQUESTS:
            return True
        
        # Add new request
        self.requests[ip].append(now)
        return False

rate_limiter = RateLimiter()

# Rate limiting middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Get client IP
    ip = request.client.host
    
    # Rate limit only API endpoints
    if "/seminar" in request.url.path:
        if rate_limiter.is_rate_limited(ip):
            return HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please try again later."
            )
    
    response = await call_next(request)
    return response

# Configure CORS - add your deployed frontend URL to allow_origins when you deploy
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
deployed_url = os.getenv("DEPLOYED_URL", "")

# Create a list of allowed origins
allow_origins = [
    "http://localhost:5173", 
    "http://localhost:5174", 
    "http://localhost:5175", 
    "http://localhost:5176", 
    "http://localhost:5177", 
    "http://localhost:5178",
    "http://localhost:5179", 
    "http://localhost:5180", 
    "http://localhost:8001", 
    "http://localhost:8002", 
    "http://localhost:8003"
]

# Add GitHub Pages URL to allowed origins
github_pages_url = "https://siakhorsand.github.io"
if github_pages_url not in allow_origins:
    allow_origins.append(github_pages_url)

# Add frontend URL and deployed URL if they are set
if deployed_url and deployed_url not in allow_origins:
    allow_origins.append(deployed_url)
if frontend_url and frontend_url not in allow_origins:
    allow_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.info(f"CORS middleware configured with origins: {allow_origins}")

# Initialize OpenAI client
try:
    client = OpenAI(api_key=api_key)
    logger.info("OpenAI client initialized successfully")
    # Test the client
    test_response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": "test"}],
        max_tokens=5
    )
    logger.info("OpenAI API test successful")
except Exception as e:
    logger.error(f"Error initializing OpenAI client: {str(e)}")
    logger.error(f"Full error details: {repr(e)}")
    raise

class SeminarRequest(BaseModel):
    question: str
    agent_ids: List[str]
    conversation_id: Optional[str] = None
    auto_conversation: Optional[bool] = False
    max_rounds: Optional[int] = 3
    direct_mention: Optional[str] = None

class ContinueRequest(BaseModel):
    conversation_id: str
    question: Optional[str] = None
    agent_ids: List[str]

class AgentConfigRequest(BaseModel):
    agent_id: str
    parameters: Dict[str, Any]

# Load agent prompts from different archetype files
def load_prompts():
    prompts = {}
    prompts_dir = Path(__file__).parent / "prompts"
    
    # Load prompts from each JSONL file
    for prompt_file in prompts_dir.glob("*.jsonl"):
        agent_name = prompt_file.stem  # Get the filename without extension
        
        try:
            with open(prompt_file, "r") as f:
                # For JSONL files, we take the first line and use the completion as the prompt
                first_line = f.readline().strip()
                if first_line:
                    data = json.loads(first_line)
                    if "completion" in data:
                        prompt_text = data["completion"].strip()
                        # Remove the trailing #### if present
                        if prompt_text.endswith("####"):
                            prompt_text = prompt_text[:-4].strip()
                        prompts[agent_name] = prompt_text
        except Exception as e:
            logger.error(f"Error loading prompt for {agent_name}: {str(e)}")
    
    logger.info(f"Loaded prompts for agents: {list(prompts.keys())}")
    return prompts

AGENT_PROMPTS = load_prompts()

# Initialize our enhanced agent manager
agent_manager = AgentManager(client, AGENT_PROMPTS)

# Authentication endpoints
@app.post("/api/auth/google", response_model=TokenResponse)
async def google_sign_in(request: GoogleSignInRequest):
    """Authenticate user with Google Sign-In"""
    try:
        # Verify the Google ID token
        user_info = await verify_google_token(request.idToken)
        
        # Create JWT access token
        token = create_access_token(user_info)
        
        # Return the token and user info
        return TokenResponse(
            token=token,
            user=UserResponse(
                id=user_info["id"],
                email=user_info["email"],
                name=user_info["name"],
                picture=user_info.get("picture")
            )
        )
    except Exception as e:
        logger.error(f"Error in Google Sign-In: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail="Authentication failed"
        )

@app.get("/api/user/me", response_model=UserResponse)
async def get_user(current_user: TokenData = Depends(get_current_user)):
    """Get the current authenticated user"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        picture=current_user.picture
    )

# Seminar endpoints - require authentication
@app.post("/seminar")
async def create_seminar(request: SeminarRequest, current_user: TokenData = Depends(get_current_user)):
    try:
        logger.info(f"Processing seminar request with input: {request.question[:50]}...")
        
        # Use conversation ID if provided, otherwise generate a new one
        conversation_id = request.conversation_id or str(uuid.uuid4())
        logger.info(f"Using conversation ID: {conversation_id}")
        
        # Initial user message
        conversation_context = [{"role": "user", "content": request.question, "agent": "user"}]
        
        # If a specific agent is mentioned, prioritize getting their response first
        agent_ids = request.agent_ids.copy()
        if request.direct_mention and request.direct_mention in agent_ids:
            # Move the mentioned agent to the beginning of the list
            agent_ids.remove(request.direct_mention)
            agent_ids.insert(0, request.direct_mention)
            logger.info(f"Direct mention detected for agent: {request.direct_mention}")
        
        # Get first round of responses from all agents
        initial_responses = await agent_manager.get_multiple_responses(
            agent_ids, 
            request.question,
            conversation_id
        )
        
        all_responses = initial_responses.copy()
        
        # Store all responses in conversation context
        for response in initial_responses:
            agent_name = response["agent"]
            response_text = response["response"]
            conversation_context.append({
                "role": "assistant", 
                "content": f"{agent_name}: {response_text}",
                "agent": agent_name
            })
        
        # If auto_conversation is enabled, continue the conversation for max_rounds
        if request.auto_conversation and len(request.agent_ids) > 1:
            logger.info(f"Auto-conversation enabled for {request.max_rounds} rounds with {len(request.agent_ids)} agents")
            
            try:
                for round_num in range(1, request.max_rounds):
                    logger.info(f"Starting round {round_num + 1}")
                    
                    # In each round, randomly select a subset of agents to respond
                    # This makes the conversation more natural (not everyone responds to everything)
                    responding_agents = request.agent_ids.copy()
                    
                    # If we have more than 3 agents, randomly select a subset for each round
                    # to make the conversation more natural
                    if len(responding_agents) > 3:
                        # Select 2-3 agents randomly
                        num_to_select = min(random.randint(2, 3), len(responding_agents))
                        responding_agents = random.sample(responding_agents, num_to_select)
                    
                    logger.info(f"Selected {len(responding_agents)} agents to respond in round {round_num + 1}")
                    
                    # If there's a direct mention, ensure those responses reference the mentioned agent
                    mentioned_agent_context = ""
                    if request.direct_mention and round_num == 0:
                        # Find the response from the directly mentioned agent
                        mentioned_response = next((r for r in all_responses if r["agent"] == request.direct_mention), None)
                        if mentioned_response:
                            mentioned_agent_context = f"\n\nMake sure to reference the points made by {request.direct_mention.replace('_', ' ').title()} in your response."
                    
                    for agent_id in responding_agents:
                        # Skip the directly mentioned agent in subsequent rounds if it was mentioned in the first round
                        if round_num == 0 and request.direct_mention and agent_id == request.direct_mention:
                            continue
                            
                        try:
                            # Build context for this agent
                            agent_context = build_agent_context(conversation_context, agent_id)
                            logger.debug(f"Built context for agent {agent_id} in round {round_num + 1}")
                            
                            # Generate prompt for continuing the conversation
                            agent_name = agent_id.replace("_", " ").title()
                            other_agents = [aid for aid in request.agent_ids if aid != agent_id]
                            other_agent_names = [aid.replace("_", " ").title() for aid in other_agents]
                            
                            # Create a reference to other agents for the prompt
                            agents_reference = ""
                            if other_agent_names:
                                if len(other_agent_names) == 1:
                                    agents_reference = f"You may directly address {other_agent_names[0]} by name in your response."
                                else:
                                    formatted_names = ", ".join(other_agent_names[:-1]) + f" and {other_agent_names[-1]}"
                                    agents_reference = f"You may directly address any of these participants by name in your response: {formatted_names}."
                            
                            # Improved prompt for more selective, focused replies
                            continue_prompt = (
                                f"You are {agent_name} in a group chat. Please respond to the ongoing discussion ONLY IF you have a valuable perspective or can challenge an idea constructively. "
                                f"{agents_reference}\n\n"
                                f"Be selective about which points you address - you don't need to respond to everything. "
                                f"When appropriate, address specific agents by name. Keep your response brief and focused on making a single strong point. "
                                f"Your response should be 2-3 short paragraphs at most.{mentioned_agent_context}"
                            )
                            
                            # Get response for this agent
                            logger.debug(f"Getting response for agent {agent_id} in round {round_num + 1}")
                            response = await agent_manager.get_response(
                                agent_id,
                                continue_prompt,
                                conversation_id,
                                include_context=False,  # We're providing custom context
                                custom_context=agent_context
                            )
                            
                            # Add to all responses
                            all_responses.append(response)
                            
                            # Add to conversation context
                            conversation_context.append({
                                "role": "assistant", 
                                "content": f"{agent_id}: {response['response']}",
                                "agent": agent_id
                            })
                            logger.debug(f"Added response for agent {agent_id} in round {round_num + 1}")
                            
                            # Add small random delay between responses to make it feel more natural
                            await asyncio.sleep(random.uniform(0.5, 1.5))
                            
                        except Exception as agent_error:
                            logger.error(f"Error processing agent {agent_id} in round {round_num + 1}: {str(agent_error)}")
                            # Continue with other agents
                    
                # Add final message
                all_responses.append({
                    "agent": "system",
                    "response": "The discussion has concluded. You may now respond or ask a follow-up question.",
                    "model": "system",
                    "conversation_id": conversation_id
                })
                logger.info(f"Auto-conversation completed with {len(all_responses)} total responses")
            except Exception as auto_convo_error:
                logger.error(f"Error in auto-conversation: {str(auto_convo_error)}")
                # We'll still return the initial responses even if auto-conversation fails
        
        if all_responses:
            logger.info(f"Successfully generated {len(all_responses)} responses")
            return {"conversation_id": conversation_id, "answers": all_responses}
        else:
            raise HTTPException(status_code=500, detail="Failed to get any valid responses")
            
    except Exception as e:
        logger.error(f"Error in create_seminar: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Helper function to build conversation context for an agent
def build_agent_context(conversation_context, agent_id):
    # Format the conversation context for the agent
    formatted_context = "Previous conversation:\n\n"
    
    for message in conversation_context:
        if message["role"] == "user":
            formatted_context += f"User: {message['content']}\n\n"
        else:
            formatted_context += f"{message['content']}\n\n"
    
    return formatted_context

@app.post("/continue")
async def continue_conversation(request: ContinueRequest):
    try:
        logger.info(f"Processing continue request for conversation: {request.conversation_id}")
        
        # Create a contextual prompt if no new question is provided
        question = request.question
        if not question:
            question = "Please continue the discussion, building on the previous exchanges."
            
        # Get responses from agents
        responses = await agent_manager.get_multiple_responses(
            request.agent_ids,
            question,
            request.conversation_id
        )
        
        if responses:
            return {"answers": responses, "conversation_id": request.conversation_id}
        else:
            raise HTTPException(status_code=500, detail="Failed to get any valid responses")
            
    except Exception as e:
        logger.error(f"Error in continue: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/agents", response_model=List[Dict[str, Any]])
async def get_available_agents():
    """
    Returns details about all available agents
    """
    # Get a list of all available agents from agent_manager
    agents = agent_manager.get_available_agents()
    
    # Group agents by category
    categorized_agents = {
        "thinkers_and_philosophers": [],
        "analysts_and_experts": [],
        "historical_figures": [],
        "fictional_and_mythic": [],
        "archetypes_and_vibes": []
    }
    
    # Map agents to their respective categories
    category_mapping = {
        # Thinkers and Philosophers
        "socrates": "thinkers_and_philosophers",
        "nietzsche": "thinkers_and_philosophers",
        "alan_watts": "thinkers_and_philosophers",
        "simone_de_beauvoir": "thinkers_and_philosophers",
        
        # Analysts and Experts
        "business_analyst": "analysts_and_experts",
        "financial_expert": "analysts_and_experts",
        "data_scientist": "analysts_and_experts",
        "market_strategist": "analysts_and_experts",
        "expert": "analysts_and_experts",
        
        # Historical Figures
        "einstein": "historical_figures",
        "newton": "historical_figures",
        "darwin": "historical_figures",
        "feynman": "historical_figures",
        
        # Fictional and Mythic
        "superhero": "fictional_and_mythic",
        "mythical_sage": "fictional_and_mythic",
        "fantasy_wizard": "fictional_and_mythic",
        "legendary_warrior": "fictional_and_mythic",
        
        # Archetypes and Vibes
        "scorpio": "archetypes_and_vibes",
        "visionary": "archetypes_and_vibes",
        "devil_advocate": "archetypes_and_vibes",
        "idealist": "archetypes_and_vibes"
    }
    
    # Categorize each agent
    for agent in agents:
        agent_id = agent.get("id", "")
        category = category_mapping.get(agent_id, "other")
        if category in categorized_agents:
            categorized_agents[category].append(agent)
    
    # Flatten the categorized agents for response
    categorized_result = []
    for category, agents_list in categorized_agents.items():
        categorized_result.append({
            "category": category.replace("_", " ").title(),
            "agents": agents_list
        })
    
    return categorized_result

@app.post("/agent/configure")
async def configure_agent(request: AgentConfigRequest):
    """Update configuration for a specific agent."""
    try:
        # This would modify the agent configuration in a real implementation
        # For now, we'll just return the requested configuration
        return {
            "agent_id": request.agent_id,
            "parameters": request.parameters,
            "status": "Configuration would be updated in a full implementation"
        }
    except Exception as e:
        logger.error(f"Error configuring agent: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/conversation/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation from memory."""
    try:
        memory_manager.clear_conversation(conversation_id)
        return {"status": "success", "message": f"Conversation {conversation_id} deleted"}
    except Exception as e:
        logger.error(f"Error deleting conversation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Anonymous seminar endpoint (no authentication required)
@app.post("/public/seminar")
async def create_public_seminar(request: SeminarRequest):
    try:
        logger.info(f"Processing public seminar request with input: {request.question[:50]}...")
        
        # Use conversation ID if provided, otherwise generate a new one
        conversation_id = request.conversation_id or str(uuid.uuid4())
        logger.info(f"Using conversation ID: {conversation_id}")
        
        # Initial user message
        conversation_context = [{"role": "user", "content": request.question, "agent": "user"}]
        
        # If a specific agent is mentioned, prioritize getting their response first
        agent_ids = request.agent_ids.copy()
        if request.direct_mention and request.direct_mention in agent_ids:
            # Move the mentioned agent to the beginning of the list
            agent_ids.remove(request.direct_mention)
            agent_ids.insert(0, request.direct_mention)
            logger.info(f"Direct mention detected for agent: {request.direct_mention}")
        
        # Get first round of responses from all agents
        initial_responses = await agent_manager.get_multiple_responses(
            agent_ids, 
            request.question, 
            conversation_id
        )
        
        for resp in initial_responses:
            conversation_context.append({
                "role": "assistant", 
                "content": resp["response"], 
                "agent": resp["agent"]
            })
        
        # If auto conversation is enabled, simulate an agent discussion
        additional_rounds = []
        if request.auto_conversation and len(agent_ids) > 1:
            max_rounds = min(request.max_rounds, 5)  # Cap at 5 to prevent abuse
            logger.info(f"Auto conversation enabled, generating {max_rounds} rounds")
            
            current_round = 0
            while current_round < max_rounds:
                current_round += 1
                logger.info(f"Generating round {current_round} of auto conversation")
                
                round_responses = []
                for i, agent_id in enumerate(agent_ids):
                    # Prepare context from previous messages
                    agent_context = "\n\n".join([
                        f"{ctx['agent']}: {ctx['content']}" 
                        for ctx in conversation_context
                    ])
                    
                    # Formulate a question based on the context
                    meta_prompt = f"""
                    Based on this ongoing conversation, what would be an interesting and relevant point for you 
                    to add as {agent_id}? It should be in response to what others have said.
                    
                    Conversation so far:
                    {agent_context}
                    """
                    
                    # Get the response from the agent
                    response = await agent_manager.get_response(
                        agent_id,
                        meta_prompt,
                        conversation_id,
                        include_context=False  # We're providing our own context
                    )
                    
                    round_responses.append(response)
                    
                    # Add to the overall conversation context
                    conversation_context.append({
                        "role": "assistant",
                        "content": response["response"],
                        "agent": response["agent"]
                    })
                
                additional_rounds.append(round_responses)
                
                # Small delay to prevent rate limiting
                await asyncio.sleep(0.5)
        
        return {
            "question": request.question,
            "conversation_id": conversation_id,
            "responses": initial_responses,
            "additional_rounds": additional_rounds
        }
        
    except Exception as e:
        logger.error(f"Error in public seminar request: {str(e)}")
        logger.error(f"Full error details: {repr(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing request: {str(e)}"
        )

# Anonymous continue conversation endpoint
@app.post("/public/continue")
async def continue_public_conversation(request: ContinueRequest):
    try:
        logger.info(f"Continuing public conversation {request.conversation_id}")
        
        # Get responses from all agents
        if request.question:
            # If a new question is provided
            responses = await agent_manager.get_multiple_responses(
                request.agent_ids,
                request.question,
                request.conversation_id
            )
        else:
            # If no new question, use the last exchange
            conversation = memory_manager.get_conversation(request.conversation_id)
            if not conversation:
                raise HTTPException(
                    status_code=404,
                    detail="Conversation not found"
                )
            
            # Get the last user message
            last_user_message = None
            for exchange in reversed(conversation):
                if exchange.get("role") == "user":
                    last_user_message = exchange.get("content")
                    break
            
            if not last_user_message:
                raise HTTPException(
                    status_code=400,
                    detail="No previous user message found"
                )
            
            responses = await agent_manager.get_multiple_responses(
                request.agent_ids,
                last_user_message,
                request.conversation_id
            )
        
        return {
            "conversation_id": request.conversation_id,
            "responses": responses
        }
        
    except Exception as e:
        logger.error(f"Error in continue public conversation: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing request: {str(e)}"
        )

# Anonymous available agents endpoint
@app.get("/public/agents")
async def get_public_available_agents():
    try:
        agents = agent_manager.get_available_agents()
        return {"agents": agents}
    except Exception as e:
        logger.error(f"Error getting available agents: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error getting available agents: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002) 