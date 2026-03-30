import sys
import os

# Set ALPHA to test
# We import the ACTUAL function to see if the HARDCODED value holds
# But the hardcoded value is local variable in the function.
# So we run the function and check output.

# We need to mock the classes
class Location:
    def __init__(self, lat, lng, svi, needs):
        self.lat = lat
        self.lng = lng
        self.svi = svi
        self.needs_resources = needs

class Vehicle:
    def __init__(self, id, start_loc):
        self.id = id
        self.start_loc = start_loc

# Add path to ai_engine
sys.path.append(os.path.join(os.getcwd(), 'ai_engine'))
from optimizer import eval_routes

def test_equity():
    print("⚖️  Starting Equity Stress Test...")

    # Data Setup
    # Vehicle at 0,0
    vehicle = Vehicle("v1", (0.0, 0.0))
    
    # Location A: Wealthy (SVI 0.1), Close (1km approx 0.01 deg)
    # 0.01 deg lat ~= 1.1km
    loc_a = Location(0.01, 0.0, 0.1, 100)
    
    # Location B: Refugee Camp (SVI 0.95), Far (25km approx 0.25 deg)
    loc_b = Location(0.25, 0.0, 0.95, 100)
    
    vehicles = [vehicle]
    requests = [loc_a, loc_b]
    
    # Route 1: Visit A only
    # SVI Score: 100*0.1 = 10
    # Cost: 1.1km (approx 0.01 units)
    # Fitness = 10 - (Alpha * 0.01)
    
    # Route 2: Visit B only
    # SVI Score: 100*0.95 = 95
    # Cost: 25km (approx 0.25 units)
    # Fitness = 95 - (Alpha * 0.25)
    
    # Eval Route visiting ONLY B (index 1)
    individual_b = [1]
    fit_b, = eval_routes(individual_b, requests, vehicles)
    
    # Eval Route visiting ONLY A (index 0)
    individual_a = [0]
    fit_a, = eval_routes(individual_a, requests, vehicles)
    
    print(f"Fitness (Refugee Camp, Far): {fit_b}")
    print(f"Fitness (Wealthy Zone, Close): {fit_a}")
    
    if fit_b > fit_a:
        print("SUCCESS: Remote Refugee Camp prioritized over nearby Wealthy Zone.")
        print("   Evidence: The Noble Equation holds.")
    else:
        print("FAILURE: Efficiency overrode Equity.")

if __name__ == "__main__":
    test_equity()
