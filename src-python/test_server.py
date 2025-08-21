#!/usr/bin/env python3
"""
Test script for the Python AutoComplete Backend Server
"""

import requests
import json
import time

def test_server():
    """Test the autocomplete backend server"""
    base_url = "http://localhost:8000"
    
    print("🧪 Testing Python AutoComplete Backend Server")
    print("=" * 50)
    
    # Test health check
    print("\n1. Testing health check...")
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ Health check passed: {health_data}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Server not running. Start the server first with: python server.py")
        return False
    
    # Test available models
    print("\n2. Testing available models...")
    try:
        response = requests.get(f"{base_url}/models")
        if response.status_code == 200:
            models_data = response.json()
            print(f"✅ Available models: {models_data['available_models']}")
        else:
            print(f"❌ Failed to get models: {response.status_code}")
    except Exception as e:
        print(f"❌ Error getting models: {e}")
    
    # Test autocomplete
    print("\n3. Testing autocomplete...")
    try:
        test_data = {
            "model_name": "autocomplete",
            "input_data": {
                "text": "Hello world"
            },
            "parameters": {
                "max_suggestions": 3
            }
        }
        
        response = requests.post(f"{base_url}/predict", json=test_data)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Autocomplete: {result}")
        else:
            print(f"❌ Autocomplete failed: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error in autocomplete: {e}")
    
    # Test unsupported model
    print("\n4. Testing unsupported model...")
    try:
        test_data = {
            "model_name": "sentiment",
            "input_data": {
                "text": "I love this!"
            },
            "parameters": {}
        }
        
        response = requests.post(f"{base_url}/predict", json=test_data)
        if response.status_code == 400:
            result = response.json()
            print(f"✅ Correctly rejected unsupported model: {result}")
        else:
            print(f"❌ Should have rejected unsupported model: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing unsupported model: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Test completed!")
    return True

if __name__ == "__main__":
    test_server()
