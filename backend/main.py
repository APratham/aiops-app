## ------------------ FastAPI Entry Point ------------------ ## 
#                               __
#     ____     ____          __/ /_ __        __
#    / _  \   / __ \________/_   _// /_  ____/ /.-..-.
#   / __  /  / ____/ __/ _ / /  /_/ __ \/ _ / .-. /, /
#  /_/ /_/../_/   /_/ /___/_/____/_/ /_/___/_/  // //
# 
# --------------------------------------------------------- #
#
# Antariksh Pratham, N1191635
# Major Project appplication
# Masters in Cloud Computing, Nottingham Trent University
# -------------------------------------------------------- #
#
# This is the main entry point for the FastAPI application.
# FastAPI uses Restful APIs to interact with the Kubernetes and 
# Docker APIs to provide information about the Docker containers,
# Kubernetes pods, nodes and services. This file contains the backend
# logic for the application. These APIs are protected by Google OAuth2
# token verification. The application is also configured to expose 
# the APIs to the frontend application using an Express.js server.
# -------------------------------------------------------- #
#
# GNU Affero General Public License v3 (AGPLv3)
# 
# This software is licensed under the GNU Affero General Public 
# License version 3 (AGPLv3). By using or modifying this software, 
# you agree to the following terms:
# 
# 1. Source Code Availability: You must provide access to the complete
#   source code of any modified version of this software when it is
#  used to provide a service over a network. This obligation extends
#  to the source code of the software itself and any derivative works.
# 
# 2. Copyleft: Any distribution of this software or derivative works
# must be licensed under the AGPLv3. You may not impose any additional
# restrictions beyond those contained in this license.
# 
# 3. Disclaimer of Warranty: This software is provided "as-is," without
# any warranty of any kind, express or implied, including but not 
# limited to the warranties of merchantability or fitness for a 
# particular purpose.
# 
# For the full terms of the AGPLv3, please refer to the full license 
# text available at https://www.gnu.org/licenses/agpl-3.0.html.
# ---------------------------------------------------------- #

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

# Function to verify the Google OAuth token partially adapted from the Google OAuth2 documentation
# Copyright 2016 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this code except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

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
# The "Moby Duck" is a registered trademark of Docker, Inc. registered 
# in the United States and other countries. 
# Docker ASCII art from Boot2Docker. 
#
# Copyright 2004 by Andreas Brekken
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this code except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
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
  
# Route for container logs using id
@app.get("/docker-containers/id/{container_id}/logs", 
         response_model=ContainerLogs, 
         responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def get_logs_by_id(container_id: str, lines: Optional[int] = 14):
    try:
        docker_client = docker.from_env()
        container = docker_client.containers.get(container_id)
        logs = container.logs(tail=lines).decode('utf-8')
        return {"logs": logs}
    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail=f"No container found with ID: {container_id}")
    except docker.errors.DockerException as e:
        raise HTTPException(status_code=500, detail=str(e)) 
    
# Route for container logs using name
@app.get("/docker-containers/name/{container_name}/logs", 
         response_model=ContainerLogs, 
         responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def get_logs_by_name(container_name: str, lines: Optional[int] = 14):
    try:
        docker_client = docker.from_env()
        container = docker_client.containers.get(container_name)
        logs = container.logs(tail=lines).decode('utf-8')
        return {"logs": logs}
    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail=f"No container found with name: {container_name}")
    except docker.errors.DockerException as e:
        raise HTTPException(status_code=500, detail=str(e))    

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)