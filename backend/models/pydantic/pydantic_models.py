# models.py
from pydantic import BaseModel
from typing import Optional

class User(BaseModel):
    sub: str 
    name: str 
    given_name: str
    family_name: str 
    picture: str

class UserInfo(BaseModel):
    user_email: str
    message: str   

class StatusResponse(BaseModel):
    status: str
    service: str
    port: int 

class MessageResponse(BaseModel):
    message: str    
    
class MessageResponseWithUser(BaseModel):
    message: str        
    user_name: Optional[str]