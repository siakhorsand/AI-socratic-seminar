"""
Advanced agent configuration file.
This allows fine-tuning of each agent's parameters beyond just their prompts.
"""

from typing import Dict, List, Optional, Any, Union

# Default parameters for all agents
DEFAULT_PARAMS = {
    "model": "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
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
    # Existing Philosophers
    "socrates": {
        "model": "meta-llama/Llama-3.1-8B-Instruct",
        "temperature": 0.7,
        "max_tokens": 400,
        "persona_strength": 1.2,
        "memory_depth": 8,
        "debate_style": "maieutic",
        "reasoning_framework": "dialectic"
    },
    "nietzsche": {
        "temperature": 0.9,
        "frequency_penalty": 0.2,
        "presence_penalty": 0.1,
        "persona_strength": 1.5,
        "debate_style": "provocative"
    },
    "alan_watts": {
        "temperature": 0.85,
        "memory_depth": 7,
        "persona_strength": 1.3,
        "debate_style": "metaphorical"
    },
    "simone_de_beauvoir": {
        "model": "meta-llama/Llama-3.1-8B-Instruct", 
        "temperature": 0.75,
        "persona_strength": 1.3,
        "debate_style": "analytical",
        "reasoning_framework": "existentialist"
    },

    # New Philosophers & Skeptics
    "atlas_vale": {
        "model": "meta-llama/Llama-3.1-8B-Instruct",
        "temperature": 0.6,
        "max_tokens": 350,
        "persona_strength": 1.4,
        "memory_depth": 6,
        "debate_style": "stoic",
        "reasoning_framework": "virtue_ethics"
    },
    "echo_kismet": {
        "model": "meta-llama/Llama-3.1-8B-Instruct",
        "temperature": 0.7,
        "max_tokens": 400,
        "persona_strength": 1.3,
        "memory_depth": 7,
        "debate_style": "utilitarian",
        "reasoning_framework": "consequentialist"
    },
    "rafe_cipher": {
        "model": "meta-llama/Llama-3.1-8B-Instruct",
        "temperature": 0.8,
        "max_tokens": 450,
        "persona_strength": 1.5,
        "memory_depth": 8,
        "debate_style": "postmodern",
        "reasoning_framework": "deconstructive"
    },
    "vera_volt": {
        "model": "meta-llama/Llama-3.1-8B-Instruct",
        "temperature": 0.5,
        "max_tokens": 400,
        "persona_strength": 1.2,
        "memory_depth": 9,
        "debate_style": "analytical",
        "reasoning_framework": "formal_logic"
    },

    # Science & Futurism Guild
    "lyra_quark": {
        "model": "meta-llama/Llama-3.1-8B-Instruct",
        "temperature": 0.7,
        "max_tokens": 500,
        "persona_strength": 1.3,
        "memory_depth": 7,
        "debate_style": "quantum",
        "reasoning_framework": "quantum_mechanics"
    },
    "kai_helix": {
        "model": "meta-llama/Llama-3.1-8B-Instruct",
        "temperature": 0.8,
        "max_tokens": 450,
        "persona_strength": 1.4,
        "memory_depth": 6,
        "debate_style": "biohacker",
        "reasoning_framework": "synthetic_biology"
    },
    "nova_verge": {
        "model": "meta-llama/Llama-3.1-8B-Instruct",
        "temperature": 0.6,
        "max_tokens": 500,
        "persona_strength": 1.2,
        "memory_depth": 8,
        "debate_style": "alignment",
        "reasoning_framework": "ai_safety"
    },

    # Startup & Strategy Council
    "jade_loop": {
        "model": "meta-llama/Llama-3.1-8B-Instruct",
        "temperature": 0.7,
        "max_tokens": 400,
        "persona_strength": 1.3,
        "memory_depth": 6,
        "debate_style": "mvp",
        "reasoning_framework": "lean_startup"
    },
    "sabine_flux": {
        "model": "meta-llama/Llama-3.1-8B-Instruct",
        "temperature": 0.8,
        "max_tokens": 450,
        "persona_strength": 1.4,
        "memory_depth": 7,
        "debate_style": "market_vision",
        "reasoning_framework": "market_analysis"
    },
    "riot_pulse": {
        "model": "meta-llama/Llama-3.1-8B-Instruct",
        "temperature": 0.9,
        "max_tokens": 400,
        "persona_strength": 1.5,
        "memory_depth": 5,
        "debate_style": "growth_hacking",
        "reasoning_framework": "viral_marketing"
    },
    "nadia_zenith": {
        "model": "meta-llama/Llama-3.1-8B-Instruct",
        "temperature": 0.6,
        "max_tokens": 450,
        "persona_strength": 1.2,
        "memory_depth": 8,
        "debate_style": "operational",
        "reasoning_framework": "six_sigma"
    },

    # Creative Story & Design Forge
    "duke_noir": {
        "model": "meta-llama/Llama-3.1-8B-Instruct",
        "temperature": 0.8,
        "max_tokens": 500,
        "persona_strength": 1.4,
        "memory_depth": 7,
        "debate_style": "noir",
        "reasoning_framework": "narrative_structure"
    },
    "seren_aria": {
        "model": "meta-llama/Llama-3.1-8B-Instruct",
        "temperature": 0.9,
        "max_tokens": 550,
        "persona_strength": 1.5,
        "memory_depth": 6,
        "debate_style": "mythic",
        "reasoning_framework": "archetypal"
    },
    "ava_prism": {
        "model": "meta-llama/Llama-3.1-8B-Instruct",
        "temperature": 0.8,
        "max_tokens": 500,
        "persona_strength": 1.3,
        "memory_depth": 7,
        "debate_style": "cinematic",
        "reasoning_framework": "visual_storytelling"
    },
    "haru_pulse": {
        "model": "meta-llama/Llama-3.1-8B-Instruct",
        "temperature": 0.7,
        "max_tokens": 300,
        "persona_strength": 1.4,
        "memory_depth": 6,
        "debate_style": "haiku",
        "reasoning_framework": "minimalist"
    },

    # Archetypes & Wildcards
    "solaris_blaze": {
        "model": "meta-llama/Llama-3.1-8B-Instruct",
        "temperature": 0.9,
        "max_tokens": 450,
        "persona_strength": 1.6,
        "memory_depth": 6,
        "debate_style": "visionary",
        "reasoning_framework": "optimistic"
    },
    "mira_tide": {
        "model": "meta-llama/Llama-3.1-8B-Instruct",
        "temperature": 0.7,
        "max_tokens": 400,
        "persona_strength": 1.3,
        "memory_depth": 8,
        "debate_style": "empathic",
        "reasoning_framework": "emotional_intelligence"
    },
    "coyote_void": {
        "model": "meta-llama/Llama-3.1-8B-Instruct",
        "temperature": 0.8,
        "max_tokens": 400,
        "persona_strength": 1.5,
        "memory_depth": 7,
        "debate_style": "trickster",
        "reasoning_framework": "paradoxical"
    },
    "athena_vox": {
        "model": "meta-llama/Llama-3.1-8B-Instruct",
        "temperature": 0.6,
        "max_tokens": 500,
        "persona_strength": 1.2,
        "memory_depth": 9,
        "debate_style": "strategic",
        "reasoning_framework": "wisdom"
    },

    # Legends' Table
    "ada_lovelace": {
        "model": "meta-llama/Llama-3.1-8B-Instruct",
        "temperature": 0.7,
        "max_tokens": 500,
        "persona_strength": 1.3,
        "memory_depth": 8,
        "debate_style": "analytical",
        "reasoning_framework": "algorithmic"
    },
    "nikola_tesla": {
        "model": "meta-llama/Llama-3.1-8B-Instruct",
        "temperature": 0.8,
        "max_tokens": 550,
        "persona_strength": 1.4,
        "memory_depth": 7,
        "debate_style": "innovative",
        "reasoning_framework": "electrical_engineering"
    },
    "leonardo_da_vinci": {
        "model": "meta-llama/Llama-3.1-8B-Instruct",
        "temperature": 0.9,
        "max_tokens": 600,
        "persona_strength": 1.5,
        "memory_depth": 8,
        "debate_style": "polymath",
        "reasoning_framework": "interdisciplinary"
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
""",

    "stoic": """
Previous reflections:
{context}

Maintain your stoic composure and focus on virtue, duty, and acceptance. Reference previous insights while developing new perspectives on the nature of human existence and moral responsibility.
""",

    "utilitarian": """
Previous calculations:
{context}

Continue your analysis through the lens of the happiness ledger. Reference previous outcomes while developing new calculations that maximize well-being and minimize suffering.
""",

    "postmodern": """
Previous deconstructions:
{context}

Continue your analysis of power dynamics and shifting narratives. Reference previous insights while developing new perspectives on the constructed nature of reality and knowledge.
""",

    "quantum": """
Previous quantum explorations:
{context}

Maintain your focus on quantum principles and their implications. Reference previous insights while developing new perspectives on the nature of reality at the quantum level.
""",

    "biohacker": """
Previous biological insights:
{context}

Continue your exploration of synthetic biology and human enhancement. Reference previous experiments while developing new approaches to biological optimization.
""",

    "alignment": """
Previous AI safety discussions:
{context}

Maintain your focus on AI alignment and safety considerations. Reference previous insights while developing new perspectives on ensuring beneficial AI development.
""",

    "startup": """
Previous entrepreneurial insights:
{context}

Continue your focus on lean startup principles and MVP development. Reference previous strategies while developing new approaches to product development and market validation.
""",

    "market_vision": """
Previous market analyses:
{context}

Maintain your focus on market dynamics and strategic vision. Reference previous insights while developing new perspectives on market opportunities and challenges.
""",

    "growth_hacking": """
Previous growth strategies:
{context}

Continue your focus on viral growth and user acquisition. Reference previous tactics while developing new approaches to scaling and market penetration.
""",

    "operational": """
Previous operational insights:
{context}

Maintain your focus on efficiency and process optimization. Reference previous improvements while developing new approaches to operational excellence.
""",

    "creative": """
Previous creative explorations:
{context}

Continue your artistic and narrative development. Reference previous works while developing new creative expressions and storytelling approaches.
""",

    "trickster": """
Previous paradoxical insights:
{context}

Maintain your role as a catalyst for change through paradox and contradiction. Reference previous provocations while developing new ways to challenge conventional thinking.
""",

    "polymath": """
Previous interdisciplinary insights:
{context}

Continue your exploration across multiple domains of knowledge. Reference previous connections while developing new syntheses of art, science, and engineering.
"""
}

# Map agents to their archetype for memory template selection
AGENT_ARCHETYPE_MAP = {
    # Existing agents
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
    "financial_expert": "scientist",
    "data_scientist": "scientist",
    "market_strategist": "visionary",
    "mythical_sage": "philosopher",
    "fantasy_wizard": "visionary",
    "legendary_warrior": "visionary",
    "scorpio": "philosopher",
    "visionary": "visionary",
    "idealist": "philosopher",

    # New Philosophers & Skeptics
    "atlas_vale": "stoic",
    "echo_kismet": "utilitarian",
    "rafe_cipher": "postmodern",
    "vera_volt": "philosopher",

    # Science & Futurism Guild
    "lyra_quark": "quantum",
    "kai_helix": "biohacker",
    "nova_verge": "alignment",

    # Startup & Strategy Council
    "jade_loop": "startup",
    "sabine_flux": "market_vision",
    "riot_pulse": "growth_hacking",
    "nadia_zenith": "operational",

    # Creative Story & Design Forge
    "duke_noir": "creative",
    "seren_aria": "creative",
    "ava_prism": "creative",
    "haru_pulse": "creative",

    # Archetypes & Wildcards
    "solaris_blaze": "visionary",
    "mira_tide": "philosopher",
    "coyote_void": "trickster",
    "athena_vox": "philosopher",

    # Legends' Table
    "ada_lovelace": "scientist",
    "nikola_tesla": "scientist",
    "leonardo_da_vinci": "polymath"
}

def get_agent_params(agent_id: str) -> Dict[str, Any]:
    """Get the parameters for a specific agent, with defaults applied"""
    agent_params = AGENT_PARAMS.get(agent_id, {})
    params = DEFAULT_PARAMS.copy()
    params.update(agent_params)
    return params

def get_few_shot_examples(agent_id: str) -> List[Dict[str, str]]:
    """Get few-shot examples for a specific agent"""
    return FEW_SHOT_EXAMPLES.get(agent_id, [])

def get_memory_template(agent_id: str) -> str:
    """Get the memory template for a specific agent"""
    archetype = AGENT_ARCHETYPE_MAP.get(agent_id, "philosopher")
    return MEMORY_TEMPLATES.get(archetype, MEMORY_TEMPLATES["philosopher"]) 