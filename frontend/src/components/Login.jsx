import React, { useState, useEffect } from 'react';

const Login = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize Google Sign-In when the component mounts
  useEffect(() => {
    // Load the Google Sign-In API script
    const loadGoogleScript = () => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.body.appendChild(script);
    };

    // Initialize the Google Sign-In button
    const initializeGoogleSignIn = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '123456789-example.apps.googleusercontent.com',
          callback: handleGoogleSignIn,
        });

        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          { 
            theme: 'filled_blue', 
            size: 'large',
            type: 'standard',
            shape: 'rectangular',
            text: 'signin_with',
            logo_alignment: 'left',
            width: 280
          }
        );
      }
    };

    loadGoogleScript();

    return () => {
      // Clean up any listeners if necessary
      const scriptTag = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (scriptTag) {
        scriptTag.remove();
      }
    };
  }, []);

  // Handle the Google Sign-In response
  const handleGoogleSignIn = async (response) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Send the ID token to your backend for verification
      const backendResponse = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: response.credential,
        }),
      });

      if (!backendResponse.ok) {
        throw new Error('Authentication failed');
      }

      const data = await backendResponse.json();
      
      // Save the JWT token and user info to localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Call the onLogin callback to notify the parent component
      onLogin(data.user);
    } catch (error) {
      console.error('Login error:', error);
      setError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // For demo purposes, add a guest login option
  const handleGuestLogin = () => {
    const guestUser = {
      id: 'guest-user',
      name: 'Guest User',
      email: 'guest@example.com',
      picture: null,
      isGuest: true
    };
    
    localStorage.setItem('user', JSON.stringify(guestUser));
    onLogin(guestUser);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md p-8 mx-4 bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <svg
              className="w-16 h-16 text-primary-500"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.5 12C7.5 12 9 9 12 9C15 9 16.5 12 16.5 12C16.5 12 15 15 12 15C9 15 7.5 12 7.5 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="12"
                r="2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-primary-500">AI Socratic Seminar</h1>
          <p className="text-gray-400 text-sm">
            Engage in philosophical discussions with AI-powered thinkers inspired by history's greatest minds
          </p>
        </div>
        
        <div className="space-y-6">
          <h2 className="text-xl font-medium text-center text-white">Sign in to continue</h2>
          
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 text-sm text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div id="google-signin-button" className="flex justify-center"></div>
            
            <div className="relative flex items-center justify-center my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative px-4 text-sm text-gray-500 bg-gray-900">or</div>
            </div>
            
            <button 
              className="w-full py-3 px-4 rounded-xl bg-white/10 border border-white/10 text-white font-medium hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:opacity-50"
              onClick={handleGuestLogin}
              disabled={isLoading}
            >
              Continue as Guest
            </button>
          </div>
          
          {isLoading && (
            <div className="flex justify-center items-center text-primary-300">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </div>
          )}
        </div>
        
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>By signing in, you agree to our <a href="#" className="text-primary-400 hover:text-primary-300">Terms of Service</a> and <a href="#" className="text-primary-400 hover:text-primary-300">Privacy Policy</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login; 