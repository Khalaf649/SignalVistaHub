from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse, JSONResponse
from services.doppler_service import simulate_doppler, get_first_predicted_speed
from fastapi import UploadFile, File, HTTPException
import shutil
import os
router = APIRouter()


@router.get("/doppler")
async def doppler(
    frequency: float = Query(..., description="Source frequency (Hz)"),
    velocity: float = Query(..., description="Source velocity (m/s)"),
    duration: float = Query(..., description="Duration (s)")
):
    """
    Simulate Doppler effect siren.
    Returns: audio (WAV) + JSON with time, amplitude, frequency.
    """
    try:
        result = simulate_doppler(frequency, velocity, duration)

        # Return both JSON (plot data) and WAV stream
        return {
                "time": result["time"],
                "amplitude": result["amplitude"],
                "frequency": result["frequency"],
                "stats":{
                    "max_observed": result["max_frequency"],
                    "min_observed": result["min_frequency"],
                    "shift_ratio": result["shift_ratio"]
                }
            }

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@router.get("/doppler/audio")
async def doppler_audio(
    frequency: float = Query(...),
    velocity: float = Query(...),
    duration: float = Query(...),
):
    """Stream Doppler audio only (WAV)"""
    result = simulate_doppler(frequency, velocity, duration)
    return StreamingResponse(result["audio"], media_type="audio/wav")




UPLOAD_DIR = "uploads"  # directory to temporarily save uploaded audio files
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/dopplerAnalyze")
async def doppler_analyze(file: UploadFile = File(...)):
    """
    Upload an audio file named like 'VehicleName_trueSpeed.wav'
    and get the first predicted speed from the hardcoded model.
    """
    try:
        # 1️⃣ Save the uploaded file temporarily
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 2️⃣ Process the file
        result = get_first_predicted_speed(file_path)

        # 3️⃣ Optionally, clean up the uploaded file
        os.remove(file_path)

        return {"predictedVelocity": result, "predictedFrequency": 440}  # Placeholder frequency

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
