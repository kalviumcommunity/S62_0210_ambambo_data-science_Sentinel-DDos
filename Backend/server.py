"""
Sentinel DDoS — Python ML Microservice
Flask server exposing the trained Random Forest model for per-row inference.

Endpoints:
  GET  /health          → service liveness + model availability
  POST /predict         → batch file prediction (original endpoint)
  POST /predict-row     → single-row JSON prediction (called by Node.js)
"""

import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from flask import Flask, request, jsonify
import pandas as pd
import numpy as np  

app = Flask(__name__)

# ── CORS (Node.js → Python, no browser involved, but safe to add) ──
@app.after_request
def add_cors(response):
    response.headers["Access-Control-Allow-Origin"]  = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        resp = jsonify({})
        resp.headers["Access-Control-Allow-Origin"]  = "*"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
        resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        return resp, 204


# ── Load model (graceful degradation if missing) ─────────────────
ML_AVAILABLE = False
model = scaler = encoder = None

try:
    from ml.predict import model, scaler, encoder
    ML_AVAILABLE = True
    print("✓ ML model, scaler, and encoder loaded successfully")
except Exception as e:
    print(f"⚠  ML model not available: {e}")
    print("   /predict-row will return 503 — Node.js will use rule-based fallback")


# ── Helper ───────────────────────────────────────────────────────
def _prepare_df(features: dict) -> pd.DataFrame:
    """
    Convert a flat feature dict into a DataFrame aligned with the scaler's
    expected columns.  Missing columns are filled with 0; extra columns are
    dropped.  All values are coerced to float.
    """
    df = pd.DataFrame([features])

    # Normalise column names to match training format
    df.columns = (
        df.columns
        .str.strip()
        .str.replace(r"[\s/]+", "_", regex=True)
    )

    if hasattr(scaler, "feature_names_in_"):
        expected = list(scaler.feature_names_in_)
        for col in expected:
            if col not in df.columns:
                df[col] = 0
        df = df[expected]

    df = df.apply(pd.to_numeric, errors="coerce").fillna(0)
    return df


# ── Routes ───────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status":       "ok",
        "ml_available": ML_AVAILABLE,
    })


@app.route("/predict", methods=["POST"])
def predict_file():
    """Original batch endpoint: accepts a CSV file upload."""
    if not ML_AVAILABLE:
        return jsonify({"error": "ML model not loaded"}), 503

    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file provided"}), 400

    try:
        data = pd.read_csv(file)
        data.columns = data.columns.str.strip().str.replace(r"[\s/]+", "_", regex=True)

        sample = data.drop(["Label"], axis=1, errors="ignore")
        sample = sample.apply(pd.to_numeric, errors="coerce").fillna(0)

        if hasattr(scaler, "feature_names_in_"):
            for col in scaler.feature_names_in_:
                if col not in sample.columns:
                    sample[col] = 0
            sample = sample[scaler.feature_names_in_]

        scaled      = scaler.transform(sample)
        predictions = model.predict(scaled)
        labels      = encoder.inverse_transform(predictions)
        summary     = pd.Series(labels).value_counts().to_dict()

        return jsonify({"traffic_summary": summary})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/predict-row", methods=["POST"])
def predict_row():
    """
    Per-row endpoint called by the Node.js stream engine.

    Request body:
        { "features": { <column>: <value>, ... } }

    Response:
        {
          "label": "BENIGN" | "Syn" | "UDP" | ...,
          "attack_probability": 0.0–1.0,
          "attack_type": string,
          "is_attack": bool
        }
    """
    if not ML_AVAILABLE:
        return jsonify({
            "error":             "ML model not loaded",
            "label":             "UNKNOWN",
            "attack_probability": 0.5,
            "attack_type":       "UNKNOWN",
            "is_attack":         False,
        }), 503

    body = request.get_json(silent=True) or {}
    features = body.get("features", {})

    if not features:
        return jsonify({"error": "No features provided"}), 400

    try:
        df     = _prepare_df(features)
        scaled = scaler.transform(df)

        prediction = model.predict(scaled)
        label      = str(encoder.inverse_transform(prediction)[0])

        # Probability of the predicted class
        proba      = model.predict_proba(scaled)[0]
        pred_idx   = list(model.classes_).index(prediction[0])
        confidence = float(proba[pred_idx])

        is_benign  = label.strip().lower() in ("benign", "normal", "safe")
        is_attack  = not is_benign
        attack_prob = confidence if is_attack else (1.0 - confidence)

        return jsonify({
            "label":              label,
            "attack_probability": round(float(attack_prob), 4),
            "attack_type":        "BENIGN" if is_benign else label,
            "is_attack":          is_attack,
        })

    except Exception as e:
        # Return 200 so Node.js doesn't treat it as a hard error;
        # the rule-based fallback handles it on the Node side.
        return jsonify({
            "label":             "ERROR",
            "attack_probability": 0.5,
            "attack_type":       "UNKNOWN",
            "is_attack":         False,
            "error":             str(e),
        }), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)