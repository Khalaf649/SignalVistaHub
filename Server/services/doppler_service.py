import numpy as np
from scipy.io.wavfile import write
import io

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
