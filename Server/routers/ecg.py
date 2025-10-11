from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from services.ecg_service import predict_ecg

router = APIRouter()

# Define the request model
class PredictRequest(BaseModel):
    signals: List[List[float]]

@router.post("/predict", response_model=Dict[str, Any])
async def predict_ecg_route(request: PredictRequest):
    try:
        # Pass signals directly to the prediction function
        results = predict_ecg(request.signals)
        return {
            "status": "success",
            "data": results
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
