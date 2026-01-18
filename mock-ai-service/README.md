# Mock AI Service

A FastAPI-based mock AI service that simulates AI model predictions for testing the AI Model Evaluation Platform.

## Features

- Mock `/predict` endpoint that returns random predictions (0 or 1)
- Random confidence levels (low, medium, high)
- Simulated response delays (100-500ms)
- No authentication required

## Installation

```bash
pip install -r requirements.txt
```

## Running the Service

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

### GET /
Health check endpoint

### GET /health
Service health status

### POST /predict
Mock prediction endpoint

**Request:**
```json
{
  "input": {
    "feature1": 0.5,
    "feature2": 0.3
  }
}
```

**Response:**
```json
{
  "prediction": 1,
  "confidence": "high"
}
```

## Environment Variables

- `PORT`: Server port (default: 8000)
- `HOST`: Server host (default: 0.0.0.0)
