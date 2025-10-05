from fastapi import APIRouter, UploadFile, File, HTTPException
from services.drone_service import predict_drone
import os

router = APIRouter()

@router.post("/predictDrone")
async def predict_drone_endpoint(audio: UploadFile = File(...)):
    """Endpoint for drone audio detection"""
    temp_path = "temp_audio.wav"

    try:
        # Save uploaded file temporarily
        with open(temp_path, "wb") as f:
            f.write(await audio.read())

        # Run prediction
        result = predict_drone(temp_path)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

    finally:
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
