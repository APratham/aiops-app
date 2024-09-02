from fastapi import FastAPI, Depends, HTTPException, Header, status
from fastapi.responses import JSONResponse
from google.oauth2 import id_token
from google.auth.transport import requests

from models.pydantic import *
from typing import Optional
from middleware import CORSConfig
from kubernetes import client as k8s_client, config
import uvicorn 
import docker # type: ignore
import os
import logging

app = FastAPI()

CORSConfig(app)

PORT = os.getenv('PORT', 8000)

# Docker client initialisation
try:
    docker_client = docker.from_env()
except docker.errors.DockerException as e:
    raise HTTPException(status_code=500, detail="Docker client initialization failed")

# Kubernetes client initialisation
config.load_kube_config()
k8s_v1 = k8s_client.CoreV1Api()

# Google OAuth2 configuration
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

## Kubernetes API Routes
# Endpoint to list all pods in a namespace
@app.get("/kubernetes/pods/{namespace}", response_model=List[str])
async def list_pods(namespace: str):
    try:
        pods = k8s_v1.list_namespaced_pod(namespace)
        pod_names = [pod.metadata.name for pod in pods.items]
        return pod_names
    except k8s_client.exceptions.ApiException as e:
        raise HTTPException(status_code=e.status, detail=f"Kubernetes API error: {e.reason}")

# Endpoint to get details of a specific pod by name
@app.get("/kubernetes/pods/{namespace}/{pod_name}", response_model=dict)
async def get_pod_details(namespace: str, pod_name: str):
    try:
        pod = k8s_v1.read_namespaced_pod(name=pod_name, namespace=namespace)
        pod_info = {
            "name": pod.metadata.name,
            "namespace": pod.metadata.namespace,
            "node_name": pod.spec.node_name,
            "status": pod.status.phase,
            "labels": pod.metadata.labels,
            "containers": [
                {"name": container.name, "image": container.image} 
                for container in pod.spec.containers
            ],
            "start_time": pod.status.start_time,
        }
        return pod_info
    except k8s_client.exceptions.ApiException as e:
        raise HTTPException(status_code=e.status, detail=f"Pod not found: {e.reason}")

# Endpoint to get details of a specific node by name
@app.get("/kubernetes/nodes/{node_name}", response_model=dict)
async def get_node_details(node_name: str):
    try:
        node = k8s_v1.read_node(name=node_name)
        node_info = {
            "name": node.metadata.name,
            "labels": node.metadata.labels,
            "capacity": node.status.capacity,
            "allocatable": node.status.allocatable,
            "conditions": node.status.conditions,
        }
        return node_info
    except k8s_client.exceptions.ApiException as e:
        raise HTTPException(status_code=e.status, detail=f"Node not found: {e.reason}")

# Endpoint to get details of a specific service by name
@app.get("/kubernetes/services/{namespace}/{service_name}", response_model=dict)
async def get_service_details(namespace: str, service_name: str):
    try:
        service = k8s_v1.read_namespaced_service(name=service_name, namespace=namespace)
        service_info = {
            "name": service.metadata.name,
            "namespace": service.metadata.namespace,
            "labels": service.metadata.labels,
            "type": service.spec.type,
            "cluster_ip": service.spec.cluster_ip,
            "ports": [{"port": port.port, "target_port": port.target_port} for port in service.spec.ports],
            "selector": service.spec.selector,
        }
        return service_info
    except k8s_client.exceptions.ApiException as e:
        raise HTTPException(status_code=e.status, detail=f"Service not found: {e.reason}")

# Docker API Routes
#
#                        ##         .
#                  ## ## ##        ==
#               ## ## ## ## ##    ===
#           /"""""""""""""""""\___/ ===
#      ~~~ {~~ ~~~~ ~~~ ~~~~ ~~~ ~ /  ===- ~~~
#           \______ o           __/
#             \    \         __/
#              \____________/
#
#
# Route to list names of running Docker containers
@app.get("/docker-containers/list", response_model=list)
async def list_running_docker_containers():
    try:
        docker_client = docker.from_env()
        containers = docker_client.containers.list()

        container_names = [container.name for container in containers]
        
        return container_names

    except docker.errors.DockerException as e:
        raise HTTPException(status_code=500, detail="Docker API error")

# Route for container IDs
@app.get("/docker-containers/id/{container_id}", response_model=dict)
async def get_docker_container_info_by_id(container_id: str):
    try:
        docker_client = docker.from_env()
        container = docker_client.containers.get(container_id)
        
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
        docker_client = docker.from_env()
        container = docker_client.containers.get(container_name)
        
        # Slice the container ID to get the short version
        short_container_id = container.id[:12]

        container_info = {
            "id": short_container_id,  # Use the short ID
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