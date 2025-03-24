import pandas as pd
import os
from sklearn.preprocessing import OneHotEncoder
import joblib

def preprocess_data():
    raw_data_path = 'D:\\PyAttendence\\flight-price-predictor\\data\\raw\\Clean_Dataset.csv'
    processed_dir = 'D:\\PyAttendence\\flight-price-predictor\\data\\processed'
    model_dir = 'D:\\PyAttendence\\flight-price-predictor\\models'
    processed_data_path = os.path.join(processed_dir, 'flights_processed.csv')
    encoder_path = os.path.join(model_dir, 'encoder.pkl')
    
    df = pd.read_csv(raw_data_path)
    
    # Time conversion
    time_categories = ['Early_Morning', 'Morning', 'Afternoon', 'Evening', 'Night', 'Late_Night']
    df['departure_time'] = pd.Categorical(df['departure_time'], categories=time_categories, ordered=True).codes
    df['arrival_time'] = pd.Categorical(df['arrival_time'], categories=time_categories, ordered=True).codes

    # Feature selection
    numerical_cols = ['duration', 'days_left', 'departure_time', 'arrival_time']  
    categorical_cols = ['airline', 'source_city', 'destination_city', 'class', 'stops']
    
    # Create and save encoder
    encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
    encoded_data = encoder.fit_transform(df[categorical_cols])
    encoded_df = pd.DataFrame(encoded_data, columns=encoder.get_feature_names_out(categorical_cols))
    
    # Save encoder after fitting
    os.makedirs(model_dir, exist_ok=True)
    joblib.dump(encoder, encoder_path)
    print(f"Encoder saved to: {encoder_path}")
    
    # Create final dataset
    processed_df = pd.concat([df[numerical_cols], encoded_df], axis=1)
    processed_df['price'] = df['price']
    
    # Save processed data
    os.makedirs(processed_dir, exist_ok=True)
    processed_df.to_csv(processed_data_path, index=False)
    print(f"Data saved to: {processed_data_path}")

if __name__ == "__main__":
    preprocess_data()