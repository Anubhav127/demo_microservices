from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, Any
import random
import asyncio

app = FastAPI(title="Mock AI Service", version="1.0.0")


class PredictRequest(BaseModel):
    input: Dict[str, Any]


class PredictResponse(BaseModel):
    prediction: int
    confidence: str


@app.get("/")
async def root():
    return {"message": "Mock AI Service is running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/predict", response_model=PredictResponse)
async def predict(payload: PredictRequest) -> PredictResponse:
    """
    Mock prediction endpoint that returns random predictions.
    
    Accepts input payload and returns mock prediction with confidence level.
    Simulates realistic response times.
    """
    # Simulate processing delay (100-500ms)
    delay = random.uniform(0.1, 0.5)
    await asyncio.sleep(delay)
    
    # Generate random prediction (0 or 1)
    prediction = random.choice([0, 1])
    
    # Generate random confidence level
    confidence = random.choice(["low", "medium", "high"])
    
    return PredictResponse(prediction=prediction, confidence=confidence)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
