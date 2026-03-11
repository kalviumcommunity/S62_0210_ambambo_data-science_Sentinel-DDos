import pandas as pd
import joblib
import os

# get project root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

model_path = os.path.join(BASE_DIR, "models", "ddos_model.pkl")
encoder_path = os.path.join(BASE_DIR, "models", "label_encoder.pkl")
scaler_path = os.path.join(BASE_DIR, "models", "standard_scaler.pkl")

model = joblib.load(model_path)
encoder = joblib.load(encoder_path)
scaler = joblib.load(scaler_path)

df = pd.read_csv(os.path.join(BASE_DIR, "data", "processed", "cic_sampled.csv"))

df.columns = df.columns.str.replace(" ", "_").str.replace("/", "_")

X = df.drop("Label", axis=1)

X_scaled = scaler.transform(X)

preds = model.predict(X_scaled)

decoded = encoder.inverse_transform(preds)

print(pd.Series(decoded).value_counts())