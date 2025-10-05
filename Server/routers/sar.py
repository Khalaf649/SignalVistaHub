from fastapi import APIRouter, HTTPException
from services.sar_service import generate_sar_image
import os

router = APIRouter()

@router.get("/image")
async def get_sar_image_path():
    """
    Generate SAR image and return the file path
    """
    try:
        image_path = generate_sar_image()
        
        # Return the accessible URL path
        filename = os.path.basename(image_path)
        image_url = f"/static/images/{filename}"
        
        return {
            "message": "SAR image generated successfully",
            "file_path": image_path,
            "image_url": image_url,
            "access_url": f"http://localhost:8000{image_url}"
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing SAR image: {str(e)}")

@router.get("/image/info")
async def get_sar_image_info():
    """
    Get information about the generated SAR image
    """
    try:
        image_path = generate_sar_image()
        filename = os.path.basename(image_path)
        file_size = os.path.getsize(image_path)
        
        return {
            "filename": filename,
            "file_path": image_path,
            "file_size_bytes": file_size,
            "file_size_mb": round(file_size / (1024 * 1024), 2),
            "access_url": f"http://localhost:8000/static/images/{filename}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting image info: {str(e)}")