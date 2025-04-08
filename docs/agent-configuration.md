# Agent Configuration

The AI Socratic Seminar platform features advanced fine-tuning capabilities that allow you to customize agent behavior, personality, and performance characteristics.

## Configuration Methods

### 1. Agent Configuration Files

Edit the agent configuration in `backend/agent_config.py`:

- **Model Selection**: Choose between GPT-3.5 Turbo or GPT-4 for each agent
- **Temperature**: Control creativity vs. determinism (0.0-2.0)
- **Maximum Tokens**: Set response length limits
- **Persona Strength**: Adjust how strongly an agent adheres to its character (0.1-2.0)
- **Memory Depth**: Control how many previous exchanges the agent remembers
- **Frequency/Presence Penalties**: Fine-tune repetition avoidance

Example config:
```python
"socrates": {
    "model": "gpt-4",
    "temperature": 0.7,
    "max_tokens": 400,
    "persona_strength": 1.2,
    "memory_depth": 8,
    "debate_style": "maieutic",
    "reasoning_framework": "dialectic"
}
```

### 2. Prompt Engineering

Customize agent prompts in the `backend/prompts/` directory:

- Each file contains multiple agent definitions
- Agents are defined with a header: `# Agent Name - Title`
- Followed by a detailed prompt that shapes their personality and response style

Example agent prompt:
```
# Socrates - The Questioner
You are Socrates, the father of Western philosophy. Your method is to:
1. Ask probing questions that reveal assumptions
2. Use irony and feigned ignorance ("I know that I know nothing")
3. Guide others to truth through systematic questioning
4. Draw analogies from everyday life
5. Focus on ethics, justice, and the nature of knowledge
Keep responses under 200 words. Begin with "Let us examine..." and end with a thought-provoking question.
```

### 3. Few-Shot Examples

Add example Q&A pairs in `backend/agent_config.py` to demonstrate the ideal response pattern:

```python
FEW_SHOT_EXAMPLES: Dict[str, List[Dict[str, str]]] = {
    "socrates": [
        {
            "question": "Is it better to be wealthy or wise?",
            "response": "Let us examine what we mean by 'better.'..."
        }
    ]
}
```

### 4. Memory Templates

Customize how agents recall previous conversations by editing the memory templates in `backend/agent_config.py`:

```python
MEMORY_TEMPLATES: Dict[str, str] = {
    "philosopher": """
    You have previously discussed:
    {context}
    
    As you continue this philosophical inquiry, maintain consistency with your established positions while developing the ideas further.
    """
}
```

## Creating New Agents

To create a new agent:

1. Add their prompt to an appropriate file in `backend/prompts/`
2. Add their config to `AGENT_PARAMS` in `backend/agent_config.py`
3. Map them to an archetype in `AGENT_ARCHETYPE_MAP`
4. Optionally add few-shot examples

Restart the application to make new agents available.

## Performance Considerations

When configuring agents, keep in mind:

1. **API Costs**: Higher model versions (GPT-4) incur higher costs
2. **Response Time**: Larger `max_tokens` values result in longer generation times
3. **Memory Usage**: Higher `memory_depth` values consume more memory and increase API costs
4. **Quality vs. Speed**: There's a tradeoff between response quality and generation speed

## Best Practices

1. **Consistent Voice**: Ensure agent prompts maintain a consistent voice and character
2. **Clear Instructions**: Include specific instructions on how the agent should respond
3. **Balanced Personalities**: Create a diverse set of personas that complement each other in discussion
4. **Test Thoroughly**: Test new configurations with various types of questions
5. **Iterate Gradually**: Make incremental changes and observe the effects 