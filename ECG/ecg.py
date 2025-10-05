import json
import numpy as np
from keras.models import load_model
from keras.optimizers import Adam
from scipy.signal import resample

# Abnormality labels (in model output order)
LABELS = ['1dAVb', 'RBBB', 'LBBB', 'SB', 'AF', 'ST']

def load_json_file(json_path):
    """Load JSON file and extract signals as (5000, 12) array."""
    with open(json_path, 'r') as f:
        data = json.load(f)
    signals = np.array(data['signals'])
    if signals.shape != (5000, 12):
        raise ValueError(f"Expected signals shape (5000, 12), got {signals.shape}")
    return signals

def prepare_input(ecg_data, scale_factor=10.0, normalize=True):
    """Resample to 400 Hz (pad to 4096), scale, z-norm per lead, add batch dim."""
    # Resample 5000 @500Hz to 4000 @400Hz (10s duration)
    num_samples_new = 4000  # 10s * 400 Hz
    resampled = resample(ecg_data, num_samples_new, axis=0)
    # Zero-pad to 4096
    padded = np.pad(resampled, ((0, 4096 - num_samples_new), (0, 0)), mode='constant')
    # Scale
    scaled = padded * scale_factor
    # Z-normalization (per lead)
    if normalize:
        mean = np.mean(scaled, axis=0, keepdims=True)
        std = np.std(scaled, axis=0, keepdims=True) + 1e-8
        scaled = (scaled - mean) / std
    # Ensure float32
    scaled = scaled.astype(np.float32)
    # Add batch: (1, 4096, 12)
    return np.expand_dims(scaled, axis=0)

def predict_diseases(model, input_data):
    """Run inference and return probabilities and binary predictions."""
    probs = model.predict(input_data, verbose=0)
    binary = (probs > 0.5).astype(int)[0]  # Threshold at 0.5
    return probs[0], binary

def main():
    json_path = "00002_hr.json"
    model_path = "model.hdf5"
    scale_factor = 10.0
    normalize = True  # Enabled for PTB-XL

    # Load data
    print("Loading JSON file...")
    ecg_data = load_json_file(json_path)

    # Print raw stats (across all leads)
    print("\nRaw signal stats (across all leads):")
    print(f"Min: {np.min(ecg_data):.6f}, Max: {np.max(ecg_data):.6f}, Mean: {np.mean(ecg_data):.6f}, Std: {np.std(ecg_data):.6f}")

    # Prepare input
    print(f"\nPreparing input (resample to 400Hz, pad to 4096x12, scale by {scale_factor}, normalize={normalize})...")
    input_data = prepare_input(ecg_data, scale_factor, normalize)

    # Print scaled stats (after norm: expect mean~0, std~1 per lead)
    print("\nNormalized signal stats (across all leads):")
    print(f"Min: {np.min(input_data[0]):.6f}, Max: {np.max(input_data[0]):.6f}, Mean: {np.mean(input_data[0]):.6f}, Std: {np.std(input_data[0]):.6f}")

    # Load model
    print("\nLoading pretrained model...")
    model = load_model(model_path, compile=False)
    model.compile(loss='binary_crossentropy', optimizer=Adam())
    print("Model loaded successfully!")

    # DEBUG: Test on random input to check if model works
    print("\n--- DEBUG: Testing model on random noise input ---")
    random_input = np.random.normal(0, 1, (1, 4096, 12)).astype(np.float32)  # Normalized scale
    test_probs = model.predict(random_input, verbose=0)[0]
    print("Random input probs:")
    for i, label in enumerate(LABELS):
        print(f"{label}: {test_probs[i]:.3f}")

    # Predict on your data
    print("\n--- Prediction on your ECG ---")
    probs, binary = predict_diseases(model, input_data)

    # Output results
    print("\nPrediction Results:")
    print("Abnormality | Probability | Present (1/0)")
    print("-" * 40)
    for i, label in enumerate(LABELS):
        print(f"{label:10} | {probs[i]:10.3f} | {binary[i]}")

if __name__ == "__main__":
    main()