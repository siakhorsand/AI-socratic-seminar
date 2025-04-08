# Setting Up the Backend on Render

This guide will walk you through deploying the AI Socratic Seminar backend to [Render](https://render.com), which will allow users to use the GitHub Pages version without needing their own OpenAI API key.

## One-Click Deployment with Blueprint

The easiest way to deploy is using the `render.yaml` blueprint in this repository:

1. Fork this repository to your GitHub account
2. Create a [Render account](https://dashboard.render.com/register) if you don't have one
3. From your Render dashboard, click **New** and select **Blueprint**
4. Connect your GitHub account and select your forked repository
5. Enter the required environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `GOOGLE_CLIENT_ID`: (Optional) Your Google OAuth client ID for authentication
6. Click **Apply**

Render will automatically deploy the backend service. Once complete, your backend will be available at `https://ai-socratic-seminar-backend.onrender.com`.

## Manual Deployment

If you prefer to set up the service manually:

1. Log in to your [Render dashboard](https://dashboard.render.com/)
2. Click **New** and select **Web Service**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `ai-socratic-seminar-backend`
   - **Runtime**: Python 3
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn app:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free
   
5. Add the following environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `JWT_SECRET_KEY`: A random string for securing JWT tokens (Render can generate this for you)
   - `GOOGLE_CLIENT_ID`: (Optional) Your Google OAuth client ID
   - `FRONTEND_URL`: `https://siakhorsand.github.io/AI-socratic-seminar`
   - `DEPLOYED_URL`: `https://siakhorsand.github.io/AI-socratic-seminar`

6. Click **Create Web Service**

## Cost and Scaling Considerations

The free tier of Render has some limitations:
- Services spin down after 15 minutes of inactivity
- 750 hours of runtime per month
- Limited memory and CPU

These limits should be sufficient for moderate usage. If you need more resources, consider upgrading to a paid plan.

## Securing Your API Key

The backend proxy approach keeps your OpenAI API key secure by:
1. Storing it as an environment variable on Render
2. Never exposing it to frontend code
3. Implementing rate limiting to prevent abuse

## Monitoring Usage

To monitor API usage and costs:
1. Log in to your [OpenAI dashboard](https://platform.openai.com/usage)
2. View usage statistics and set up billing alerts
3. In your Render dashboard, you can also monitor service metrics and logs

## Troubleshooting

If users experience issues with the GitHub Pages version:
1. Check the Render logs for backend errors
2. Verify CORS settings allow requests from your GitHub Pages domain
3. Ensure rate limits aren't being exceeded
4. Check that your OpenAI API key is valid and has sufficient credits 