from fastapi import FastAPI, Depends, HTTPException, Header, status
from fastapi.responses import JSONResponse

from google.auth.transport import requests

from models.pydantic import *
from typing import Optional
from middleware import CORSConfig
import uvicorn 
import os
import logging

app = FastAPI()

CORSConfig(app)

GOOGLE_OAUTH2_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo"
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

async def verify_google_oauth_token(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        scheme, token = authorization.split()
        
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify the access token using Google's tokeninfo endpoint
        response = requests.get(f'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token={token}')

        token_info = response.json()
        logging.error(token_info)
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {token_info.get('error_description', 'Unknown error')}",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if the token's audience matches your CLIENT_ID
        if token_info['audience'] != CLIENT_ID:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not verify audience.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Token is valid; return user information (e.g., email, user_id)
        return token_info
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
@app.get("/protected-endpoint", response_model=UserInfo)
async def protected_endpoint(idinfo: dict = Depends(verify_google_oauth_token)):
    response_data = {
        "message": "This is a protected endpoint",
        "user_email": idinfo['email']
    }
    return JSONResponse(content=response_data) 

@app.get("/test-endpoint")
async def test_endpoint():
    return {"message": "FastAPI is working!"}   

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)