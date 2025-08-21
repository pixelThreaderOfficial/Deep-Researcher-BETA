# Python ML Backend for DeepResearcher

This is the Python backend server that provides ML model capabilities to the Tauri application.

## Features

- **ASR (Automatic Speech Recognition)**: Transcribe audio to text using Whisper models
- **AutoComplete**: Text completion suggestions using your existing autocomplete model
- **Sentiment Analysis**: Analyze text sentiment (rule-based implementation)
- **Text Summarization**: Summarize long text (extractive implementation)
- **Text-to-Speech**: Placeholder for TTS functionality
- **RESTful API**: HTTP endpoints for all ML operations

## Setup

### 1. Install Dependencies

```bash
cd src-python
pip install -r requirements.txt
```

### 2. Install ASR System (Optional)

If you want to use the ASR functionality, install the ASR system from the tests directory:

```bash
cd ../tests/ASR
python setup.py
```

### 3. Start the Server

```bash
cd src-python
python server.py
```

The server will start on `http://localhost:8000` by default.

## API Endpoints

### Health Check

```
GET /health
```

### List Available Models

```
GET /models
```

### Load a Model

```
POST /load_model
{
    "model_name": "asr",
    "model_path": "openai/whisper-tiny"
}
```

### Make Predictions

```
POST /predict
{
    "model_name": "sentiment",
    "input_data": {
        "text": "I love this product!"
    },
    "parameters": {}
}
```

## Available Models

### 1. ASR (Speech-to-Text)

- **Model Name**: `asr` or `speech_to_text`
- **Input**: Base64 encoded audio data
- **Output**: Transcribed text with language detection

```json
{
  "model_name": "asr",
  "input_data": {
    "audio_data": "base64_encoded_audio",
    "format": "wav"
  }
}
```

### 2. AutoComplete

- **Model Name**: `autocomplete`
- **Input**: Text to complete
- **Output**: List of suggestions

```json
{
  "model_name": "autocomplete",
  "input_data": {
    "text": "Hello world"
  },
  "parameters": {
    "max_suggestions": 5
  }
}
```

### 3. Sentiment Analysis

- **Model Name**: `sentiment`
- **Input**: Text to analyze
- **Output**: Sentiment score and classification

```json
{
  "model_name": "sentiment",
  "input_data": {
    "text": "I love this amazing product!"
  }
}
```

### 4. Text Summarization

- **Model Name**: `summarize`
- **Input**: Long text
- **Output**: Summarized text

```json
{
  "model_name": "summarize",
  "input_data": {
    "text": "Long text to summarize..."
  },
  "parameters": {
    "max_length": 150
  }
}
```

### 5. Text-to-Speech (Placeholder)

- **Model Name**: `tts` or `text_to_speech`
- **Input**: Text to convert
- **Output**: Audio data (placeholder)

```json
{
  "model_name": "tts",
  "input_data": {
    "text": "Hello, world!"
  },
  "parameters": {
    "voice": "default"
  }
}
```

## Testing

Run the test script to verify everything works:

```bash
python test_server.py
```

## Integration with Tauri

The Tauri application communicates with this Python backend through HTTP requests. The Rust code in `src-tauri/src/python_backend.rs` handles:

- Starting/stopping the Python server
- Making API calls to the ML models
- Managing the server lifecycle

## Adding New Models

To add a new ML model:

1. Create your model class in the `ml/` directory
2. Add the model to the `MLModelManager` class in `server.py`
3. Add the model to the prediction routing logic
4. Update the available models list

## Configuration

You can configure the server by passing command line arguments:

```bash
python server.py --port 8000 --host localhost --debug
```

## Troubleshooting

### Server Won't Start

- Check if Python is installed and in PATH
- Verify all dependencies are installed
- Check if port 8000 is available

### Models Not Loading

- Ensure the ASR system is properly installed
- Check if your autocomplete model is accessible
- Verify model paths are correct

### API Calls Failing

- Ensure the server is running
- Check the request format matches the expected schema
- Verify the model name is correct

## Development

For development, you can run the server in debug mode:

```bash
python server.py --debug
```

This will enable Flask's debug mode with auto-reload and detailed error messages.
