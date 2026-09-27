from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.router import api_router
from backend.config import settings

app = FastAPI(title="TraceOne Backend API", version="0.1.0")

# Development origins only. Production origins should be configured explicitly later.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
app.include_router(api_router)


@app.get("/")
def root() -> dict[str, str]:
    return {"name": "TraceOne Backend API", "version": app.version}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "traceone-backend"}
