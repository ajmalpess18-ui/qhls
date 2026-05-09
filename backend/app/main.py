from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.database import engine
from app.models import *  # registers all models
from app.database import Base

from app.routers import auth, public, admin, state, district, zone, unit, faculty, student
from app.core.config import settings

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import json

# Create all tables
Base.metadata.create_all(bind=engine)

# Create upload directory
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "materials"), exist_ok=True)

app = FastAPI(
    title="QHLS API",
    description="Quran Hadees Learning School — Management System API",
    version="1.0.0",
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    with open("validation_errors.log", "a") as f:
        f.write(f"Validation error on {request.method} {request.url}:\n")
        f.write(json.dumps(exc.errors(), indent=2))
        f.write("\nBody:\n")
        try:
            body = await request.body()
            f.write(body.decode())
        except:
            pass
        f.write("\n---\n")
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://qhls.vercel.app/docs", "https://qhls.vercel.app", "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Register all routers
app.include_router(auth.router)
app.include_router(public.router)
app.include_router(admin.router)
app.include_router(state.router)
app.include_router(district.router)
app.include_router(zone.router)
app.include_router(unit.router)
app.include_router(faculty.router)
app.include_router(student.router)


# Serve React Frontend Build
from fastapi.responses import FileResponse
from fastapi import HTTPException

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))
assets_dir = os.path.join(frontend_dist, "assets")

if os.path.exists(frontend_dist):
    # Only mount assets if the folder actually exists to prevent RuntimeError
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{catchall:path}")
    def serve_react_app(catchall: str):
        # Prevent catching API/System routes
        if catchall.startswith("uploads/") or catchall.startswith("api/") or catchall == "docs" or catchall == "openapi.json":
            raise HTTPException(status_code=404, detail="Not Found")
        
        index_path = os.path.join(frontend_dist, "index.html")
        file_path = os.path.join(frontend_dist, catchall)
        
        # Serve static files if they exist (e.g. vite.svg, robots.txt)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
            
        # Fallback to index.html for SPA routing
        if os.path.exists(index_path):
            return FileResponse(index_path)
            
        return {"message": "Frontend build not found at " + frontend_dist}
else:
    @app.get("/")
    def root():
        return {"message": "QHLS API is running (Frontend not built)", "docs": "/docs"}
