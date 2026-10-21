from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.exceptions import RequestEntityTooLarge, BadRequest
import os
import json
import numpy as np
import pandas as pd
import joblib
from PIL import Image
import tensorflow as tf
import base64
import io
import cv2

app = Flask(__name__)

# Upload configuration: 10 MB maximum request payload
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024

# CORS configuration: configurable via ALLOWED_ORIGINS env var
allowed_origins_raw = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5001")
allowed_origins = [orig.strip() for orig in allowed_origins_raw.split(",") if orig.strip()]
CORS(app, origins=allowed_origins)

# Service authentication middleware
@app.before_request
def authenticate_service_key():
    # Allow CORS preflight requests
    if request.method == "OPTIONS":
        return None

    ai_service_key = os.environ.get("AI_SERVICE_KEY")
    # Only enforce if AI_SERVICE_KEY is configured in the environment
    if ai_service_key and request.path.startswith("/api/predict/"):
        client_key = request.headers.get("X-Service-Key")
        if not client_key or client_key != ai_service_key:
            return jsonify({"error": "Unauthorized: invalid or missing service key."}), 401

# Global Error Handlers
@app.errorhandler(413)
@app.errorhandler(RequestEntityTooLarge)
def handle_payload_too_large(e):
    return jsonify({"error": "File size exceeds the 10MB limit."}), 413

@app.errorhandler(400)
@app.errorhandler(BadRequest)
def handle_bad_request(e):
    return jsonify({"error": "Bad request. Please verify your input parameters and format."}), 400

@app.errorhandler(500)
def handle_internal_server_error(e):
    app.logger.exception("Internal server error")
    return jsonify({"error": "An internal server error occurred."}), 500

@app.route('/', methods=['GET'])
def index():
    return jsonify({"status": "running", "service": "PCOS AI Inference Engine"})

@app.route('/api/health', methods=['GET'])
def health():
    tabular_loaded = bool(tabular_model is not None and tabular_features is not None)
    image_loaded = bool(image_model is not None)
    return jsonify({
        "status": "healthy",
        "service": "PCOS AI Inference Engine",
        "tabular_model_loaded": tabular_loaded,
        "image_model_loaded": image_loaded,
        "models": {
            "tabular_loaded": tabular_loaded,
            "image_loaded": image_loaded
        }
    })

# Load the models
model_dir = "models"
tabular_model_path = os.path.join(model_dir, "tabular_model.pkl")
tabular_features_path = os.path.join(model_dir, "tabular_features.pkl")
image_model_keras_path = os.path.join(model_dir, "image_model.keras")
image_model_h5_path = os.path.join(model_dir, "image_model.h5")
class_names_path = os.path.join(model_dir, "class_names.json")

tabular_model = None
tabular_features = None
image_model = None
class_names = ["infected", "noninfected"]

if os.path.exists(class_names_path):
    try:
        with open(class_names_path, "r") as f:
            class_names = json.load(f)
        app.logger.info(f"Class names loaded: {class_names}")
    except Exception as e:
        app.logger.warning(f"Could not load class_names.json: {e}")

if os.path.exists(tabular_model_path) and os.path.exists(tabular_features_path):
    try:
        tabular_model = joblib.load(tabular_model_path)
        tabular_features = joblib.load(tabular_features_path)
        app.logger.info("Tabular model loaded successfully.")
    except Exception as e:
        app.logger.exception(f"Failed to load tabular model: {e}")

if os.path.exists(image_model_keras_path):
    try:
        image_model = tf.keras.models.load_model(image_model_keras_path)
        app.logger.info(f"Image model loaded from {image_model_keras_path}.")
    except Exception as e:
        app.logger.warning(f"Failed to load {image_model_keras_path}: {e}")

if image_model is None and os.path.exists(image_model_h5_path):
    try:
        image_model = tf.keras.models.load_model(image_model_h5_path)
        app.logger.info(f"Image model loaded from fallback {image_model_h5_path}.")
    except Exception as e:
        app.logger.warning(f"Failed to load fallback {image_model_h5_path}: {e}")

def infected_probability(raw):
    """
    Derives P(infected) from the model's raw sigmoid output based on class_names.
    If class 0 is 'infected', raw is P(class 1) = P(noninfected), so P(infected) = 1.0 - raw.
    If class 1 is 'infected', raw is P(class 1) = P(infected).
    """
    raw_val = float(raw)
    if class_names and len(class_names) >= 2:
        if class_names[0].lower() == "infected":
            return float(np.clip(1.0 - raw_val, 0.0, 1.0))
        elif class_names[1].lower() == "infected":
            return float(np.clip(raw_val, 0.0, 1.0))
    return float(np.clip(1.0 - raw_val, 0.0, 1.0))

def preprocess_pil(img):
    """
    Preprocesses a PIL Image, numpy array, or image file path:
    Converts to RGB, resizes to (128, 128), casts to float32, adds batch dim.
    NO extra rescaling is performed here since the CNN model contains layers.Rescaling(1./255).
    Returns numpy array of shape (1, 128, 128, 3).
    """
    if isinstance(img, (str, os.PathLike)):
        img = Image.open(img)
    elif isinstance(img, np.ndarray):
        img = Image.fromarray(img)
    img_rgb = img.convert("RGB")
    img_resized = img_rgb.resize((128, 128))
    img_array = np.array(img_resized, dtype=np.float32)
    img_batch = np.expand_dims(img_array, axis=0)
    return img_batch

def validate_ultrasound_image(img_input):
    """
    Validates whether the uploaded image is likely an ultrasound scan.
    Accepts a PIL Image, numpy array, or image file path.
    Checks: grayscale dominance, dark background, intensity distribution.
    Returns (is_valid, reason) tuple.
    """
    try:
        if isinstance(img_input, np.ndarray):
            img_array = img_input
            height, width = img_array.shape[:2]
        elif isinstance(img_input, Image.Image):
            width, height = img_input.size
            img_rgb = img_input.convert("RGB")
            img_array = np.array(img_rgb)
        elif isinstance(img_input, (str, os.PathLike)):
            with Image.open(img_input) as img:
                width, height = img.size
                img_rgb = img.convert("RGB")
                img_array = np.array(img_rgb)
        else:
            return False, "Unsupported image data format."

        # Check 1: Image must be loadable and reasonable size
        if width < 50 or height < 50:
            return False, "Image is too small. Please upload a clear ultrasound image."

        # Check 2: Grayscale dominance — ultrasound images are near-monochrome
        # Calculate color saturation: difference between max and min channel per pixel
        r = img_array[:, :, 0].astype(float)
        g = img_array[:, :, 1].astype(float)
        b = img_array[:, :, 2].astype(float)
        max_channel = np.maximum(np.maximum(r, g), b)
        min_channel = np.minimum(np.minimum(r, g), b)

        # Saturation = (max - min) / (max + 1) to avoid division by zero
        saturation = (max_channel - min_channel) / (max_channel + 1)
        avg_saturation = float(np.mean(saturation))

        # Ultrasounds are grayscale: avg saturation should be low (threshold: 0.18)
        # Colorful photos like selfies and landscapes typically have saturation > 0.18
        if avg_saturation > 0.18:
            return False, "This does not appear to be an ultrasound image. The image contains too much color. Ultrasound scans are typically grayscale. Please upload a valid ovarian ultrasound report."

        # Check 3: Dark background ratio — ultrasound images have significant dark areas
        gray = np.mean(img_array, axis=2)
        dark_pixel_ratio = float(np.mean(gray < 40))  # pixels with intensity < 40

        # Ultrasounds typically have a dark background (threshold: 0.10)
        if dark_pixel_ratio < 0.10:
            return False, "This does not appear to be an ultrasound image. Ultrasound scans typically have a dark background. Please upload a valid ovarian ultrasound report."

        # Check 4: Intensity distribution — ultrasound images have a specific histogram
        # They tend to be dark-heavy with some bright tissue echo spots
        bright_pixel_ratio = float(np.mean(gray > 220))  # very bright pixels

        # If the image is mostly bright with very little dark background, it's likely not an ultrasound
        if bright_pixel_ratio > 0.5 and dark_pixel_ratio < 0.15:
            return False, "This does not appear to be an ultrasound image. The image is too bright to be a medical scan. Please upload a valid ovarian ultrasound report."

        return True, "Valid ultrasound image"

    except Exception as e:
        app.logger.exception("Image validation failed with exception")
        return False, "Could not process the image. Please upload a valid image file (JPG, PNG)."

def generate_gradcam_base64(img_input, model):
    """
    Generates a Grad-CAM heatmap overlay for the given image and model,
    targeting P(infected), returning a base64-encoded JPEG image string.
    Accepts a PIL Image, numpy array, or image file path.
    """
    try:
        if isinstance(img_input, Image.Image):
            img_orig_rgb = np.array(img_input.convert("RGB"))
        elif isinstance(img_input, np.ndarray):
            if len(img_input.shape) == 2:
                img_orig_rgb = cv2.cvtColor(img_input, cv2.COLOR_GRAY2RGB)
            elif img_input.shape[2] == 4:
                img_orig_rgb = cv2.cvtColor(img_input, cv2.COLOR_RGBA2RGB)
            else:
                img_orig_rgb = img_input.copy()
        elif isinstance(img_input, (str, os.PathLike)):
            img_orig = cv2.imread(str(img_input))
            if img_orig is None:
                return None
            img_orig_rgb = cv2.cvtColor(img_orig, cv2.COLOR_BGR2RGB)
        else:
            return None

        # Consistent preprocessing with preprocess_pil
        img_tensor = preprocess_pil(img_orig_rgb)

        # Find the last Conv2D or functional layer in model
        conv_layer = None
        for layer in reversed(model.layers):
            if isinstance(layer, tf.keras.layers.Conv2D) or 'conv' in layer.name.lower():
                conv_layer = layer
                break

        if conv_layer is None:
            return None

        # Layer-by-layer forward tape pass for Keras 3 Sequential compatibility
        with tf.GradientTape() as tape:
            x = img_tensor
            conv_output = None
            for layer in model.layers:
                x = layer(x)
                if layer.name == conv_layer.name:
                    conv_output = x
                    tape.watch(conv_output)

            # Target score: P(infected)
            # If class 0 is infected, output x[0][0] is P(noninfected), so P(infected) is 1.0 - x[0][0]
            if class_names and class_names[0].lower() == "infected":
                loss = 1.0 - x[0][0]
            else:
                loss = x[0][0]

        grads = tape.gradient(loss, conv_output)
        if grads is None:
            return None
        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

        conv_output_np = conv_output[0].numpy()
        pooled_grads_np = pooled_grads.numpy()

        heatmap = conv_output_np @ pooled_grads_np[..., np.newaxis]
        heatmap = np.squeeze(heatmap)

        heatmap = np.maximum(heatmap, 0)
        max_val = np.max(heatmap)
        if max_val > 0:
            heatmap = heatmap / max_val

        heatmap_resized = cv2.resize(heatmap, (img_orig_rgb.shape[1], img_orig_rgb.shape[0]))
        heatmap_uint8 = np.uint8(255 * heatmap_resized)

        heatmap_colored = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
        heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)

        superimposed = cv2.addWeighted(img_orig_rgb, 0.6, heatmap_colored, 0.4, 0)

        is_success, buffer = cv2.imencode(".jpg", cv2.cvtColor(superimposed, cv2.COLOR_RGB2BGR))
        if not is_success:
            return None

        b64_str = base64.b64encode(buffer).decode("utf-8")
        return f"data:image/jpeg;base64,{b64_str}"

    except Exception:
        app.logger.exception("Grad-CAM generation failed")
        return None

def build_row(data_dict):
    """
    Builds a single-row DataFrame matching tabular_features order.
    Missing, empty (""), None, or non-numeric values are filled with np.nan.
    Attempts lookup using both raw feature name and stripped feature name.
    """
    if not data_dict or not isinstance(data_dict, dict):
        data_dict = {}

    row_data = {}
    for feature in tabular_features:
        val = data_dict.get(feature)
        if val is None:
            val = data_dict.get(feature.strip())

        if val is None or val == "":
            row_data[feature] = [np.nan]
        else:
            try:
                row_data[feature] = [float(val)]
            except (ValueError, TypeError):
                row_data[feature] = [np.nan]

    return pd.DataFrame(row_data)

@app.route('/api/predict/tabular', methods=['POST'])
def predict_tabular():
    if not tabular_model or not tabular_features:
        return jsonify({"error": "Tabular model is unavailable. Please ensure tabular_model.pkl and tabular_features.pkl are present in models/."}), 503

    if not request.is_json:
        return jsonify({"error": "Invalid request: Content-Type must be application/json."}), 400

    data = request.get_json(silent=True)
    if data is None or not isinstance(data, dict):
        return jsonify({"error": "Invalid request: JSON object expected."}), 400

    if not data:
        return jsonify({"error": "No clinical data provided."}), 400

    invalid_fields = []
    for k, v in data.items():
        if v is not None and v != "":
            try:
                float(v)
            except (ValueError, TypeError):
                invalid_fields.append(k)

    if invalid_fields:
        return jsonify({"error": f"Invalid non-numeric value for field(s): {', '.join(invalid_fields)}"}), 400

    try:
        df = build_row(data)

        # Predict
        prediction = tabular_model.predict(df)[0]
        probability = tabular_model.predict_proba(df)[0]

        result = {
            "prediction": int(prediction),  # 0 or 1
            "risk_score": float(probability[1] * 100),
            "message": "High Risk of PCOS/PCOD" if prediction == 1 else "Low Risk of PCOS/PCOD"
        }
        return jsonify(result)
    except Exception:
        app.logger.exception("Error in tabular prediction")
        return jsonify({"error": "An internal error occurred during tabular prediction."}), 500

@app.route('/api/predict/image', methods=['POST'])
def predict_image():
    if not image_model:
        return jsonify({"error": "Image model unavailable."}), 503

    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded. Please upload an image file."}), 400
    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({"error": "No selected file."}), 400

    try:
        try:
            img = Image.open(file.stream)
            img.load()
        except Exception:
            return jsonify({"error": "Could not decode image. Please upload a valid image file."}), 400

        if img.format not in ("JPEG", "PNG"):
            return jsonify({"error": f"Unsupported image format: {img.format}. Please upload a JPEG or PNG image."}), 400

        # Validate that the image is actually an ultrasound
        is_valid, validation_msg = validate_ultrasound_image(img)
        if not is_valid:
            return jsonify({
                "error": "invalid_image",
                "message": validation_msg,
                "suggestion": "Please upload an ovarian ultrasound scan image (grayscale medical imaging)."
            }), 400

        # Preprocess using preprocess_pil
        img_tensor = preprocess_pil(img)

        # Single-image inference without .predict() overhead
        raw_pred = float(image_model(img_tensor, training=False)[0][0].numpy())
        prob_infected = infected_probability(raw_pred)
        risk = prob_infected * 100.0
        is_infected = prob_infected >= 0.5

        result = {
            "prediction": 1 if is_infected else 0, # Map to Tabular's 1 for PCOS, 0 for Normal
            "risk_score": float(risk),
            "message": "High Risk based on Ultrasound" if is_infected else "Ultrasound appears normal"
        }
        return jsonify(result)

    except Exception:
        app.logger.exception("Error during image prediction")
        return jsonify({"error": "An internal error occurred during image prediction."}), 500

@app.route('/api/predict/combined', methods=['POST'])
def predict_combined():
    try:
        if not tabular_model or not tabular_features:
            return jsonify({
                "error": "Tabular model is unavailable. Please ensure tabular_model.pkl and tabular_features.pkl are trained and present in models/."
            }), 503

        clinical_data = {}
        image_provided = False
        image_result = None

        # 1. Extract data based on Content-Type
        if request.is_json:
            data = request.get_json(silent=True)
            if data is None or not isinstance(data, dict):
                return jsonify({"error": "Invalid request: JSON object expected."}), 400

            # Validate numeric values
            invalid_fields = []
            for k, v in data.items():
                if v is not None and v != "":
                    try:
                        float(v)
                    except (ValueError, TypeError):
                        invalid_fields.append(k)
            if invalid_fields:
                return jsonify({"error": f"Invalid non-numeric value for field(s): {', '.join(invalid_fields)}"}), 400

            def parse_numeric(v):
                if v is None or v == "":
                    return None
                try:
                    return float(v)
                except (ValueError, TypeError):
                    return None

            # Handle age
            age_raw = data.get("age") if data.get("age") is not None else data.get("Age (yrs)")
            age_val = parse_numeric(age_raw)
            if age_val is not None:
                clinical_data["Age (yrs)"] = age_val

            # Handle bmi
            bmi_raw = data.get("bmi") if data.get("bmi") is not None else data.get("BMI")
            bmi_val = parse_numeric(bmi_raw)
            if bmi_val is not None:
                clinical_data["BMI"] = bmi_val

            # Handle cycle -> Cycle(R/I): 2 if regular (<= 35 days), 4 if irregular (> 35 days)
            cycle_raw = data.get("cycle") if data.get("cycle") is not None else data.get("Cycle length(days)")
            cycle_val = parse_numeric(cycle_raw)
            if cycle_val is not None:
                clinical_data["Cycle(R/I)"] = 2 if cycle_val <= 35 else 4
                clinical_data["Cycle length(days)"] = cycle_val
            elif "Cycle(R/I)" in data:
                c_ri = parse_numeric(data.get("Cycle(R/I)"))
                if c_ri is not None:
                    clinical_data["Cycle(R/I)"] = c_ri

            # Handle ratio
            ratio_raw = data.get("ratio") if data.get("ratio") is not None else data.get("Waist:Hip Ratio")
            ratio_val = parse_numeric(ratio_raw)
            if ratio_val is not None:
                clinical_data["Waist:Hip Ratio"] = ratio_val

            # Allow any other tabular features provided directly in JSON
            for k, v in data.items():
                if k not in ["age", "bmi", "cycle", "ratio"] and v is not None and v != "":
                    clinical_data[k] = v

        elif request.form or 'clinical_data' in request.form or 'file' in request.files:
            raw_clinical = request.form.get('clinical_data')
            if raw_clinical:
                try:
                    clinical_data = json.loads(raw_clinical)
                except Exception:
                    return jsonify({"error": "Invalid JSON in clinical_data form field."}), 400
                if not isinstance(clinical_data, dict):
                    return jsonify({"error": "clinical_data must be a JSON object."}), 400

                invalid_fields = []
                for k, v in clinical_data.items():
                    if v is not None and v != "":
                        try:
                            float(v)
                        except (ValueError, TypeError):
                            invalid_fields.append(k)
                if invalid_fields:
                    return jsonify({"error": f"Invalid non-numeric value in clinical_data: {', '.join(invalid_fields)}"}), 400
            else:
                clinical_data = {}

            # Handle image if present
            if 'file' in request.files:
                file = request.files['file']
                if file and file.filename != '':
                    try:
                        img = Image.open(file.stream)
                        img.load()
                    except Exception:
                        return jsonify({"error": "Could not decode uploaded image."}), 400

                    if img.format not in ("JPEG", "PNG"):
                        return jsonify({"error": f"Unsupported image format: {img.format}. Please upload a JPEG or PNG image."}), 400

                    # Validate that the image is actually an ultrasound
                    is_valid, validation_msg = validate_ultrasound_image(img)
                    if not is_valid:
                        return jsonify({
                            "error": "invalid_image",
                            "message": validation_msg,
                            "suggestion": "Please upload an ovarian ultrasound scan image (grayscale medical imaging)."
                        }), 400

                    if image_model:
                        img_tensor = preprocess_pil(img)
                        raw_pred = float(image_model(img_tensor, training=False)[0][0].numpy())
                        prob_infected = infected_probability(raw_pred)
                        risk = prob_infected * 100.0
                        is_infected = prob_infected >= 0.5

                        # Generate Grad-CAM heatmap overlay targeting P(infected)
                        heatmap_b64 = generate_gradcam_base64(img, image_model)

                        image_provided = True
                        image_result = {
                            "prediction": 1 if is_infected else 0,
                            "risk_score": float(risk),
                            "heatmap_image": heatmap_b64
                        }
        else:
            return jsonify({"error": "Invalid request: expected JSON body or multipart form data."}), 400

        # 2. Get Tabular Prediction
        df = build_row(clinical_data)
        tabular_pred = int(tabular_model.predict(df)[0])
        prob = tabular_model.predict_proba(df)[0]
        # prob[1] = probability of class 1 (PCOS), always use this as risk
        tabular_risk = float(prob[1] * 100)

        clamped_tabular_risk = max(2.0, min(98.0, float(tabular_risk)))

        # 3. Dynamic Fusion based on image_provided
        if image_provided and image_result is not None:
            clamped_image_risk = max(2.0, min(98.0, float(image_result["risk_score"])))
            final_score = (clamped_tabular_risk * 0.6) + (clamped_image_risk * 0.4)
            reported_image_risk = round(float(image_result["risk_score"]), 2)
            heatmap_img = image_result.get("heatmap_image")

            image_confidence_note = ""
            if 30 < image_result["risk_score"] < 70:
                image_confidence_note = "Ultrasound analysis was inconclusive. Consider re-uploading a clearer image or consulting a specialist."
        else:
            final_score = clamped_tabular_risk
            reported_image_risk = None
            heatmap_img = None
            image_confidence_note = "No ultrasound provided, result is based on clinical data only"

        # 4. Risk-level based diagnosis with severity
        if final_score > 70:
            diagnosis = "PCOS Likely"
            severity = "High"
        elif final_score > 50:
            diagnosis = "PCOS/PCOD Possible"
            severity = "Moderate"
        elif final_score > 30:
            diagnosis = "Low Risk - Monitor"
            severity = "Low"
        else:
            diagnosis = "Normal"
            severity = "Minimal"

        return jsonify({
            "diagnosis": diagnosis,
            "severity": severity,
            "confidence": round(final_score, 2),
            "risk_score": round(final_score, 2),
            "tabular_risk": round(tabular_risk, 2),
            "image_risk": reported_image_risk,
            "image_provided": image_provided,
            "image_confidence_note": image_confidence_note,
            "heatmap_image": heatmap_img,
            "message": f"Analysis complete. Risk Level: {severity}. {diagnosis}.",
            "details": {
                "clinical_model_weight": "60%" if image_provided else "100%",
                "imaging_model_weight": "40%" if image_provided else "0%",
                "raw_tabular_risk": round(tabular_risk, 2),
                "raw_image_risk": reported_image_risk,
                "clamped_tabular_risk": round(clamped_tabular_risk, 2),
                "clamped_image_risk": clamped_image_risk if image_provided else None,
            }
        })

    except Exception:
        app.logger.exception("Error in predict_combined")
        return jsonify({"error": "An internal error occurred during combined prediction."}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=False, use_reloader=False)
