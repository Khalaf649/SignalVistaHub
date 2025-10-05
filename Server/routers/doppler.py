from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse, JSONResponse
from services.doppler_service import simulate_doppler

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
