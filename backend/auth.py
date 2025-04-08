import os
import jwt
import json
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# JWT configurations
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_SECONDS = 86400  # 24 hours

# Google OAuth configurations
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

# Security scheme for JWT
security = HTTPBearer()

class TokenData(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    exp: int

class GoogleSignInRequest(BaseModel):
    idToken: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

async def verify_google_token(token: str) -> Dict[str, Any]:
    """Verify the Google ID token and return user info if valid."""
    try:
        # In a production environment, use the Google API client library
        # For simplicity, we're using httpx to validate the token
        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            
            if response.status_code != 200:
                logger.error(f"Failed to verify Google token: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication credentials",
                )
            
            token_info = response.json()
            
            # Verify the audience (client ID)
            if GOOGLE_CLIENT_ID and token_info.get("aud") != GOOGLE_CLIENT_ID:
                logger.error(f"Token audience mismatch: {token_info.get('aud')} != {GOOGLE_CLIENT_ID}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token audience",
                )
            
            return {
                "id": token_info.get("sub"),
                "email": token_info.get("email"),
                "name": token_info.get("name"),
                "picture": token_info.get("picture"),
            }
    except Exception as e:
        logger.error(f"Error verifying Google token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

def create_access_token(data: Dict[str, Any]) -> str:
    """Create a JWT access token for the authenticated user."""
    payload = data.copy()
    expiration = datetime.utcnow() + timedelta(seconds=JWT_EXPIRATION_SECONDS)
    payload.update({"exp": expiration.timestamp()})
    
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> TokenData:
    """Decode and validate the JWT access token."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        token_data = TokenData(**payload)
        
        # Check if token is expired
        if datetime.utcnow().timestamp() > token_data.exp:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
            )
        
        return token_data
    except jwt.PyJWTError as e:
        logger.error(f"JWT decode error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenData:
    """FastAPI dependency to get the current authenticated user."""
    try:
        token = credentials.credentials
        return decode_access_token(token)
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        ) 