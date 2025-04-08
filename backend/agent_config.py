"""
Advanced agent configuration file.
This allows fine-tuning of each agent's parameters beyond just their prompts.
"""

from typing import Dict, List, Optional, Any, Union

# Default parameters for all agents
DEFAULT_PARAMS = {
    "model": "gpt-3.5-turbo",
    "temperature": 0.8,
    "max_tokens": 500,
    "top_p": 1.0,
    "frequency_penalty": 0.0,
    "presence_penalty": 0.0,
    "memory_depth": 5,  # Number of previous exchanges to remember
    "persona_strength": 1.0,  # 0.0-2.0, how strongly to adhere to persona
}

# Agent-specific parameters (override defaults)
AGENT_PARAMS: Dict[str, Dict[str, Any]] = {
    # Philosophers
    "socrates": {
        "model": "gpt-4",  # Use more advanced model for Socrates
        "temperature": 0.7,
        "max_tokens": 400,
        "persona_strength": 1.2,
        "memory_depth": 8,  # Remember more context for philosophical continuity
        "debate_style": "maieutic",  # Socratic questioning style
        "reasoning_framework": "dialectic"
    },
    "nietzsche": {
        "temperature": 0.9,  # More creative and bold
        "frequency_penalty": 0.2,  # Reduce repetition
        "presence_penalty": 0.1,  # Encourage diverse topics
        "persona_strength": 1.5,  # Strong adherence to Nietzschean style
        "debate_style": "provocative"
    },
    "alan_watts": {
        "temperature": 0.85,
        "memory_depth": 7,
        "persona_strength": 1.3,
        "debate_style": "metaphorical"
    },
    "simone_de_beauvoir": {
        "model": "gpt-4", 
        "temperature": 0.75,
        "persona_strength": 1.3,
        "debate_style": "analytical",
        "reasoning_framework": "existentialist"
    },
    
    # Scientists
    "einstein": {
        "model": "gpt-4",
        "temperature": 0.6,  # More focused and precise
        "max_tokens": 600,  # Allow for more detailed explanations
        "persona_strength": 1.2,
        "debate_style": "thought_experiment",
        "reasoning_framework": "theoretical_physics"
    },
    "newton": {
        "temperature": 0.5,  # Very methodical
        "persona_strength": 1.1,
        "debate_style": "methodical",
        "reasoning_framework": "mechanistic"
    },
    "darwin": {
        "temperature": 0.7,
        "persona_strength": 1.2,
        "debate_style": "observational",
        "reasoning_framework": "evolutionary"
    },
    "feynman": {
        "model": "gpt-4",
        "temperature": 0.8,
        "persona_strength": 1.4,
        "debate_style": "simplifying_complex",
        "reasoning_framework": "quantum_physics"
    },
    
    # Tech Visionaries
    "steve_jobs": {
        "temperature": 0.8,
        "persona_strength": 1.5,  # Very strong personality
        "debate_style": "visionary",
        "reasoning_framework": "design_thinking"
    },
    "sam_altman": {
        "model": "gpt-4",
        "temperature": 0.7,
        "persona_strength": 1.0,
        "debate_style": "pragmatic",
        "reasoning_framework": "tech_progressive"
    },
    
    # Devil's Advocate
    "devil_advocate": {
        "temperature": 0.9,
        "frequency_penalty": 0.3,  # Encourage diverse counterpoints
        "presence_penalty": 0.3,
        "persona_strength": 1.7,  # Strong contrarian position
        "debate_style": "contrarian",
        "reasoning_framework": "critical"
    },
    
    # Expert
    "expert": {
        "model": "gpt-4",
        "temperature": 0.3,  # Very focused on accurate information
        "max_tokens": 800,  # Allow for more comprehensive answers
        "persona_strength": 0.8,  # Less focus on persona, more on expertise
        "debate_style": "authoritative",
        "reasoning_framework": "evidence_based"
    },
    "financial_expert": {
        "model": "gpt-4",
        "temperature": 0.4,
        "max_tokens": 600,
        "persona_strength": 1.0,
        "debate_style": "analytical",
        "reasoning_framework": "financial_analysis"
    },
    "data_scientist": {
        "model": "gpt-4",
        "temperature": 0.5,
        "max_tokens": 700,
        "persona_strength": 1.1,
        "debate_style": "data_driven",
        "reasoning_framework": "statistical"
    },
    "market_strategist": {
        "model": "gpt-4",
        "temperature": 0.6,
        "max_tokens": 650,
        "persona_strength": 1.2,
        "debate_style": "strategic",
        "reasoning_framework": "market_analysis"
    },
    "mythical_sage": {
        "model": "gpt-4",
        "temperature": 0.8,
        "max_tokens": 500,
        "persona_strength": 1.3,
        "debate_style": "mystical",
        "reasoning_framework": "philosophical"
    },
    "fantasy_wizard": {
        "model": "gpt-4",
        "temperature": 0.9,
        "max_tokens": 550,
        "persona_strength": 1.4,
        "debate_style": "magical",
        "reasoning_framework": "arcane"
    },
    "legendary_warrior": {
        "model": "gpt-4",
        "temperature": 0.7,
        "max_tokens": 600,
        "persona_strength": 1.5,
        "debate_style": "courageous",
        "reasoning_framework": "strategic"
    },
    "scorpio": {
        "model": "gpt-4",
        "temperature": 0.85,
        "max_tokens": 500,
        "persona_strength": 1.6,
        "debate_style": "intuitive",
        "reasoning_framework": "emotional"
    },
    "visionary": {
        "model": "gpt-4",
        "temperature": 0.75,
        "max_tokens": 650,
        "persona_strength": 1.7,
        "debate_style": "forward_thinking",
        "reasoning_framework": "innovative"
    },
    "idealist": {
        "model": "gpt-4",
        "temperature": 0.6,
        "max_tokens": 600,
        "persona_strength": 1.8,
        "debate_style": "optimistic",
        "reasoning_framework": "value_driven"
    }
}

# Agent-specific few-shot examples for better in-context learning
FEW_SHOT_EXAMPLES: Dict[str, List[Dict[str, str]]] = {
    "socrates": [
        {
            "question": "Is it better to be wealthy or wise?",
            "response": "Let us examine what we mean by 'better.' We often speak of wealth as if its value were self-evident, but what is wealth if not the means to certain ends? And what are these ends? Comfort, security, freedom from want—these are indeed valuable. But does the possession of wealth guarantee these things? Many wealthy individuals live in constant anxiety about losing their fortunes. Now, wisdom—what is its nature? Is it not the capacity to discern what is truly good and worthwhile in life? If wisdom guides us to recognize what truly matters, might it not lead us to a more genuine form of wealth? What use is a fortune to one who does not know how to live well? Is the wealthy fool better off than the wise person of modest means?"
        }
    ],
    "einstein": [
        {
            "question": "How should we think about the relationship between space and time?",
            "response": "The relationship between space and time is fundamentally different from what our intuition suggests. In the framework of relativity, we must think of them not as separate entities but as aspects of a unified four-dimensional continuum—spacetime. The most profound consequence is that simultaneity is not absolute. Events that appear simultaneous to one observer may occur at different times for another observer in relative motion. This relativity of simultaneity emerges mathematically from the invariance of the speed of light for all observers, regardless of their relative motion. To visualize this, imagine light pulses expanding as spheres in spacetime—these spheres remain consistent for all observers, but the way space and time are sliced differs depending on one's reference frame. This counterintuitive relationship has been consistently verified through experiments measuring time dilation and length contraction."
        }
    ]
}

# Memory templates for different agent archetypes
MEMORY_TEMPLATES: Dict[str, str] = {
    "philosopher": """
You have previously discussed:
{context}

As you continue this philosophical inquiry, maintain consistency with your established positions while developing the ideas further. Reference previous points when relevant, but avoid simple repetition. Seek to deepen the conversation with new insights.
""",
    
    "scientist": """
Previous exchanges:
{context}

As you continue this scientific discussion, build upon established evidence and principles. Maintain consistency with scientific methodology. Reference previous observations or hypotheses when relevant, and continue to apply your specific scientific framework to the problem at hand.
""",
    
    "visionary": """
Earlier in this conversation:
{context}

As you continue, maintain your visionary perspective while developing new angles on the topic. Reference your earlier insights when relevant, but push the boundaries further. How might your ideas reshape this domain in the future?
""",
    
    "devil_advocate": """
Points previously challenged:
{context}

Continue your role as devil's advocate by finding new angles to challenge. Maintain a consistent contrarian stance while avoiding simple repetition of earlier points. Identify additional assumptions or implications that deserve scrutiny.
"""
}

# Map agents to their archetype for memory template selection
AGENT_ARCHETYPE_MAP = {
    "socrates": "philosopher",
    "nietzsche": "philosopher",
    "alan_watts": "philosopher",
    "simone_de_beauvoir": "philosopher",
    "einstein": "scientist",
    "newton": "scientist",
    "darwin": "scientist",
    "feynman": "scientist",
    "steve_jobs": "visionary",
    "sam_altman": "visionary",
    "devil_advocate": "devil_advocate",
    "expert": "scientist",
    "financial_expert": "expert",
    "data_scientist": "expert",
    "market_strategist": "expert",
    "mythical_sage": "philosopher",
    "fantasy_wizard": "philosopher",
    "legendary_warrior": "philosopher",
    "scorpio": "philosopher",
    "visionary": "philosopher",
    "idealist": "philosopher"
}

def get_agent_params(agent_id: str) -> Dict[str, Any]:
    """Get the complete parameters for a specific agent."""
    # Start with default parameters
    params = DEFAULT_PARAMS.copy()
    
    # Override with agent-specific parameters if they exist
    if agent_id in AGENT_PARAMS:
        params.update(AGENT_PARAMS[agent_id])
    
    return params

def get_few_shot_examples(agent_id: str) -> List[Dict[str, str]]:
    """Get few-shot examples for a specific agent if available."""
    return FEW_SHOT_EXAMPLES.get(agent_id, [])

def get_memory_template(agent_id: str) -> str:
    """Get the appropriate memory template for an agent."""
    archetype = AGENT_ARCHETYPE_MAP.get(agent_id, "philosopher")
    return MEMORY_TEMPLATES.get(archetype, MEMORY_TEMPLATES["philosopher"]) 