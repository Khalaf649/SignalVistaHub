from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import drone, doppler, eeg, ecg, sar  # Assuming your other routers exist
from services.drone_service import load_drone_model  # Your drone loader
    
# Note: ECG model loaded on-demand in endpoint, so no import/load here
from fastapi.staticfiles import StaticFiles

app = FastAPI(
    max_request_body_size=2 * 1024 * 1024 * 1024  # 2 GB limit for large EDF files
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/public", StaticFiles(directory="../client/public"), name="client_public")
# Serve static files (images)
app.mount("/static", StaticFiles(directory="static"), name="static")
# Enable CORS (frontend can call APIs)
# Routers
app.include_router(drone.router, prefix="/api", tags=["Drone Detection"])
app.include_router(doppler.router, prefix="/api", tags=["Doppler Simulation"])
app.include_router(eeg.router, prefix="/api", tags=["EEG Conversion"])
app.include_router(ecg.router, prefix="/api", tags=["ECG Diagnosis"])
app.include_router(sar.router, prefix="/api", tags=["Sentinel-1 GRD"])

@app.on_event("startup")
def startup_event():
    print("Loading models on startup...")
    load_drone_model()  # Load HuggingFace drone classifier
    # ECG loaded on-demand in endpoint
    print("Startup complete (ECG loads per request)")

@app.get("/")
def root():
    return {"message": "🚀 Drone + Doppler + EEG + ECG API is running"}