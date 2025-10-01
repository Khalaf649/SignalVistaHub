# app.py
import torch
from flask import Flask, request, jsonify
from transformers import pipeline
import os
import os
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Global variable to store the classifier
classifier = None

def load_model():
    """Load the model once when the server starts"""
    global classifier
    model_id = "preszzz/drone-audio-detection-05-17-trial-0"
    
    try:
        print("Loading model... This may take a moment.")
        classifier = pipeline(
            "audio-classification", 
            model=model_id,
            device="cuda" if torch.cuda.is_available() else "cpu"
        )
        print("Model loaded successfully!")
    except Exception as e:
        print(f"Error loading model: {e}")
        # Set classifier to None if loading fails
        classifier = None

# Load the model when the module is imported
load_model()


@app.route('/predict', methods=['POST'])
def predict():
    
    """
    Endpoint for drone audio detection
    Returns the top prediction only
    """
    # Check if model is loaded
    if classifier is None:
        return jsonify({"error": "Model not loaded. Please check server logs."}), 500
    
    # Check if file is present in request
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided. Please provide an 'audio' file."}), 400
    
    audio_file = request.files['audio']
    
    # Check if filename is empty
    if audio_file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    try:
        # Save the uploaded file temporarily
        temp_path = "temp_audio.wav"
        audio_file.save(temp_path)
        
        # Perform inference and get the top prediction
        predictions = classifier(temp_path)
        top_prediction = predictions[0]  # Gets the highest confidence result
        
        # Clean up temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        # Return simplified response with only the top prediction
        return jsonify({
            "classification": top_prediction['label'],
            "confidence": round(top_prediction['score'], 4),
            "status": "success"
        })
        
    except Exception as e:
        # Clean up temp file if it exists
        if os.path.exists("temp_audio.wav"):
            os.remove("temp_audio.wav")
            
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)