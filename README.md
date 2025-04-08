# AI Socratic Seminar

An interactive platform for multi-agent philosophical and intellectual discussions. The application features AI personas representing various philosophical, scientific, and strategic viewpoints that engage in Socratic dialogue.

## Features

- Multi-agent conversation system with categorized personas
- Interactive UI with threaded conversations
- Real-time response generation
- Categories include Philosophers, Scientists, Strategists, Critics, and Innovators

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Copyright

Copyright 2025 Sia Khorsand

## Quick Start

### Option 1: One-Command Startup

The easiest way to start both the backend and frontend servers:

```bash
cd ai-socratic-seminar
python run_app.py
```

This will automatically:
1. Start the backend server on port 8001
2. Start the frontend server on port 5173
3. Provide real-time logs from both servers
4. Auto-restart servers if they fail

### Option 2: Manual Startup

If you prefer to start the servers manually:

#### Backend
```bash
cd ai-socratic-seminar/backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn app:app --reload --port 8001
```

#### Frontend
```bash
cd ai-socratic-seminar/frontend
npm run dev
```

Then access the application at:
- Frontend: http://localhost:5173
- Backend: http://localhost:8001

## Setup

### Backend Setup

1. Create a virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. Set up your OpenAI API key in `.env`:
```
OPENAI_API_KEY=your_api_key_here
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

## Usage

1. Open the frontend application at http://localhost:5173 (or http://localhost:5174)
2. Enter a question and select agents to participate in the discussion
3. Enjoy the AI-powered Socratic Seminar!

## Advanced Agent Fine-Tuning

The AI Socratic Seminar platform features advanced fine-tuning capabilities that allow you to deeply customize agent behavior, personality, and performance characteristics.

### Fine-Tuning Methods

#### 1. Agent Configuration Files

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

#### 2. Prompt Engineering

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

#### 3. Few-Shot Examples

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

#### 4. Memory Templates

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

#### 5. UI-Based Configuration

The platform includes a UI for adjusting agent parameters without editing code:

1. Select an agent in the interface
2. Click "Configure" to open the settings panel
3. Adjust parameters like model, temperature, and persona strength
4. Save changes to apply them to the current session

### Creating New Agents

To create a new agent:

1. Add their prompt to an appropriate file in `backend/prompts/`
2. Add their config to `AGENT_PARAMS` in `backend/agent_config.py`
3. Map them to an archetype in `AGENT_ARCHETYPE_MAP`
4. Optionally add few-shot examples

Restart the application to make new agents available. 