import numpy as np
from keras.models import load_model
from keras.optimizers import Adam
from scipy.signal import resample
from typing import Tuple, Dict, Any, List

LABELS = ['1dAVb', 'RBBB', 'LBBB', 'SB', 'AF', 'ST']

def prepare_input(ecg_data: np.ndarray, scale_factor: float = 0.01, normalize: bool = True) -> np.ndarray:
    ecg_data = ecg_data.astype(np.float32)
    num_samples_new = 4000
    resampled = resample(ecg_data, num_samples_new, axis=0)
    padded = np.pad(resampled, ((0, 4096 - num_samples_new), (0, 0)), mode='constant')
    scaled = padded * scale_factor
    if normalize:
        mean = np.mean(scaled, axis=0, keepdims=True)
        std = np.std(scaled, axis=0, keepdims=True) + 1e-8
        scaled = (scaled - mean) / std
    return np.expand_dims(scaled, axis=0)

def run_inference(input_data: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    model_path = "model.hdf5"
    print(f"Loading fresh ECG model from {model_path} for inference...")
    model = load_model(model_path, compile=False)
    model.compile(loss='binary_crossentropy', optimizer=Adam())
    print("Fresh model loaded successfully!")
    probs = model.predict(input_data, verbose=0)
    binary = (probs > 0.5).astype(int)[0]
    return probs[0], binary

def predict_ecg(signals_2d: List[List[float]], scale_factor: float = 0.01, normalize: bool = True) -> Dict[str, Any]:
    """Full pipeline: signals array → prep → predict"""
    ecg_data = np.array(signals_2d)
    if ecg_data.shape != (5000, 12):
        raise ValueError(f"Expected signals shape (5000, 12), got {ecg_data.shape}")
    input_data = prepare_input(ecg_data, scale_factor, normalize)
    probs, binary = run_inference(input_data)
    results = {
        "probabilities": {label: float(prob) for label, prob in zip(LABELS, probs)},
        "predictions": {label: int(pred) for label, pred in zip(LABELS, binary)},
        "summary": [label for label, pred in zip(LABELS, binary) if pred == 1]
    }
    
    return results
