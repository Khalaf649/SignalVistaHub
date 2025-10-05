import os
import torch
from transformers import pipeline

# Global variable to store the classifier
classifier = None

def load_drone_model():
    """Load the model once at startup"""
    global classifier
    model_id = "preszzz/drone-audio-detection-05-17-trial-0"
    try:
        print("Loading model... This may take a moment.")
        classifier = pipeline(
            "audio-classification",
            model=model_id,
            device=0 if torch.cuda.is_available() else -1  # FastAPI uses -1 for CPU
        )
        print("✅ Model loaded successfully!")
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        classifier = None

def predict_drone(audio_file_path: str):
    """Run prediction on an audio file"""
    if classifier is None:
        raise RuntimeError("Model not loaded.")

    predictions = classifier(audio_file_path)
    top_prediction = predictions[0]

    return {
        "classification": top_prediction["label"],
        "confidence": round(top_prediction["score"], 4),
        "status": "success"
    }
