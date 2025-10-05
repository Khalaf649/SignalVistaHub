from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from services.ecg_service import predict_ecg  # No model import needed

router = APIRouter(prefix="/ecg", tags=["ECG Diagnosis"])

class PredictRequest(BaseModel):
    json_path: str  # Relative path, e.g., "ecg_data/records500/hr/00800_hr.json"

@router.post("/predict", response_model=Dict[str, Any])
async def predict_ecg_route(request: PredictRequest):
    try:
        # Full path relative to server/
        full_path = f"../client/public/ecg-data/records500/{request.json_path}"
        print(f"Predicting on file: {full_path}")
        results = predict_ecg(full_path)  # Model loads inside run_inference
        return {
            "status": "success",
            "data": results
        }
    except FileNotFoundError:
        print(f"JSON file not found: {request.json_path}")
        raise HTTPException(status_code=404, detail=f"JSON file not found at {request.json_path}")
    except Exception as e:
        print(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@router.get("/health")
async def health_check():
    # Simple health (no model dep)
    return {"status": "healthy", "note": "ECG model loads fresh per prediction call"}