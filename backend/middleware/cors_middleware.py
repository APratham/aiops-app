# middleware.py
from fastapi.middleware.cors import CORSMiddleware

def CORSConfig(app):
    origins = [
        "http://localhost:8100",
        "http://127.0.0.1:8100",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:4000",
        "http://127.0.0.1:4000",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
