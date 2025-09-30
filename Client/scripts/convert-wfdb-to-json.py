"""
Convert WFDB ECG files to JSON format for browser loading
This script reads .dat and .hea files and converts them to JSON

Usage:
  python convert-wfdb-to-json.py <input_directory> <output_directory>

Example:
  python convert-wfdb-to-json.py ptbxl_database/records100 public/ecg-data
"""

import wfdb
import json
import os
import sys
from pathlib import Path

def convert_wfdb_to_json(input_path, output_path):
    """
    Convert a single WFDB record to JSON format
    
    Args:
        input_path: Path to WFDB file (without extension)
        output_path: Path to output JSON file
    """
    try:
        # Read the WFDB record
        record = wfdb.rdrecord(input_path)
        
        # Extract data
        data = {
            'id': os.path.basename(input_path),
            'filename': os.path.basename(input_path),
            'samplingRate': record.fs,
            'leads': record.sig_name,
            'signals': record.p_signal.tolist(),  # Convert numpy array to list
            'units': record.units,
            'comments': record.comments
        }
        
        # Write to JSON
        with open(output_path, 'w') as f:
            json.dump(data, f)
        
        print(f"✓ Converted: {input_path} -> {output_path}")
        return True
        
    except Exception as e:
        print(f"✗ Error converting {input_path}: {str(e)}")
        return False

def batch_convert(input_dir, output_dir):
    """
    Convert all WFDB files in a directory to JSON
    
    Args:
        input_dir: Directory containing WFDB files
        output_dir: Directory to save JSON files
    """
    input_path = Path('C:/SBME/Third Year/DSP/SignalVistaHub/Client/public/ecg-data-wbdf/ptb-xl-a-large-publicly-available-electrocardiography-dataset-1.0.3')
    output_path = Path(output_dir)
    print(f"Converting WFDB files from {input_path} to {output_path}")
    
    # Create output directory if it doesn't exist
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Find all .hea files (WFDB header files)
    hea_files = list(input_path.rglob('*.hea'))
    
    if not hea_files:
        print(f"No WFDB files found in {input_dir}")
        return
    
    print(f"Found {len(hea_files)} WFDB records")
    
    # Convert each record
    converted = []
    for hea_file in hea_files:
        # Get the record path without extension
        record_path = str(hea_file).replace('.hea', '')
        
        # Create output filename
        relative_path = Path(record_path).relative_to(input_path)
        output_file = output_path / f"{relative_path}.json"
        
        # Create subdirectories if needed
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Convert
        if convert_wfdb_to_json(record_path, output_file):
            converted.append({
                'id': str(relative_path).replace('\\', '/'),
                'filename': str(relative_path).replace('\\', '/'),
                'samplingRate': None,  # Will be filled from actual data
                'leads': [],
                'signals': [],
                'duration': 0
            })
    
    # Create index file
    index_file = output_path / 'index.json'
    with open(index_file, 'w') as f:
        json.dump({'recordings': converted}, f, indent=2)
    
    print(f"\n✓ Converted {len(converted)} records")
    print(f"✓ Created index file: {index_file}")
    print(f"\nNext steps:")
    print(f"1. Copy the {output_dir} folder to your React app's public/ directory")
    print(f"2. The app will automatically load recordings from public/ecg-data/")

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python convert-wfdb-to-json.py <input_directory> <output_directory>")
        sys.exit(1)
    
    input_directory = sys.argv[1]
    output_directory = sys.argv[2]
    print(f"Input Directory: {input_directory}")
    print(f"Output Directory: {output_directory}")
    
    batch_convert(input_directory, output_directory)
