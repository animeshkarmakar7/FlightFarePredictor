import requests
import json
from scrapers.mmt_scraper import scrape_mmt

# Test 1: Test the MMT scraper directly
def test_scraper():
    print("Testing MMT scraper...")
    results = scrape_mmt("DEL", "BOM", "15-04-2023")
    print(f"MMT Scraper returned: {results}")

# Test 2: Test the prediction API
def test_prediction_api():
    print("\nTesting prediction API...")
    url = "http://localhost:5000/predict"
    
    # Sample data with all required features
    sample_data = {
        "duration": 120,  # Flight duration in minutes
        "days_left": 15,   # Days until flight
        "departure_time": 8.5,  # Departure time (24h format)
        "arrival_time": 10.5,   # Arrival time (24h format)
        "airline_Air_India": 1,
        "airline_AirAsia": 0,
        "airline_GO_FIRST": 0,
        "airline_Indigo": 0,
        "airline_SpiceJet": 0,
        "airline_Vistara": 0,
        "source_city_Delhi": 1,
        "source_city_Bangalore": 0,
        "source_city_Chennai": 0,
        "source_city_Hyderabad": 0,
        "source_city_Kolkata": 0,
        "source_city_Mumbai": 0,
        "destination_city_Mumbai": 1,
        "destination_city_Bangalore": 0,
        "destination_city_Chennai": 0,
        "destination_city_Delhi": 0,
        "destination_city_Hyderabad": 0,
        "destination_city_Kolkata": 0,
        "class_Economy": 1,
        "class_Business": 0,
        "stops_zero": 1,
        "stops_one": 0,
        "stops_two_or_more": 0
    }
    
    response = requests.post(url, json=sample_data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")

# Test 3: Test comparison API
def test_comparison_api():
    print("\nTesting comparison API...")
    url = "http://localhost:5000/compare-prices"
    
    sample_data = {
        "origin": "DEL",
        "destination": "BOM",
        "date": "15-04-2023"
    }
    
    response = requests.post(url, json=sample_data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")

if __name__ == "__main__":
    # Choose which tests to run
    test_scraper()
    # Make sure to start the Flask app before running these tests
    test_prediction_api()
    test_comparison_api()