#!/usr/bin/env python3
"""
Python ML Backend Server for Tauri Application
Handles autocomplete model requests
"""

import argparse
import logging
import time
from typing import Dict, Any
import traceback

from flask import Flask, request, jsonify
from flask_cors import CORS

# Import local ML modules
try:
    from ml.autocomplete import AutoCompleteModel
    AUTComplete_AVAILABLE = True
except ImportError:
    AUTComplete_AVAILABLE = False
    print("Warning: AutoComplete model not available")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

class AutoCompleteManager:
    """Manages autocomplete model"""
    
    def __init__(self):
        self.autocomplete_model = None
        logger.info("Initializing AutoComplete Manager")
    
    def load_autocomplete_model(self) -> bool:
        """Load the autocomplete model"""
        if not AUTComplete_AVAILABLE:
            logger.error("AutoComplete model not available")
            return False
        
        try:
            logger.info("Loading AutoComplete model")
            self.autocomplete_model = AutoCompleteModel()
            logger.info("AutoComplete model loaded successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to load AutoComplete model: {e}")
            return False
    
    def autocomplete_text(self, text: str, max_suggestions: int = 5) -> Dict[str, Any]:
        """Generate autocomplete suggestions"""
        if not self.autocomplete_model:
            return {"error": "AutoComplete model not loaded"}
        
        try:
            suggestions = self.autocomplete_model.predict(text, max_suggestions)
            return {
                "success": True,
                "suggestions": suggestions,
                "input_text": text
            }
        except Exception as e:
            logger.error(f"Autocomplete failed: {e}")
            return {"error": str(e)}

# Global autocomplete manager
autocomplete_manager = AutoCompleteManager()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "autocomplete_available": AUTComplete_AVAILABLE,
        "autocomplete_loaded": autocomplete_manager.autocomplete_model is not None
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Main prediction endpoint for autocomplete"""
    start_time = time.time()
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        model_name = data.get('model_name', '')
        input_data = data.get('input_data', {})
        parameters = data.get('parameters', {})
        
        logger.info(f"Received request for model: {model_name}")
        
        # Only handle autocomplete requests
        if model_name == 'autocomplete':
            if 'text' not in input_data:
                return jsonify({"error": "text required for autocomplete"}), 400
            
            max_suggestions = parameters.get('max_suggestions', 5)
            result = autocomplete_manager.autocomplete_text(input_data['text'], max_suggestions)
        else:
            return jsonify({"error": f"Only 'autocomplete' model is supported. Received: {model_name}"}), 400
        
        processing_time = time.time() - start_time
        result['processing_time'] = processing_time
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            "error": str(e),
            "processing_time": time.time() - start_time
        }), 500

@app.route('/load_model', methods=['POST'])
def load_model():
    """Load the autocomplete model"""
    try:
        data = request.get_json()
        model_name = data.get('model_name', '')
        
        if model_name == 'autocomplete':
            success = autocomplete_manager.load_autocomplete_model()
            return jsonify({
                "success": success,
                "message": "AutoComplete model loaded" if success else "Failed to load AutoComplete model"
            })
        else:
            return jsonify({"error": f"Only 'autocomplete' model is supported. Received: {model_name}"}), 400
    
    except Exception as e:
        logger.error(f"Model loading failed: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/models', methods=['GET'])
def list_models():
    """List available models"""
    return jsonify({
        "available_models": ["autocomplete"],
        "loaded_models": [],
        "autocomplete_loaded": autocomplete_manager.autocomplete_model is not None
    })

def main():
    parser = argparse.ArgumentParser(description='AutoComplete ML Backend Server')
    parser.add_argument('--port', type=int, default=8000, help='Port to run the server on')
    parser.add_argument('--host', type=str, default='localhost', help='Host to bind to')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    
    args = parser.parse_args()
    
    logger.info(f"Starting AutoComplete ML Backend Server on {args.host}:{args.port}")
    logger.info(f"AutoComplete Available: {AUTComplete_AVAILABLE}")
    
    # Pre-load autocomplete model if available
    if AUTComplete_AVAILABLE:
        autocomplete_manager.load_autocomplete_model()
    
    app.run(
        host=args.host,
        port=args.port,
        debug=args.debug,
        threaded=True
    )

if __name__ == '__main__':
    main()
