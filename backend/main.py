from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Define a list of origins that should be allowed to make cross-origin requests.
origins = [
    "http://localhost:8100",  # Allow frontend origin
    "http://127.0.0.1:8100",   # Optionally allow a different form of the frontend host
    "http://localhost:3000",  # Allow backend origin
    "http://127.0.0.1:3000"   # Optionally allow a different form of the backend host
]

# Add CORS middleware to allow specified origins to make requests to your API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class Item(BaseModel):
    data: str

@app.post("/receive-data/")
async def receive_data(item: Item):
    print(f"Data received: {item.data}")
    return {"message": "Data received", "yourData": item.data}