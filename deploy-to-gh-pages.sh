#!/bin/bash

# Deploy script for GitHub Pages

echo "Starting deployment to GitHub Pages..."

# Navigate to the frontend directory
cd frontend

# Install dependencies if needed
echo "Installing dependencies..."
npm install

# Build the project
echo "Building project..."
npm run build

# Deploy to GitHub Pages
echo "Deploying to GitHub Pages..."
npm run deploy

echo "Deployment complete! Your site should be available at:"
echo "https://siakhorsand.github.io/ai-socratic-seminar/" 