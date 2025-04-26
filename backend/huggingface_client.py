from typing import Any, Dict, Optional, Callable, List
import time
import asyncio
import logging
from functools import wraps
import requests
from fastapi import HTTPException
import os

logger = logging.getLogger(__name__)

class HuggingFaceError(Exception):
    """Base exception class for Hugging Face-related errors"""
    def __init__(self, message: str, status_code: int = 500, original_error: Optional[Exception] = None):
        super().__init__(message)
        self.status_code = status_code
        self.original_error = original_error
        self.message = message

class RateLimitError(HuggingFaceError):
    """Raised when Hugging Face API rate limit is hit"""
    def __init__(self, message: str = "Rate limit exceeded", original_error: Optional[Exception] = None):
        super().__init__(message, status_code=429, original_error=original_error)

class TokenLimitError(HuggingFaceError):
    """Raised when token limit is exceeded"""
    def __init__(self, message: str = "Token limit exceeded", original_error: Optional[Exception] = None):
        super().__init__(message, status_code=400, original_error=original_error)

class AuthenticationError(HuggingFaceError):
    """Raised when there are authentication issues"""
    def __init__(self, message: str = "Authentication failed", original_error: Optional[Exception] = None):
        super().__init__(message, status_code=401, original_error=original_error)

class ModelNotAvailableError(HuggingFaceError):
    """Raised when the requested model is not available"""
    def __init__(self, message: str = "Model not available", original_error: Optional[Exception] = None):
        super().__init__(message, status_code=503, original_error=original_error)

def map_huggingface_error(error: Exception) -> HuggingFaceError:
    """Maps Hugging Face exceptions to our custom exception types"""
    error_str = str(error).lower()
    
    if "rate limit" in error_str:
        return RateLimitError(original_error=error)
    elif any(phrase in error_str for phrase in [
            "maximum context length", 
            "token", 
            "too many tokens", 
            "exceed", 
            "context window", 
            "input is too long"
        ]):
        return TokenLimitError(f"Token limit exceeded: {error_str}", original_error=error)
    elif "authentication" in error_str or "api key" in error_str or "invalid key" in error_str:
        return AuthenticationError(original_error=error)
    elif "model" in error_str and any(phrase in error_str for phrase in [
            "not found", 
            "currently unavailable", 
            "overloaded", 
            "capacity"
        ]):
        return ModelNotAvailableError(f"Model unavailable: {error_str}", original_error=error)
    else:
        return HuggingFaceError(f"Hugging Face API error: {str(error)}", original_error=error)

def retry_with_exponential_backoff(
    max_retries: int = 5,
    initial_delay: float = 1,
    max_delay: float = 60,
    exponential_base: float = 2,
    retry_on: tuple = (RateLimitError, ModelNotAvailableError)
):
    """
    Decorator that implements exponential backoff for Hugging Face API calls
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            delay = initial_delay
            last_exception = None

            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    mapped_error = map_huggingface_error(e)
                    last_exception = mapped_error

                    if not isinstance(mapped_error, retry_on):
                        raise mapped_error

                    if attempt == max_retries - 1:
                        logger.error(f"Max retries ({max_retries}) exceeded for Hugging Face API call",
                                   extra={"error": str(mapped_error), "attempt": attempt + 1})
                        raise mapped_error

                    wait_time = min(delay * (exponential_base ** attempt), max_delay)
                    logger.warning(f"Hugging Face API call failed. Retrying in {wait_time:.2f} seconds...",
                                 extra={"error": str(mapped_error), "attempt": attempt + 1})
                    time.sleep(wait_time)

            raise last_exception

        return wrapper
    return decorator

class HuggingFaceClient:
    """Wrapper around Hugging Face Inference API with enhanced error handling"""
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.model = os.getenv("HF_MODEL", "meta-llama/Llama-3.1-8B-Instruct")
        self.api_url = f"https://api-inference.huggingface.co/models/{self.model}"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        self.default_retry_config = {
            "max_retries": 5,
            "initial_delay": 1,
            "max_delay": 60,
            "exponential_base": 2
        }
        logger.info(f"Initialized HuggingFaceClient with model: {self.model}")

    def _format_messages(self, messages: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """Format messages for Llama-3.1 chat format"""
        formatted_messages = []
        system_messages = []
        
        # First, separate system messages from the rest
        for msg in messages:
            if msg["role"] == "system":
                system_messages.append(msg["content"])
            else:
                formatted_messages.append(msg)
        
        # If we have system messages, combine them and add as the first message
        if system_messages:
            combined_system = "\n\n".join(system_messages)
            # For Llama 3.1, system messages are still added at the beginning
            formatted_messages.insert(0, {"role": "system", "content": combined_system})
        
        logger.debug(f"Formatted {len(messages)} messages into {len(formatted_messages)} messages for Llama-3.1")
        return formatted_messages

    @retry_with_exponential_backoff()
    async def create_chat_completion(self, messages: List[Dict[str, str]], **kwargs) -> Dict[str, Any]:
        """
        Create a chat completion with enhanced error handling and retry logic
        """
        try:
            formatted_messages = self._format_messages(messages)
            
            # Build payload according to Llama-3.1 requirements
            payload = {
                "inputs": formatted_messages,
                "parameters": {
                    "max_new_tokens": kwargs.get("max_tokens", 500),
                    "temperature": kwargs.get("temperature", 0.7),
                    "top_p": kwargs.get("top_p", 0.95),
                    "repetition_penalty": kwargs.get("frequency_penalty", 1.0) + 0.3,  # Convert frequency_penalty to repetition_penalty
                    "do_sample": True,
                    "return_full_text": False,
                    "stop": ["<|endoftext|>"]  # Llama 3.1 stop token
                }
            }
            
            # Filter out parameters with None values
            parameters = payload["parameters"]
            payload["parameters"] = {k: v for k, v in parameters.items() if v is not None}

            logger.debug(f"Sending request to {self.api_url} with {len(formatted_messages)} messages")
            response = await asyncio.to_thread(
                lambda: requests.post(self.api_url, headers=self.headers, json=payload, timeout=60)
            )

            if response.status_code != 200:
                logger.error(f"API request failed with status {response.status_code}: {response.text}")
                raise Exception(f"API request failed with status {response.status_code}: {response.text}")

            result = response.json()
            logger.debug(f"Received response of length {len(str(result))} bytes")
            
            # Format the response in a standard structure similar to OpenAI for compatibility
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": result[0]["generated_text"] if isinstance(result, list) else result["generated_text"]
                    },
                    "finish_reason": "stop"
                }],
                "model": self.model,
                "usage": {
                    "prompt_tokens": 0,  # Not provided by Hugging Face API
                    "completion_tokens": 0,
                    "total_tokens": 0
                }
            }

        except Exception as e:
            mapped_error = map_huggingface_error(e)
            logger.error("Error in create_chat_completion",
                        extra={
                            "error_type": type(mapped_error).__name__,
                            "error_message": str(mapped_error),
                            "original_error": str(mapped_error.original_error) if mapped_error.original_error else None
                        })
            raise mapped_error

    def get_error_response(self, error: HuggingFaceError) -> Dict[str, Any]:
        """
        Generate a user-friendly error response
        """
        error_messages = {
            RateLimitError: {
                "message": "The service is experiencing high demand. Please try again in a few moments.",
                "suggestions": [
                    "Wait a few seconds and try again",
                    "Try with a shorter prompt or fewer agents",
                    "Start a new conversation if this persists"
                ]
            },
            TokenLimitError: {
                "message": "The conversation is too long for the AI to process.",
                "suggestions": [
                    "Try sending a shorter message",
                    "Start a new conversation",
                    "Reduce the number of agents in the conversation",
                    "Focus on one specific topic at a time"
                ]
            },
            AuthenticationError: {
                "message": "There was an authentication error with the AI service.",
                "suggestions": [
                    "Refresh the page and try again",
                    "Contact support if this persists",
                    "Check if the service is currently experiencing issues"
                ]
            },
            ModelNotAvailableError: {
                "message": "The AI model is temporarily unavailable.",
                "suggestions": [
                    "Try again in a few minutes",
                    "Try with a different agent or fewer agents",
                    "Check Hugging Face status page for any ongoing issues"
                ]
            }
        }
        
        error_type = type(error)
        default_response = {
            "message": "An unexpected error occurred. Please try again later.",
            "suggestions": [
                "Refresh and try again",
                "Start a new conversation",
                "Try with a different question or fewer agents"
            ]
        }
        
        error_info = error_messages.get(error_type, default_response)
        
        return {
            "error": True,
            "message": error_info["message"],
            "suggestions": error_info["suggestions"],
            "status_code": error.status_code,
            "error_type": error_type.__name__
        }

    def handle_api_error(self, error: Exception) -> Dict[str, Any]:
        """
        Handle API errors and return appropriate response
        """
        mapped_error = map_huggingface_error(error)
        logger.error(f"Hugging Face API error occurred: {str(mapped_error)}",
                    extra={
                        "error_type": type(mapped_error).__name__,
                        "original_error": str(error)
                    })
        return self.get_error_response(mapped_error) 