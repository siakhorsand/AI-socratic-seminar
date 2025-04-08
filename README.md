# AI Socratic Seminar

An interactive platform for multi-agent philosophical and intellectual discussions. The application features AI personas representing various philosophical, scientific, and strategic viewpoints that engage in Socratic dialogue.

## Features

- Multi-agent conversation system with categorized personas
- Interactive UI with threaded conversations
- Real-time response generation
- Categories include Philosophers, Scientists, Strategists, Critics, and Innovators
- **NEW**: No API key required - seamless user experience
- **NEW**: Google authentication for secure access
- **NEW**: Full deployment support for hosting on cloud platforms

## Access Options

### GitHub Pages Version (Recommended)

The easiest way to try the application is through our GitHub Pages version. This version:
- Runs in your browser with no setup required
- Uses our secure backend proxy - no API key needed!
- Includes all conversation features
- Works on any device with a modern web browser

**[Access the GitHub Pages version here](https://siakhorsand.github.io/AI-socratic-seminar/)**

### Full Application Deployment

For custom deployments with advanced features, you can deploy the complete application with your own backend. This provides:
- Secure API key management
- User authentication
- Custom rate limiting
- All conversation features

See the [DEPLOYMENT.md](DEPLOYMENT.md) guide for detailed instructions on deploying to Render or similar platforms.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Copyright

Copyright 2025 Sia Khorsand

## Full Installation

If you want to run the complete experience with backend support locally, follow these instructions:

### Backend Setup

1. Create a virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env to add your OpenAI API key and other settings
```

3. For Google authentication (optional):
   - Create a project in Google Cloud Console
   - Set up OAuth credentials
   - Add the Client ID to your .env file

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env if needed to point to your backend
```

### Running the Application

1. Start the backend:
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn app:app --reload --port 8002
```

2. Start the frontend:
```bash
cd frontend
npm run dev
```

3. Access the application at http://localhost:5173

## Usage

1. Sign in with your Google account or continue as guest
2. Enter a question and select personas to participate in the discussion
3. Enjoy the AI-powered Socratic Seminar!

## Advanced Features

### Agent Configuration

The application allows fine-tuning of agent behavior, personality, and performance characteristics. See the [documentation](docs/agent-configuration.md) for details.

### User Management

With Google authentication, users can:
- Securely access the application
- Save conversation history
- Set preferences for auto-debate features
- Customize their experience

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 