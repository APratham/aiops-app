from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from pydantic import BaseModel
from google.auth import jwt
from google.auth.transport import requests
from pydantic_models import *
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from middleware import CORSMiddleware
import requests
import json
import os

app = FastAPI()

CORSMiddleware(app)

GOOGLE_OAUTH2_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo"
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

async def verify_google_oauth_token(token: str):
    try:
        # Asynchronous token verification
        idinfo = jwt.decode(token, audience=CLIENT_ID, request=requests.Request())
        
        if idinfo['aud'] != CLIENT_ID:
            raise ValueError('Could not verify audience.')
        
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')
        
        # Token is valid; return user information
        return idinfo
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
@app.get("/protected-endpoint", response_model=UserInfo)
async def protected_endpoint(idinfo: dict = Depends(verify_google_oauth_token)):
    response_data = {
        "message": "This is a protected endpoint",
        "user_email": idinfo['email']
    }
    return JSONResponse(content=response_data)    