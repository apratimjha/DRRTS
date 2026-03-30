import random
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Tuple
from deap import base, creator, tools, algorithms

app = FastAPI()

# --- Data Models ---
class Location(BaseModel):
    id: str
    lat: float
    lng: float
    svi: float = 0.0 # Social Vulnerability Index (0-1)
    needs_resources: int = 0

class Vehicle(BaseModel):
    id: str
    capacity: int
    start_loc: Tuple[float, float]

class OptimizationRequest(BaseModel):
    requests: List[Location]
    vehicles: List[Vehicle]

# --- Genetic Algorithm Setup ---
# We want to MAXIMIZE fitness (Reach high SVI, Minimize Distance/Cost)
# Fitness = (Sum(Resources * SVI)) - (Alpha * TotalDistance)

creator.create("FitnessMax", base.Fitness, weights=(1.0,))
creator.create("Individual", list, fitness=creator.FitnessMax)

toolbox = base.Toolbox()

def distance(loc1, loc2):
    return np.sqrt((loc1.lat - loc2.lat)**2 + (loc1.lng - loc2.lng)**2)

def eval_routes(individual, requests, vehicles): # Removed alpha argument to prevent override
    """
    Evaluate a set of routes.
    Individual is a permutation of request indices.
    We split this permutation into routes for each vehicle.
    """
    total_svi_score = 0
    total_distance = 0
    
    # 🛡️ IMMUTABLE EQUITY PARAMETER 🛡️
    # Hard-coded to prevent "Cost Optimization" from overriding "Human Life"
    # A low alpha ensures that reaching high-SVI areas is always more valuable than saving fuel.
    ALPHA = 0.05 
    
    # Simple split strategy for demo: divide requests evenly among vehicles
    # In a real VRP, the GA would also optimize the split points.
    # Here we just assume even distribution for simplicity of the prompt example.
    
    num_vehicles = len(vehicles)
    if num_vehicles == 0:
         return 0,

    chunk_size = len(requests) // num_vehicles + 1
    
    for i, vehicle in enumerate(vehicles):
        route_indices = individual[i*chunk_size : (i+1)*chunk_size]
        if not route_indices:
            continue
            
        # Calculate route segments
        current_loc = type('obj', (object,), {'lat': vehicle.start_loc[0], 'lng': vehicle.start_loc[1]})
        
        for req_idx in route_indices:
            if req_idx >= len(requests): continue 
            req = requests[req_idx]
            
            dist = distance(current_loc, req)
            total_distance += dist
            
            # The "Noble" Equation component: Reward for helping vulnerable
            total_svi_score += (req.needs_resources * req.svi)
            
            current_loc = req
            
    # Fitness Function
    fitness = total_svi_score - (ALPHA * total_distance)
    return fitness,

toolbox.register("indices", random.sample, range(100), 100) # Placeholder range, updated in run
toolbox.register("individual", tools.initIterate, creator.Individual, toolbox.indices)
toolbox.register("population", tools.initRepeat, list, toolbox.individual)

toolbox.register("evaluate", eval_routes)
toolbox.register("mate", tools.cxOrdered)
toolbox.register("mutate", tools.mutShuffleIndexes, indpb=0.05)
toolbox.register("select", tools.selTournament, tournsize=3)

@app.post("/optimize-routes")
async def optimize_routes(data: OptimizationRequest):
    if not data.requests or not data.vehicles:
        return {"routes": []}

    # Update toolbox for current request size
    num_requests = len(data.requests)
    toolbox.register("indices", random.sample, range(num_requests), num_requests)
    toolbox.register("individual", tools.initIterate, creator.Individual, toolbox.indices)
    
    # Run GA
    pop = toolbox.population(n=50)
    # We need to pass the dynamic data to the evaluation function
    # DEAP's toolbox.register fixes arguments, but we need dynamic ones.
    # A common pattern is to use a closure or re-register.
    toolbox.register("evaluate", eval_routes, requests=data.requests, vehicles=data.vehicles)

    result, log = algorithms.eaSimple(pop, toolbox, cxpb=0.7, mutpb=0.2, ngen=30, verbose=False)
    
    best_ind = tools.selBest(result, 1)[0]
    
    # Decode best individual into routes
    routes = {}
    num_vehicles = len(data.vehicles)
    chunk_size = len(data.requests) // num_vehicles + 1
    
    for i, vehicle in enumerate(data.vehicles):
        route_indices = best_ind[i*chunk_size : (i+1)*chunk_size]
        valid_reqs = [data.requests[idx] for idx in route_indices if idx < len(data.requests)]
        routes[vehicle.id] = valid_reqs
        
    return {"routes": routes, "fitness": best_ind.fitness.values[0]}

@app.get("/")
def read_root():
    return {"status": "AI Engine Online"}
