from fastapi import APIRouter, File, UploadFile, HTTPException
from pathlib import Path
import tempfile
import shutil
import os
from services.eeg_service import preprocess_edf, save_preprocessed_to_json

router = APIRouter(prefix="/eeg", tags=["EEG Preprocessing"])

@router.post("/preprocess-edf")
async def preprocess_eeg_endpoint(file: UploadFile = File(..., description="EDF file to preprocess")):
    """
    Upload EDF, preprocess, save JSON, return channels and access URL.
    """
    if not file.filename.endswith('.edf'):
        raise HTTPException(status_code=400, detail="File must be .edf")
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix='.edf') as temp_file:
        shutil.copyfileobj(file.file, temp_file)
        temp_path = temp_file.name
    
    try:
        # Preprocess
        channels, data, sfreq = preprocess_edf(temp_path)
        
        # Save JSON
        json_path = save_preprocessed_to_json(channels, data, sfreq, Path(file.filename).stem)
        
        # Local access URL (adjust host/port if needed)
        access_url = f"http://localhost:8000/{json_path}"
        
        return {
            "channels": channels,  # Should be 18
            "access_url": access_url,
            "message": f"Preprocessed data saved. Access at {access_url}"
        }
    
    finally:
        # Cleanup temp file
        os.unlink(temp_path)