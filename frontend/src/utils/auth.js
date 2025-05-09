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
    if (endpoint === '/api/socratic') {
      apiEndpoint = '/public/seminar';
    } else if (endpoint === '/seminar') {
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
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  // Add authentication headers if needed
  if (!isGitHubPages && !getCurrentUser()?.isGuest) {
    const token = getAuthToken();
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  try {
    console.log(`Making API request to ${url}`, { 
      method, 
      headers: options.headers,
      data: data ? JSON.stringify(data).substring(0, 100) + '...' : null 
    });
    
    // Add timeout to fetch requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Log response info for debugging
    console.log(`Received response from ${url}:`, {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
      headers: Object.fromEntries([...response.headers.entries()])
    });
    
    return response;
  } catch (error) {
    console.error(`API call error to ${url}:`, error);
    
    // Add more context to the error
    let errorMessage = '';
    
    if (error.name === 'AbortError') {
      errorMessage = 'Request timed out after 30 seconds. The server might be overloaded or starting up.';
    } else if (isGitHubPages) {
      // Special handling for GitHub Pages users
      errorMessage = `Failed to connect to backend at ${baseUrl}. ` +
        'If this is the first request, the backend might be starting up (can take 30-60 seconds). ' +
        'Please wait a moment and try again.';
    } else {
      // For local development
      errorMessage = `Failed to connect to backend at ${baseUrl}. ` +
        'Please make sure your backend server is running on port 8002 using: cd backend && python -m uvicorn app:app --port 8002';
    }
    
    const newError = new Error(errorMessage);
    newError.originalError = error;
    throw newError;
  }
}; 