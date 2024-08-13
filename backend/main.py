from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from pydantic import BaseModel
from pydantic_models import *
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from middleware import CORSMiddleware

app = FastAPI()

CORSMiddleware(app)

class Item(BaseModel):
    data: str

@app.post("/receive-data/")
async def receive_data(item: Item):
    print(f"Data received: {item.data}")
    return {"message": "Data received", "yourData": item.data}