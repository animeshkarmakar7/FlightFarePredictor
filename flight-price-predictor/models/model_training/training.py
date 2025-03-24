# src/model_training/train.py
import pandas as pd
import os
import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor

def train_model():
    # Define paths
    processed_data_path = os.path.join(os.path.dirname(__file__), '../../data/processed/flights_processed.csv')
    model_save_path = os.path.join(os.path.dirname(__file__), '../../models/xgboost_model.pkl')
    
    # Load processed data
    df = pd.read_csv(processed_data_path)
    
    # Prepare features and target
    X = df.drop('price', axis=1)
    y = df['price']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Initialize and train model
    model = XGBRegressor(
        n_estimators=1000,
        learning_rate=0.01,
        max_depth=5,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    print(f"MAE: {mean_absolute_error(y_test, y_pred):.2f}")
    
    # Calculate RMSE manually
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    print(f"RMSE: {rmse:.2f}")
    
    print(f"R² Score: {r2_score(y_test, y_pred):.4f}")
    
    
    # Save model
    os.makedirs(os.path.dirname(model_save_path), exist_ok=True)
    joblib.dump(model, model_save_path)
    print(f"Model saved to: {model_save_path}")

if __name__ == "__main__":
    train_model()