import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import matplotlib.pyplot as plt
import seaborn as sns
import pickle
import os
from datetime import datetime

# Set random seed for reproducibility
np.random.seed(42)

# Function to load and prepare data
def load_data(file_path):
    """Load data from a CSV file"""
    print(f"Loading data from {file_path}...")
    df = pd.read_csv(file_path)
    print(f"Data shape: {df.shape}")
    print("\nColumns in dataset:")
    for col in df.columns:
        print(f"- {col}")
    return df

# Function to preprocess data
def preprocess_data(df, target_column, drop_columns=None):
    """Preprocess data for training"""
    print("\nPreprocessing data...")
    df_processed = df.copy()
    
    if drop_columns:
        df_processed = df_processed.drop(columns=drop_columns)
        print(f"Dropped columns: {drop_columns}")
    
    # Handle missing values
    for col in df_processed.columns:
        if df_processed[col].isnull().sum() > 0:
            if pd.api.types.is_numeric_dtype(df_processed[col]):
                df_processed[col] = df_processed[col].fillna(df_processed[col].median())
                print(f"Filled missing values in '{col}' with median")
            else:
                df_processed[col] = df_processed[col].fillna(df_processed[col].mode()[0])
                print(f"Filled missing values in '{col}' with mode")
    
    # Encode categorical variables
    for col in df_processed.columns:
        if pd.api.types.is_object_dtype(df_processed[col]) and col != target_column:
            df_processed = pd.get_dummies(df_processed, columns=[col], drop_first=True)
            print(f"One-hot encoded column: {col}")
    
    X = df_processed.drop(columns=[target_column])
    y = df_processed[target_column]
    print(f"Final feature count: {X.shape[1]}")
    return X, y

# Function to split data
def split_data(X, y, test_size=0.2, val_size=0.1):
    """Split data into train/val/test sets"""
    print("\nSplitting data...")
    
    X_train_val, X_test, y_train_val, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42
    )
    
    val_ratio = val_size / (1 - test_size)
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_val, y_train_val, test_size=val_ratio, random_state=42
    )
    
    print(f"Training set size: {X_train.shape[0]}")
    print(f"Validation set size: {X_val.shape[0]}")
    print(f"Test set size: {X_test.shape[0]}")
    return X_train, X_val, X_test, y_train, y_val, y_test

# Function to perform hyperparameter tuning
def tune_hyperparameters(X_train, y_train, X_val, y_val, nfolds=5):
    """Perform hyperparameter tuning"""
    print("\nPerforming hyperparameter tuning...")
    
    param_grid = {
        'max_depth': [3, 5],
        'learning_rate': [0.05, 0.1],
        'subsample': [0.8, 1.0],
        'colsample_bytree': [0.8, 1.0]
    }
    
    # Convert data to DMatrix
    dtrain = xgb.DMatrix(X_train, label=y_train)
    dval = xgb.DMatrix(X_val, label=y_val)
    
    best_params = {}
    best_score = float('inf')
    
    # Manual grid search implementation
    for max_depth in param_grid['max_depth']:
        for learning_rate in param_grid['learning_rate']:
            for subsample in param_grid['subsample']:
                for colsample_bytree in param_grid['colsample_bytree']:
                    params = {
                        'max_depth': max_depth,
                        'learning_rate': learning_rate,
                        'subsample': subsample,
                        'colsample_bytree': colsample_bytree,
                        'objective': 'reg:squarederror'
                    }
                    
                    model = xgb.train(
                        params,
                        dtrain,
                        num_boost_round=1000,
                        evals=[(dval, 'validation')],
                        early_stopping_rounds=50,
                        verbose_eval=False
                    )
                    
                    val_pred = model.predict(dval)
                    score = mean_squared_error(y_val, val_pred)
                    
                    if score < best_score:
                        best_score = score
                        best_params = params
                        best_params['n_estimators'] = model.best_iteration
    
    print(f"\nBest parameters: {best_params}")
    print(f"Best validation MSE: {best_score:.4f}")
    return model, best_params

# Function to train XGBoost model
def train_xgboost_model(X_train, y_train, X_val, y_val, params=None):
    """Train XGBoost model with given parameters"""
    print("\nTraining XGBoost model...")
    
    if params is None:
        params = {
            'max_depth': 6,
            'learning_rate': 0.1,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'objective': 'reg:squarederror'
        }
    
    # Convert data to DMatrix
    dtrain = xgb.DMatrix(X_train, label=y_train)
    dval = xgb.DMatrix(X_val, label=y_val)
    
    model = xgb.train(
        params,
        dtrain,
        num_boost_round=1000,
        evals=[(dval, 'validation')],
        early_stopping_rounds=50,
        verbose_eval=False
    )
    
    return model

# Function to evaluate model
def evaluate_model(model, X_train, X_val, X_test, y_train, y_val, y_test):
    """Evaluate model performance"""
    print("\nEvaluating model performance...")
    
    # Convert data to DMatrix
    dtrain = xgb.DMatrix(X_train)
    dval = xgb.DMatrix(X_val)
    dtest = xgb.DMatrix(X_test)
    
    # Make predictions
    y_train_pred = model.predict(dtrain)
    y_val_pred = model.predict(dval)
    y_test_pred = model.predict(dtest)
    
    # Calculate metrics
    metrics = {
        'train': {
            'mse': mean_squared_error(y_train, y_train_pred),
            'rmse': np.sqrt(mean_squared_error(y_train, y_train_pred)),
            'mae': mean_absolute_error(y_train, y_train_pred),
            'r2': r2_score(y_train, y_train_pred)
        },
        'val': {
            'mse': mean_squared_error(y_val, y_val_pred),
            'rmse': np.sqrt(mean_squared_error(y_val, y_val_pred)),
            'mae': mean_absolute_error(y_val, y_val_pred),
            'r2': r2_score(y_val, y_val_pred)
        },
        'test': {
            'mse': mean_squared_error(y_test, y_test_pred),
            'rmse': np.sqrt(mean_squared_error(y_test, y_test_pred)),
            'mae': mean_absolute_error(y_test, y_test_pred),
            'r2': r2_score(y_test, y_test_pred)
        }
    }
    
    # Print metrics
    print("\nModel Performance Metrics:")
    print(f"{'Dataset':<10} {'MSE':<12} {'RMSE':<12} {'MAE':<12} {'R²':<12}")
    print(f"{'-'*50}")
    for dataset in ['train', 'val', 'test']:
        print(f"{dataset:<10} {metrics[dataset]['mse']:<12.4f} {metrics[dataset]['rmse']:<12.4f} "
              f"{metrics[dataset]['mae']:<12.4f} {metrics[dataset]['r2']:<12.4f}")
    
    return metrics

# Function to visualize feature importance
def plot_feature_importance(model, X, output_dir='plots'):
    """Visualize feature importance"""
    print("\nPlotting feature importance...")
    
    # Get feature importance scores
    importance = model.get_score(importance_type='weight')
    features = list(importance.keys())
    scores = list(importance.values())
    
    feature_importance = pd.DataFrame({
        'Feature': features,
        'Importance': scores
    }).sort_values('Importance', ascending=False)
    
    plt.figure(figsize=(12, 8))
    sns.barplot(x='Importance', y='Feature', data=feature_importance.head(20))
    plt.title('Top 20 Feature Importance')
    plt.tight_layout()
    
    os.makedirs(output_dir, exist_ok=True)
    plot_path = os.path.join(output_dir, 'feature_importance.png')
    plt.savefig(plot_path)
    plt.close()
    
    print(f"Feature importance plot saved to {plot_path}")
    print("\nTop 10 features:")
    for i, row in feature_importance.head(10).iterrows():
        print(f"{i+1}. {row['Feature']}: {row['Importance']:.4f}")
    
    return feature_importance

# Function to visualize predictions
def plot_predictions(y_true, y_pred, title, filename):
    """Create prediction vs actual plot"""
    plt.figure(figsize=(10, 6))
    plt.scatter(y_true, y_pred, alpha=0.5)
    plt.plot([y_true.min(), y_true.max()], [y_true.min(), y_true.max()], 'r--')
    plt.xlabel('Actual')
    plt.ylabel('Predicted')
    plt.title(title)
    plt.tight_layout()
    
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    plt.savefig(filename)
    plt.close()
    print(f"Prediction plot saved to {filename}")

# Function to save model
def save_model(model, metrics, params, X, output_dir='models', filename=None):
    """Save model and metadata"""
    print("\nSaving model...")
    os.makedirs(output_dir, exist_ok=True)
    
    if not filename:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"xgboost_model_{timestamp}"
    
    model_path = os.path.join(output_dir, f"{filename}.pkl")
    with open(model_path, 'wb') as f:
        pickle.dump({
            'model': model,
            'metrics': metrics,
            'parameters': params,
            'feature_names': list(X.columns)
        }, f)
    
    print(f"Model saved to {model_path}")
    return model_path

# Main workflow function
def main(file_path, target_column, drop_columns=None, tune_params=False, output_dir='output'):
    """Run entire training workflow"""
    os.makedirs(output_dir, exist_ok=True)
    print("=" * 80)
    print("XGBoost Training Workflow")
    print("=" * 80)
    
    df = load_data(file_path)
    X, y = preprocess_data(df, target_column, drop_columns)
    X_train, X_val, X_test, y_train, y_val, y_test = split_data(X, y)
    
    if tune_params:
        model, best_params = tune_hyperparameters(X_train, y_train, X_val, y_val)
    else:
        best_params = {
            'max_depth': 6,
            'learning_rate': 0.1,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'objective': 'reg:squarederror'
        }
        model = train_xgboost_model(X_train, y_train, X_val, y_val, best_params)
    
    metrics = evaluate_model(model, X_train, X_val, X_test, y_train, y_val, y_test)
    feature_importance = plot_feature_importance(model, X, os.path.join(output_dir, 'plots'))
    plot_predictions(y_test, model.predict(xgb.DMatrix(X_test)), 
                    'Test Set Predictions', 
                    os.path.join(output_dir, 'plots', 'predictions.png'))
    
    model_path = save_model(model, metrics, best_params, X, 
                          os.path.join(output_dir, 'models'))
    
    print("\nTraining completed successfully!")
    print(f"Model saved to: {model_path}")
    return model, metrics, best_params, feature_importance

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Train XGBoost model')
    parser.add_argument('--data_dir', default='data', help='Data directory')
    parser.add_argument('--file_name', required=True, help='CSV filename')
    parser.add_argument('--target', required=True, help='Target column')
    parser.add_argument('--drop', nargs='+', default=None, help='Columns to drop')
    parser.add_argument('--tune', action='store_true', help='Enable tuning')
    parser.add_argument('--output_dir', default='output', help='Output directory')
    
    args = parser.parse_args()
    file_path = os.path.join(args.data_dir, args.file_name)
    
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found!")
        exit(1)
    
    main(file_path, args.target, args.drop, args.tune, args.output_dir)