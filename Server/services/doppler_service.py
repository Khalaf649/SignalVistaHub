import numpy as np
from scipy.io.wavfile import write
import io
import h5py
import os

def simulate_doppler(frequency: float, velocity: float, duration: float, fs: int = 8000):
    """
    Simulates a Doppler effect siren and returns audio + analysis data
    """
    v_sound = 343.0  # speed of sound (m/s)
    d = 5.0          # perpendicular distance (m)

    # Time array
    t = np.linspace(0, duration, int(duration * fs), endpoint=False)
    t0 = duration / 2.0
    x = velocity * (t - t0)  # source moves along x-axis
    r = np.sqrt(x**2 + d**2) # distance to listener

    # Radial velocity
    v_rad = velocity * (-x) / r

    # Observed frequency (classic Doppler)
    f_o = frequency * v_sound / (v_sound - v_rad)

    # Phase integration
    dt = t[1] - t[0]
    phi = 2 * np.pi * np.cumsum(f_o) * dt
    signal = np.sin(phi)

    # Amplitude scaling (inverse square law)
    amp = 1.0 / (r**2)
    amp /= np.max(amp)
    signal *= amp
    signal /= np.max(np.abs(signal))  # normalize

    # Convert to stereo (basic)
    left = signal * np.sqrt(0.5 * (1 - x/r))
    right = signal * np.sqrt(0.5 * (1 + x/r))
    signal_stereo = np.column_stack((left, right))

    # Save to WAV in memory
    wav_bytes = io.BytesIO()
    write(wav_bytes, fs, np.int16(signal_stereo * 32767))
    wav_bytes.seek(0)

    # Frequency stats
    max_freq = float(np.max(f_o))
    min_freq = float(np.min(f_o))
    shift_ratio = max_freq / min_freq if min_freq != 0 else float("inf")

    # Prepare plotting data
    return {
        "audio": wav_bytes,
        "time": t.tolist(),
        "amplitude": signal.tolist(),
        "frequency": f_o.tolist(),
        "max_frequency": max_freq,
        "min_frequency": min_freq,
        "shift_ratio": shift_ratio
    }

MODEL_PATH = "speed_estimations_NN_1000-200-50-10-1_reg1e-3_lossMSE.h5"  # Hardcoded model path
def get_first_predicted_speed(audio_path: str):
    """
    Extracts the first predicted speed for the given uploaded audio file.
    The .h5 model path is hardcoded.
    """
    filename = os.path.basename(audio_path)
    vehicle_name, true_speed_str = filename.replace(".wav", "").split("_")
    true_speed = float(true_speed_str)

    est_key = f"{vehicle_name}_speeds_est_all"
    gt_key = f"{vehicle_name}_speeds_gt"

    with h5py.File(MODEL_PATH, "r") as f:
        if est_key not in f or gt_key not in f:
            raise KeyError(f"Vehicle '{vehicle_name}' not found in HDF5 file.")

        gt_speeds = f[gt_key][()]        # shape: (N,)
        est_speeds = f[est_key][()]      # shape: (20, N)

        idx = np.argmin(np.abs(gt_speeds - true_speed))
        first_pred_speed = est_speeds[0, idx]

    return float(first_pred_speed)
