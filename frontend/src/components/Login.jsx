import React, { useState, useEffect } from 'react';
import '../styles/Login.css';

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
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <h1>AI Socratic Seminar</h1>
          <p className="login-description">
            Engage in philosophical discussions with AI-powered thinkers inspired by history's greatest minds
          </p>
        </div>
        
        <div className="login-options">
          <h2>Sign in to continue</h2>
          
          {error && <div className="login-error">{error}</div>}
          
          <div className="login-buttons">
            <div id="google-signin-button" className="google-signin-button"></div>
            
            <div className="login-divider">
              <span>or</span>
            </div>
            
            <button 
              className="guest-login-button" 
              onClick={handleGuestLogin}
              disabled={isLoading}
            >
              Continue as Guest
            </button>
          </div>
          
          {isLoading && <div className="login-loading">Loading...</div>}
        </div>
        
        <div className="login-footer">
          <p>By signing in, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login; 