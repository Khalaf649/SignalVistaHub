import json
import os
from pathlib import Path
import mne
import numpy as np
from typing import List, Tuple

def preprocess_edf(file_path: str, output_dir: str = "static/eegdata") -> Tuple[List[str], np.ndarray, float]:
    """
    Load EDF, filter (1-30 Hz bandpass), select 18 channels, extract data.
    Returns channels, data array (n_channels x n_times), sfreq.
    """
    # Load raw EDF
    raw = mne.io.read_raw_edf(file_path, preload=True)
    
    # Define standard 18 bipolar channels for CHB-MIT
    standard_channels = [
        'FP1-F7', 'F7-T7', 'T7-FT9', 'FT9-TT9', 'TT9-T9', 'T9-P9', 'P9-O9',
        'FP1-F3', 'F3-C3', 'C3-P3', 'P3-O1', 'FP2-F4', 'F4-C4', 'C4-P4',
        'P4-O2', 'F8-T8', 'T8-FT10', 'FT10-TT10'
    ]
    
    # Select available channels (prioritize standard, fallback to first 18)
    available_standard = [ch for ch in standard_channels if ch in raw.ch_names]
    if len(available_standard) < 18:
        available_standard = raw.ch_names[:18]
    raw.pick_channels(available_standard)
    
    # Preprocess: Bandpass filter 1-30 Hz (common for seizure detection)
    raw.filter(l_freq=1.0, h_freq=30.0, fir_design='firwin')

    # Resample to 128 Hz
    raw.resample(128)
    
   
    data = raw.get_data()*1e6  # Shape: (n_channels, n_times)
    sfreq = raw.info['sfreq']
    
    return available_standard, data, sfreq

def save_preprocessed_to_json(channels: List[str], data: np.ndarray, sfreq: float, filename: str, output_dir: str = "static/eegdata"):
    """Save preprocessed data as JSON."""
    os.makedirs(output_dir, exist_ok=True)
    json_path = Path(output_dir) / f"{filename}.json"
    
    # Convert numpy to lists for JSON
    json_data = {
        "channels": channels,
        "samplingRate": float(sfreq),
        "data": data.tolist()  # List of lists: each sublist is a channel's time series
    }
    
    with open(json_path, 'w') as f:
        json.dump(json_data, f, indent=2)
    
    return str(json_path)