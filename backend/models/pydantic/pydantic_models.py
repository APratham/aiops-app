# models.py
from pydantic import BaseModel
from typing import Optional, List

class User(BaseModel):
    sub: str 
    name: str 
    given_name: str
    family_name: str 
    picture: str

class UserInfo(BaseModel):
    user_email: str
    message: str  

class ContainerLogs(BaseModel):
    logs: str     

class StatusResponse(BaseModel):
    status: str
    service: str
    port: int 

class MessageResponse(BaseModel):
    message: str    

class ErrorResponse(BaseModel):
    detail: str    
    
class MessageResponseWithUser(BaseModel):
    message: str        
    user_name: Optional[str]