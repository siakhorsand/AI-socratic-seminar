/**
 * Authentication utility functions
 */

// Check if user is logged in
export const isAuthenticated = () => {
  const user = localStorage.getItem('user');
  const token = localStorage.getItem('authToken');
  
  // If we have a user and it's a guest user, consider them authenticated
  if (user) {
    const userData = JSON.parse(user);
    if (userData.isGuest) {
      return true;
    }
  }
  
  // Otherwise, require a valid token
  return !!token;
};

// Get the current user
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Get the auth token
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Log out the current user
export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

// Create an authenticated fetch function
export const authFetch = async (url, options = {}) => {
  const user = getCurrentUser();
  
  // Prepare headers
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
  };
  
  // Add auth token if available (not for guest users)
  if (!user?.isGuest) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  // Make the authenticated request
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // Handle 401 Unauthorized errors
  if (response.status === 401) {
    // Token might be expired, log the user out
    logout();
    window.location.reload();
    throw new Error('Your session has expired. Please sign in again.');
  }
  
  return response;
};

// Helper for API calls
export const apiCall = async (endpoint, method = 'GET', data = null) => {
  // For GitHub Pages deployment, use the deployed backend
  const isGitHubPages = window.location.hostname === 'siakhorsand.github.io';
  
  // Set default backend URL (will be overridden by environment variables if available)
  let baseUrl = 'https://ai-socratic-seminar-backend.onrender.com'; // Default to our deployed backend
  
  // If not on GitHub Pages, use the environment variable if available
  if (!isGitHubPages) {
    baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8002';
  }
  
  // For GitHub Pages or guest users, use the public endpoints
  let apiEndpoint = endpoint;
  if (isGitHubPages || getCurrentUser()?.isGuest) {
    // Replace authenticated endpoints with public ones
    if (endpoint === '/seminar') {
      apiEndpoint = '/public/seminar';
    } else if (endpoint === '/continue') {
      apiEndpoint = '/public/continue';
    } else if (endpoint === '/agents') {
      apiEndpoint = '/public/agents';
    }
  }
  
  const url = `${baseUrl}${apiEndpoint}`;
  
  const options = {
    method,
    credentials: 'include',
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    // For GitHub Pages, don't use authFetch to avoid authentication issues
    if (isGitHubPages || getCurrentUser()?.isGuest) {
      options.headers = {
        'Content-Type': 'application/json',
      };
      return await fetch(url, options);
    } else {
      return await authFetch(url, options);
    }
  } catch (error) {
    console.error(`API call error to ${url}:`, error);
    
    // Add more context to the error
    if (isGitHubPages) {
      // Special handling for GitHub Pages users
      const newError = new Error(
        `Failed to connect to backend at ${baseUrl}. ` +
        'If this is the first request, the backend might be starting up (can take 30-60 seconds). ' +
        'Please wait a moment and try again.'
      );
      newError.originalError = error;
      throw newError;
    } else {
      // For local development
      const newError = new Error(
        `Failed to connect to backend at ${baseUrl}. ` +
        'Please make sure your backend server is running.'
      );
      newError.originalError = error;
      throw newError;
    }
  }
}; 