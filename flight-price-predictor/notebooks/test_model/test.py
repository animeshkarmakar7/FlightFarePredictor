import pandas as pd
import joblib

# Load model
model = joblib.load('D:\\PyAttendence\\flight-price-predictor\\models\\xgboost_model.pkl')
expected_features = model.feature_names_in_

# Create input with ALL features
sample_input = pd.DataFrame(0, index=[0], columns=expected_features)

# Set values
sample_input['days_left'] = 10
sample_input['duration'] = 2.3
sample_input['airline_SpiceJet'] = 1
sample_input['source_city_Delhi'] = 1
sample_input['destination_city_Mumbai'] = 1
sample_input['class_Economy'] = 1
sample_input['stops_zero'] = 1
sample_input['departure_time'] = 5.25  # Evening
sample_input['arrival_time'] = 7.40  # Night

# Predict
prediction = model.predict(sample_input)


print(f"Predicted flight price: ₹{prediction[0]:.2f}")