import os
import numpy as np
import matplotlib.pyplot as plt
import rasterio
from skimage.transform import downscale_local_mean
from datetime import datetime
import glob

# Hardcoded SAR folder path
HARDCODED_SAR_FOLDER = "S1C_IW_GRDH_1SDV_20250929T164759_20250929T164824_004342_0089C0_3B0E.SAFE"

# Output directory for generated images
OUTPUT_DIR = "static/images"

def find_tiff_file(folder_path):
    """Find the first measurement .tiff file in the SAFE folder"""
    for root, dirs, files in os.walk(folder_path):
        for f in files:
            if f.lower().endswith(".tiff"):
                return os.path.join(root, f)
    return None

def process_sar_image(tiff_file):
    """Process SAR image and return matplotlib figure"""
    # Open with rasterio
    with rasterio.open(tiff_file) as src:
        image_data = src.read(1).astype(np.float32)  # first band

    # Downsample if too large
    max_dim = 2048
    if image_data.shape[0] > max_dim or image_data.shape[1] > max_dim:
        factor_row = max(1, image_data.shape[0] // max_dim)
        factor_col = max(1, image_data.shape[1] // max_dim)
        image_data = downscale_local_mean(image_data, (factor_row, factor_col))

    # Convert to dB (GRD = detected intensity)
    amplitude_db = 10 * np.log10(image_data + 1e-6)

    # Plot
    fig, ax = plt.subplots(figsize=(12, 8))
    im = ax.imshow(amplitude_db, cmap='gray', aspect='auto')
    ax.set_title(f"Sentinel-1 GRD Image (Intensity in dB)\n{os.path.basename(tiff_file)}")
    ax.set_xlabel("Range bins")
    ax.set_ylabel("Azimuth lines")
    
    # Add colorbar
    plt.colorbar(im, ax=ax, label='dB')
    
    return fig

def generate_sar_image(format="png"):
    """
    Main function to generate SAR image and save to file
    
    Args:
        format (str): Output format - 'png' or 'jpg'
    
    Returns:
        str: Full path to the saved image file
    """
    if not os.path.exists(HARDCODED_SAR_FOLDER):
        raise FileNotFoundError(f"SAR folder not found: {HARDCODED_SAR_FOLDER}")

    # Find the measurement .tiff file
    tiff_file = find_tiff_file(HARDCODED_SAR_FOLDER)
    if not tiff_file:
        raise FileNotFoundError("No .tiff measurement file found in SAFE folder")

    # Create output directory if it doesn't exist
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Generate filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    sar_folder_name = os.path.basename(HARDCODED_SAR_FOLDER).replace('.SAFE', '')
    
    if format.lower() in ["jpg", "jpeg"]:
        filename = f"sar_image_{sar_folder_name}_{timestamp}.jpg"
        filepath = os.path.join(OUTPUT_DIR, filename)
        format_str = "jpg"
    else:
        filename = f"sar_image_{sar_folder_name}_{timestamp}.png"
        filepath = os.path.join(OUTPUT_DIR, filename)
        format_str = "png"

    # Process and create image
    fig = process_sar_image(tiff_file)
    
    # Save to file
    if format_str == "jpg":
        fig.savefig(filepath, format='jpg', bbox_inches='tight', dpi=150, quality=95)
    else:
        fig.savefig(filepath, format='png', bbox_inches='tight', dpi=150)
    
    plt.close(fig)
    
    return filepath

def get_latest_sar_image():
    """
    Get the most recently generated SAR image path
    """
    png_files = glob.glob(os.path.join(OUTPUT_DIR, "sar_image_*.png"))
    jpg_files = glob.glob(os.path.join(OUTPUT_DIR, "sar_image_*.jpg"))
    all_files = png_files + jpg_files
    
    if not all_files:
        return None
    
    # Return the most recently created file
    latest_file = max(all_files, key=os.path.getctime)
    return latest_file