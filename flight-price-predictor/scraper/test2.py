import requests
from mmt_scraper import scrape_mmt  # Ensure this import is correct

# Test 1: MMT Scraper
def test_scraper():
    print("Testing MMT scraper...")
    try:
        results = scrape_mmt("DEL", "BOM", "15/04/2023")  # Correct date format
        print(f"MMT Scraper returned: {results}")
    except Exception as e:
        print(f"Scraper Error: {e}")

# Test 2: Prediction API
def test_prediction_api():
    print("\nTesting prediction API...")
    url = "http://localhost:5000/predict"
    
    # Align with your API's expected input (e.g., origin/destination/date)
    sample_data = {
        "origin": "DEL",
        "destination": "BOM",
        "date": "2023-04-15"  # Use ISO format
    }
    
    try:
        response = requests.post(url, json=sample_data)
        print(f"Status Code: {response.status_code}")
        if response.content:
            print(f"Response: {response.json()}")
        else:
            print("Error: Empty response")
    except Exception as e:
        print(f"API Error: {e}")

# Test 3: Comparison API (Single Corrected Version)
def test_comparison_api():
    print("\nTesting comparison API...")
    url = "http://localhost:5000/compare-prices"
    
    sample_data = {
        "origin": "DEL",
        "destination": "BOM",
        "date": "2023-04-15"  # Use ISO format
    }
    
    try:
        response = requests.post(url, json=sample_data)
        print(f"Status Code: {response.status_code}")
        if response.content:
            print(f"Response: {response.json()}")
        else:
            print("Error: Empty response")
    except requests.exceptions.ConnectionError:
        print("Error: Server not running. Start Flask first!")
    except Exception as e:
        print(f"API Error: {e}")

if __name__ == "__main__":
    test_scraper()
    test_prediction_api()
    test_comparison_api()