import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from flask import Flask, request, jsonify
import pandas as pd
from ml.predict import model, scaler, encoder

app = Flask(__name__)

@app.route("/predict", methods=["POST"])
def predict():

    file = request.files["file"]

    data = pd.read_csv(file)

    data.columns = data.columns.str.replace(" ", "_").str.replace("/", "_")

    sample = data.drop(["Label"], axis=1, errors="ignore")

    sample_scaled = scaler.transform(sample)

    prediction = model.predict(sample_scaled)

    label = encoder.inverse_transform(prediction)

    summary = pd.Series(label).value_counts().to_dict()

    return jsonify({
    "traffic_summary": summary
    })

if __name__ == "__main__":
    app.run(debug=True)