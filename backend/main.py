from fastapi import FastAPI, Depends, HTTPException, Header, status
from fastapi.responses import JSONResponse
from google.oauth2 import id_token
from google.auth.transport import requests

from models.pydantic import *
from typing import Optional
from middleware import CORSConfig
import uvicorn 
import docker # type: ignore
import os
import logging

app = FastAPI()

CORSConfig(app)

PORT = os.getenv('PORT', 8000)

GOOGLE_OAUTH2_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo"
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

# Function to verify the Google OAuth token
async def verify_google_oauth_token(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing")

    try:
        # Extract the token from the 'Bearer <token>' format
        token = authorization.split(" ")[1]
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), CLIENT_ID)
        return idinfo  # Return the verified idinfo dictionary

    except ValueError as e:
        logging.error(f"Error occurred: {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

# Protected endpoint that depends on token verification
@app.get("/protected-endpoint", response_model=MessageResponseWithUser) # Change to MessageResponse once all endpoints are protected
async def protected_endpoint(idinfo: dict = Depends(verify_google_oauth_token)):
    response_data = {
        "message": "This is a protected endpoint",
        "user_name": idinfo['name']  # Extra field
    }

    validated_data = MessageResponseWithUser(**response_data).dict() # Force validation
    
    return validated_data

@app.get("/test-endpoint", response_model=MessageResponse)
async def test_endpoint():
    return {"message": "FastAPI is working!"}  

# Status endpoint to check if the service is running
@app.get("/status", response_model=StatusResponse)
async def read_status():
    return {"status": "ok", "service": "Python Service", "port": PORT} 

# Route to list names of running Docker containers
@app.get("/docker-containers/list", response_model=list)
async def list_running_docker_containers():
    try:
        client = docker.from_env()
        containers = client.containers.list()

        container_names = [container.name for container in containers]
        
        return container_names

    except docker.errors.DockerException as e:
        raise HTTPException(status_code=500, detail="Docker API error")

# Route for container IDs
@app.get("/docker-containers/id/{container_id}", response_model=dict)
async def get_docker_container_info_by_id(container_id: str):
    try:
        client = docker.from_env()
        container = client.containers.get(container_id)
        
        container_info = {
            "id": container.id,
            "name": container.name,
            "status": container.status,
            "image": container.image.tags,
            "created": container.attrs['Created'],
            "ports": container.attrs['NetworkSettings']['Ports'],
            "state": container.attrs['State'],
        }

        return container_info

    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail=f"Container with ID '{container_id}' not found")
    except docker.errors.DockerException as e:
        raise HTTPException(status_code=500, detail="Docker API error")

# Route for container names
@app.get("/docker-containers/name/{container_name}", response_model=dict)
async def get_docker_container_info_by_name(container_name: str):
    try:
        client = docker.from_env()
        container = client.containers.get(container_name)
        
        container_info = {
            "id": container.id,
            "name": container.name,
            "status": container.status,
            "image": container.image.tags,
            "created": container.attrs['Created'],
            "ports": container.attrs['NetworkSettings']['Ports'],
            "state": container.attrs['State'],
        }

        return container_info
    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail=f"Container with name '{container_name}' not found")

   # except docker.errors.NotFound:
   #     raise HTTPException(status_code=404, detail=f"Container with name '{container_name}' not found")
   # except docker.errors.DockerException as e:
   #     raise HTTPException(status_code=500, detail="Docker API error")
  

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)