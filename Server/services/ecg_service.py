import json
import numpy as np
from keras.models import load_model
from keras.optimizers import Adam
from scipy.signal import resample
from typing import Tuple, Dict, Any

# Abnormality labels (in model output order)
LABELS = ['1dAVb', 'RBBB', 'LBBB', 'SB', 'AF', 'ST']

def load_json_file(json_path: str) -> np.ndarray:
    """Load JSON file and extract signals as (5000, 12) array."""
    with open(json_path, 'r') as f:
        data = json.load(f)
    signals = np.array(data['signals'])
    if signals.shape != (5000, 12):
        raise ValueError(f"Expected signals shape (5000, 12), got {signals.shape}")
    return signals

def prepare_input(ecg_data: np.ndarray, scale_factor: float = 0.01, normalize: bool = False) -> np.ndarray:
    """Resample to 400 Hz (pad to 4096), scale (default /100 for μV to model units), optional z-norm per lead, add batch dim."""
    # Ensure float32 early
    ecg_data = ecg_data.astype(np.float32)
    # Resample 5000 @500Hz to 4000 @400Hz (10s duration)
    num_samples_new = 4000  # 10s * 400 Hz
    resampled = resample(ecg_data, num_samples_new, axis=0)
    # Zero-pad to 4096
    padded = np.pad(resampled, ((0, 4096 - num_samples_new), (0, 0)), mode='constant')
    # Scale (for μV input to model scale: *0.01 to get ~10 units for 1mV peaks)
    scaled = padded * scale_factor
    # Z-normalization (per lead) - not used in original training, optional here
    if normalize:
        mean = np.mean(scaled, axis=0, keepdims=True)
        std = np.std(scaled, axis=0, keepdims=True) + 1e-8
        scaled = (scaled - mean) / std
    # Add batch: (1, 4096, 12)
    return np.expand_dims(scaled, axis=0)

def run_inference(input_data: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """Load model fresh, run inference, return probabilities and binary predictions."""
    model_path = "model.hdf5"
    print(f"Loading fresh ECG model from {model_path} for inference...")
    try:
        model = load_model(model_path, compile=False)
        model.compile(loss='binary_crossentropy', optimizer=Adam())
        print("Fresh model loaded successfully!")
        probs = model.predict(input_data, verbose=0)
        binary = (probs > 0.5).astype(int)[0]  # Threshold at 0.5
        return probs[0], binary
    except Exception as e:
        print(f"Failed to load or run fresh model: {e}")
        raise RuntimeError(f"Model inference failed: {e}")

def predict_ecg(json_path: str, scale_factor: float = 0.01, normalize: bool = False) -> Dict[str, Any]:
    """Full pipeline: load → prep → predict (model loaded in run_inference)."""
    ecg_data = load_json_file(json_path)
    input_data = prepare_input(ecg_data, scale_factor, normalize)
    probs, binary = run_inference(input_data)
    
    results = {
        "probabilities": {label: float(prob) for label, prob in zip(LABELS, probs)},
        "predictions": {label: int(pred) for label, pred in zip(LABELS, binary)},
        "summary": [label for label, pred in zip(LABELS, binary) if pred == 1]
    }
    return results