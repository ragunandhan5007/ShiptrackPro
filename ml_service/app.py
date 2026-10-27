from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uvicorn

from models.eta_delay_model import EtaDelayPredictor
from models.ticket_nlp_model import TicketNlpClassifier
from models.route_optimizer import RouteOptimizer

app = FastAPI(
    title="ShipTrackPro ML Microservice",
    description="Machine Learning service providing Dynamic ETA, Ticket NLP, and Route Optimization.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models
print("Loading ML models into memory...")
eta_model = EtaDelayPredictor()
nlp_model = TicketNlpClassifier()
route_model = RouteOptimizer()
print("All 3 ML models loaded successfully!")

# Request Schemas
class EtaRequest(BaseModel):
    distance_km: float = Field(..., example=120.5)
    package_weight_kg: float = Field(default=2.5, example=5.0)
    traffic_condition: str = Field(default="LOW", example="HEAVY")
    weather_condition: str = Field(default="CLEAR", example="RAIN")
    road_condition: str = Field(default="GOOD", example="UNDER_CONSTRUCTION")
    hubs_count: int = Field(default=2, example=3)

class TicketClassifyRequest(BaseModel):
    subject: str = Field(..., example="Package not received")
    description: str = Field(..., example="It has been 4 days and my medicine delivery is missing")

class Waypoint(BaseModel):
    id: Optional[int] = None
    name: str = Field(..., example="Chennai Hub")
    lat: float = Field(..., example=13.0827)
    lng: float = Field(..., example=80.2707)

class RouteOptimizeRequest(BaseModel):
    origin: Waypoint
    destination: Waypoint
    intermediate_stops: List[Waypoint] = []
    traffic_penalty_factor: float = 1.0

@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "ShipTrackPro ML Engine",
        "models_active": [
            "Model 1: Dynamic ETA & Delay Predictor (RandomForest / MLP)",
            "Model 2: Support Ticket NLP & Priority Classifier (TF-IDF)",
            "Model 3: Smart Route & Dispatch Optimizer (TSP 2-Opt)"
        ]
    }

# 1. Dynamic ETA & Delay
@app.post("/api/ml/predict-eta")
def predict_eta(req: EtaRequest):
    try:
        result = eta_model.predict(
            distance_km=req.distance_km,
            package_weight_kg=req.package_weight_kg,
            traffic_condition=req.traffic_condition,
            weather_condition=req.weather_condition,
            road_condition=req.road_condition,
            hubs_count=req.hubs_count
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 2. NLP Support Ticket
@app.post("/api/ml/classify-ticket")
def classify_ticket(req: TicketClassifyRequest):
    try:
        result = nlp_model.classify(
            subject=req.subject,
            description=req.description
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 3. Route Optimization
@app.post("/api/ml/optimize-route")
def optimize_route(req: RouteOptimizeRequest):
    try:
        origin_dict = req.origin.model_dump()
        dest_dict = req.destination.model_dump()
        stops_dict = [s.model_dump() for s in req.intermediate_stops]

        result = route_model.optimize_stops(
            origin=origin_dict,
            destination=dest_dict,
            intermediate_stops=stops_dict,
            traffic_penalty_factor=req.traffic_penalty_factor
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=False)
