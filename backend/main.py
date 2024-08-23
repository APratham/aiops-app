from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.responses import JSONResponse
from google.oauth2 import id_token
from google.auth.transport import requests

from models.pydantic import *
from typing import Optional
from middleware import CORSConfig
import uvicorn 
from dotenv import load_dotenv
import os
import logging
load_dotenv()
app = FastAPI()

CORSConfig(app)

GOOGLE_OAUTH2_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo"
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

async def verify_google_oauth_token(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    
    # Extract the Bearer token from the Authorization header
    token = authorization.split(" ")[1]

    try:
        print('CLIENT_ID = ', os.getenv("GOOGLE_CLIENT_ID"))
        # Verify the token using google-auth library
        id_info = id_token.verify_oauth2_token(token, requests.Request(), CLIENT_ID)

        # Optionally check if the token is valid for the correct audience
        if id_info['aud'] != CLIENT_ID:
            raise ValueError('Could not verify audience.')

        # The token is valid, return the decoded token information
        return id_info
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
@app.get("/protected-endpoint", response_model=UserInfo)
async def protected_endpoint(idinfo: dict = Depends(verify_google_oauth_token)):
    print('idinfo = ', idinfo.get('email'))
    response_data = {
        "message": "This is a protected endpoint",
        "user_name": idinfo['name']
    }
    return JSONResponse(content=response_data) 

@app.get("/test-endpoint")
async def test_endpoint():
    return {"message": "FastAPI is working!"}   

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)