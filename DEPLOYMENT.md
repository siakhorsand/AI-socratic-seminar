# Deployment Guide

This guide provides multiple deployment options for the AI Socratic Seminar application.

## Option 1: GitHub Pages with Backend Proxy (Recommended)

This option allows users to access the application without needing their own OpenAI API key.

### Prerequisites
1. Fork this repository to your GitHub account
2. Create a [Render account](https://dashboard.render.com/register)
3. Have your OpenAI API key ready

### Deploy the Backend on Render
See the detailed instructions in [RENDER_SETUP.md](RENDER_SETUP.md)

### Deploy the Frontend to GitHub Pages
GitHub Actions is already configured in this repository to deploy to GitHub Pages automatically:

1. In your forked repository, go to **Settings** > **Pages**
2. Set the source to **GitHub Actions**
3. Push any change to the main branch to trigger the deployment

Your application will be available at `https://[your-username].github.io/AI-socratic-seminar/`

## Option 2: Full Deployment on Render

For a more customized deployment where both frontend and backend are hosted on Render:

### Prerequisites
1. Create a [Render account](https://dashboard.render.com/register)
2. Create a [Google Cloud Platform account](https://console.cloud.google.com/) for Google OAuth (optional)
3. Have your OpenAI API key ready

### Google OAuth Setup (Optional)
1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Go to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Set up the OAuth consent screen:
   - User Type: External
   - App name: AI Socratic Seminar
   - User support email: Your email
   - Developer contact information: Your email
6. Create an OAuth client ID:
   - Application type: Web application
   - Name: AI Socratic Seminar
   - Authorized JavaScript origins: Add your Render frontend URL (e.g., `https://ai-socratic-seminar.onrender.com`)
   - Authorized redirect URIs: Add your Render frontend URL (e.g., `https://ai-socratic-seminar.onrender.com`)
7. Note down the Client ID (you'll need it later)

### Backend Deployment on Render
1. Log in to your Render dashboard
2. Click "New" > "Web Service"
3. Connect your GitHub repository
4. Configure the web service:
   - Name: `ai-socratic-seminar-api`
   - Runtime: Python 3
   - Build Command: `cd backend && pip install -r requirements.txt`
   - Start Command: `cd backend && uvicorn app:app --host 0.0.0.0 --port $PORT`
   - Environment Variables:
     - `OPENAI_API_KEY`: Your OpenAI API key
     - `JWT_SECRET_KEY`: Generate a secure random string (you can use [random.org](https://www.random.org/strings/))
     - `GOOGLE_CLIENT_ID`: The Client ID from Google OAuth setup (optional)
     - `FRONTEND_URL`: Your frontend URL on Render (e.g., `https://ai-socratic-seminar.onrender.com`)
     - `DEPLOYED_URL`: Same as `FRONTEND_URL`
5. Click "Create Web Service"

### Frontend Deployment on Render
1. In your Render dashboard, click "New" > "Static Site"
2. Connect your GitHub repository
3. Configure the static site:
   - Name: `ai-socratic-seminar`
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`
   - Environment Variables:
     - `VITE_API_URL`: URL of your backend service (e.g., `https://ai-socratic-seminar-api.onrender.com`)
     - `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID (if using Google authentication)
4. Click "Create Static Site"

## Monitoring and Maintenance

### Monitoring API Usage
Monitor your OpenAI API usage at [platform.openai.com/usage](https://platform.openai.com/usage)

### Update Your Deployment
1. Push changes to your GitHub repository
2. Render will automatically rebuild and deploy your services

## Troubleshooting

### Backend Issues
- Check the logs in your Render dashboard
- Verify your OpenAI API key is valid and has sufficient credits
- Check your CORS configuration if you see cross-origin errors

### Frontend Issues
- Check browser console for errors
- Verify the frontend can reach the backend
- Check environment variables are correctly set

## Scaling Considerations

1. **Free Tier Limitations**: Render's free tier has limitations on compute and may sleep inactive services. For a production application, consider upgrading to a paid plan.

2. **API Usage Costs**: Be mindful of OpenAI API usage costs. Consider implementing:
   - Rate limiting per user
   - Usage quotas
   - Caching mechanisms for common queries

3. **Database Integration**: For a production application, consider adding a database to store:
   - User information
   - Conversation history
   - Usage statistics

## Maintenance

1. Regularly update dependencies for security patches
2. Monitor API usage to prevent unexpected costs
3. Set up monitoring and alerting for service availability
4. Create regular backups of user data if you implement a database 