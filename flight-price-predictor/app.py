from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import logging
import os

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load model - using more robust path handling
MODEL_PATH = 'D:\\PyAttendence\\flight-price-predictor\\models\\xgboost_model.pkl'
try:
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        logger.info("Model loaded successfully from: %s", MODEL_PATH)
    else:
        logger.error("Model file not found at: %s", MODEL_PATH)
        raise FileNotFoundError(f"Model file not found at: {MODEL_PATH}")
except Exception as e:
    logger.error(f"Model loading failed: {str(e)}")
    raise

FEATURE_ORDER = [
    'duration', 'days_left', 'departure_time', 'arrival_time',
    'airline_AirAsia', 'airline_Air_India', 'airline_GO_FIRST',
    'airline_Indigo', 'airline_SpiceJet', 'airline_Vistara',
    'source_city_Bangalore', 'source_city_Chennai', 'source_city_Delhi',
    'source_city_Hyderabad', 'source_city_Kolkata', 'source_city_Mumbai',
    'destination_city_Bangalore', 'destination_city_Chennai',
    'destination_city_Delhi', 'destination_city_Hyderabad',
    'destination_city_Kolkata', 'destination_city_Mumbai',
    'class_Business', 'class_Economy', 
    'stops_one', 'stops_two_or_more', 'stops_zero'
]

def validate_input(data: dict) -> None:
    """Enhanced validation for all required fields"""
    required_numeric = ['days_left', 'duration', 'departure_time', 'arrival_time']
    for field in required_numeric:
        if field not in data:
            raise ValueError(f"Missing required field: {field}")
        if not isinstance(data[field], (int, float)):
            raise ValueError(f"{field} must be numeric")

    # Check if at least one feature is set for each one-hot encoded category
    categories = {
        'airline': 'airline_',
        'source_city': 'source_city_',
        'destination_city': 'destination_city_',
        'class': 'class_',
        'stops': 'stops_'
    }
    
    for category, prefix in categories.items():
        # Find any keys that start with the prefix
        matching_keys = [k for k in data.keys() if k.startswith(prefix)]
        if not matching_keys:
            raise ValueError(f"No {category} features found. At least one {category} feature must be set.")
        
        # Check if at least one value is 1
        if not any(data.get(key) == 1 for key in matching_keys):
            raise ValueError(f"Exactly one {category} must be selected (set to 1)")

def preprocess_input(data: dict) -> pd.DataFrame:
    """Create feature array in exact order expected by model."""
    features = {feature: 0 for feature in FEATURE_ORDER}
    
    # Set numeric values
    numeric_fields = ['duration', 'days_left', 'departure_time', 'arrival_time']
    for field in numeric_fields:
        features[field] = float(data[field])
    
    # Set categorical values (from one-hot encoded fields)
    for feature in FEATURE_ORDER[4:]:  # Skip first 4 numeric fields
        if feature in data:
            features[feature] = int(data[feature])

    # Log the final feature vector for debugging
    logger.info("Final feature vector: %s", features)
    
    return pd.DataFrame([features], columns=FEATURE_ORDER)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        logger.info(f"Received prediction request with data: {data}")
        
        # Log the incoming data for debugging
        for key, value in data.items():
            logger.info(f"Request data - {key}: {value}")
        
        validate_input(data)
        processed_data = preprocess_input(data)
        
        prediction = model.predict(processed_data)
        logger.info(f"Predicted price: {prediction[0]}")
        
        return jsonify({
            'price': round(float(prediction[0]), 2),
            'currency': '₹',
            'status': 'success'
        })
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return jsonify({'error': str(e), 'status': 'error'}), 400
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}", exc_info=True)
        return jsonify({'error': str(e), 'status': 'error'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)