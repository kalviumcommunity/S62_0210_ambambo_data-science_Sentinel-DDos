import joblib
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

model_path = os.path.join(BASE_DIR, "models", "ddos_model.pkl")
scaler_path = os.path.join(BASE_DIR, "models", "standard_scaler.pkl")
encoder_path = os.path.join(BASE_DIR, "models", "label_encoder.pkl")

model = joblib.load(model_path)
scaler = joblib.load(scaler_path)
encoder = joblib.load(encoder_path)

print("Model, scaler, and encoder loaded successfully")