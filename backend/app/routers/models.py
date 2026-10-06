import shutil
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File
from app.config import settings

router = APIRouter(prefix="/api/models", tags=["VRM Models"])

@router.get("")
async def list_models():
    """
    List all available .vrm models in static/models directory.
    """
    models = []
    for p in settings.MODELS_DIR.glob("*.vrm"):
        models.append({
            "filename": p.name,
            "url": f"/static/models/{p.name}",
            "size_mb": round(p.stat().st_size / (1024 * 1024), 2)
        })
    return {
        "status": "success",
        "data": models
    }

@router.post("/upload")
async def upload_model(file: UploadFile = File(...)):
    """
    Upload a new .vrm model file.
    """
    if not file.filename.lower().endswith(".vrm"):
        raise HTTPException(status_code=400, detail="Only .vrm files are allowed")

    target_path = settings.MODELS_DIR / file.filename
    try:
        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return {
            "status": "success",
            "data": {
                "filename": file.filename,
                "url": f"/static/models/{file.filename}",
                "size_mb": round(target_path.stat().st_size / (1024 * 1024), 2)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload VRM: {str(e)}")
