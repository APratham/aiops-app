# models.py
from pydantic import BaseModel

class Item(BaseModel):
    data: str

class User(BaseModel):
    sub: str 
    name: str 
    given_name: str
    family_name: str 
    picture: str