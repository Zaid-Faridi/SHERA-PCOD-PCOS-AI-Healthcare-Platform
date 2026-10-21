from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import numpy as np
import pandas as pd
import joblib
from PIL import Image
from werkzeug.utils import secure_filename
import tensorflow as tf
import base64
import io
import cv2

app = Flask(__name__)
CORS(app)  # Allow frontend to access the API

@app.route('/', methods=['GET'])
def index():
    return jsonify({"status": "running", "service": "PCOS AI Inference Engine"})

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "service": "PCOS AI Inference Engine"})

# Load the models
model_dir = "models"
tabular_model_path = os.path.join(model_dir, "tabular_model.pkl")
tabular_features_path = os.path.join(model_dir, "tabular_features.pkl")
image_model_path = os.path.join(model_dir, "image_model.h5")

tabular_model = None
tabular_features = None
image_model = None

if os.path.exists(tabular_model_path) and os.path.exists(tabular_features_path):
    tabular_model = joblib.load(tabular_model_path)
    tabular_features = joblib.load(tabular_features_path)
    print("Tabular model loaded!")

if os.path.exists(image_model_path):
    image_model = tf.keras.models.load_model(image_model_path)
    print("Image model loaded!")

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def validate_ultrasound_image(filepath):
    """
    Validates whether the uploaded image is likely an ultrasound scan.
    Checks: grayscale dominance, dark background, intensity distribution.
    Returns (is_valid, reason) tuple.
    """
    try:
        img = Image.open(filepath)
        
        # Check 1: Image must be loadable and reasonable size
        width, height = img.size
        if width < 50 or height < 50:
            return False, "Image is too small. Please upload a clear ultrasound image."
        
        img_rgb = img.convert("RGB")
        img_array = np.array(img_rgb)
        
        # Check 2: Grayscale dominance — ultrasound images are near-monochrome
        # Calculate color saturation: difference between max and min channel per pixel
        r, g, b = img_array[:,:,0].astype(float), img_array[:,:,1].astype(float), img_array[:,:,2].astype(float)
        max_channel = np.maximum(np.maximum(r, g), b)
        min_channel = np.minimum(np.minimum(r, g), b)
        
        # Saturation = (max - min) / (max + 1) to avoid division by zero
        saturation = (max_channel - min_channel) / (max_channel + 1)
        avg_saturation = np.mean(saturation)
        
        # Ultrasounds are grayscale: avg saturation should be very low (< 0.15)
        # Colorful photos like selfies, landscapes have saturation > 0.2
        if avg_saturation > 0.18:
            return False, "This does not appear to be an ultrasound image. The image contains too much color. Ultrasound scans are typically grayscale. Please upload a valid ovarian ultrasound report."
        
        # Check 3: Dark background ratio — ultrasound images have significant dark areas
        gray = np.mean(img_array, axis=2)
        dark_pixel_ratio = np.mean(gray < 40)  # pixels with intensity < 40
        
        # Ultrasounds typically have 20%+ dark background
        if dark_pixel_ratio < 0.10:
            return False, "This does not appear to be an ultrasound image. Ultrasound scans typically have a dark background. Please upload a valid ovarian ultrasound report."
        
        # Check 4: Intensity distribution — ultrasound images have a specific histogram
        # They tend to be dark-heavy with some bright spots (tissue echoes)
        bright_pixel_ratio = np.mean(gray > 220)  # very bright pixels
        mid_tone_ratio = np.mean((gray > 80) & (gray < 200))  # mid-range pixels
        
        # A normal photo has lots of mid-tones; ultrasound is bimodal (dark + some bright)
        # If image is mostly bright and mid-tones with little dark, it's likely not an ultrasound
        if bright_pixel_ratio > 0.5 and dark_pixel_ratio < 0.15:
            return False, "This does not appear to be an ultrasound image. The image is too bright to be a medical scan. Please upload a valid ovarian ultrasound report."
        
        return True, "Valid ultrasound image"
        
    except Exception as e:
        return False, f"Could not process the image: {str(e)}. Please upload a valid image file (JPG, PNG)."

def generate_gradcam_base64(filepath, model):
    """
    Generates a Grad-CAM heatmap overlay for the given image and model,
    returning a base64-encoded JPEG image string.
    """
    try:
        img_orig = cv2.imread(filepath)
        if img_orig is None:
            return None
        img_orig_rgb = cv2.cvtColor(img_orig, cv2.COLOR_BGR2RGB)
        img_resized = cv2.resize(img_orig_rgb, (128, 128))
        img_tensor = np.expand_dims(img_resized.astype(np.float32), axis=0)

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
            loss = x[0]

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

    except Exception as e:
        print(f"Grad-CAM generation failed: {str(e)}")
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
    if not tabular_model:
        return jsonify({"error": "Tabular model not trained yet."}), 500

    data = request.json
    if not data:
        return jsonify({"error": "No data provided."}), 400

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
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/predict/image', methods=['POST'])
def predict_image():
    if not image_model:
        return jsonify({"error": "Image model not trained yet."}), 500

    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    try:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # Validate that the image is actually an ultrasound
        is_valid, validation_msg = validate_ultrasound_image(filepath)
        if not is_valid:
            os.remove(filepath)
            return jsonify({
                "error": "invalid_image",
                "message": validation_msg,
                "suggestion": "Please upload an ovarian ultrasound scan image (grayscale medical imaging)."
            }), 400

        # Preprocess the image
        img = Image.open(filepath).convert("RGB")
        img = img.resize((128, 128))
        img_array = np.array(img).astype(np.float32)
        img_array = np.expand_dims(img_array, axis=0) # Add batch dimension

        # Predict
        prediction = image_model.predict(img_array)[0][0]
        # Since classes were ['infected', 'noninfected'] (0=infected, 1=noninfected based on alpha sorting usually)
        # Let's interpret the sigmoid output: Closer to 1 usually means class 1 (noninfected). Closer to 0 means class 0 (infected)
        # We need to make sure about the class order. tensorflow image_dataset_from_directory sorts classes alphanumerically.
        # 'infected' -> 0, 'noninfected' -> 1
        
        is_infected = prediction < 0.5
        risk_score = (1 - prediction) * 100 if is_infected else (1 - prediction) * 100 # actually risk of infected is (1-prediction)*100
        # let's format it: 1 is Normal, 0 is PCOS
        risk = (1.0 - prediction) * 100
        
        result = {
            "prediction": 1 if is_infected else 0, # Map to Tabular's 1 for PCOS, 0 for Normal
            "risk_score": float(risk),
            "message": "High Risk based on Ultrasound" if is_infected else "Ultrasound appears normal"
        }
        
        os.remove(filepath) # Clean up
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/predict/combined', methods=['POST'])
def predict_combined():
    try:
        clinical_data = {}
        image_result = {"prediction": 0, "risk_score": 50.0} # Default
        
        # 1. Extract data based on Content-Type
        if request.is_json:
            data = request.json or {}
            clinical_data = {}

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

        elif 'clinical_data' in request.form:
            import json
            clinical_data = json.loads(request.form.get('clinical_data', '{}'))
            
            # Handle image if present
            if 'file' in request.files:
                file = request.files['file']
                if file.filename != '':
                    # Reuse image prediction logic
                    filename = secure_filename(file.filename)
                    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    file.save(filepath)
                    
                    # Validate that the image is actually an ultrasound
                    is_valid, validation_msg = validate_ultrasound_image(filepath)
                    if not is_valid:
                        os.remove(filepath)
                        return jsonify({
                            "error": "invalid_image",
                            "message": validation_msg,
                            "suggestion": "Please upload an ovarian ultrasound scan image (grayscale medical imaging)."
                        }), 400
                    
                    if image_model:
                        img = Image.open(filepath).convert("RGB")
                        img = img.resize((128, 128))
                        img_array = np.array(img).astype(np.float32)
                        img_array = np.expand_dims(img_array, axis=0)
                        prediction = image_model.predict(img_array)[0][0]
                        
                        # Generate Grad-CAM heatmap overlay
                        heatmap_b64 = generate_gradcam_base64(filepath, image_model)

                        is_infected = prediction < 0.5
                        risk = (1.0 - prediction) * 100
                        image_result = {
                            "prediction": 1 if is_infected else 0,
                            "risk_score": float(risk),
                            "heatmap_image": heatmap_b64
                        }
                    
                    os.remove(filepath)

        # 2. Get Tabular Prediction
        tabular_pred = 0
        tabular_risk = 50.0
        
        if tabular_model and tabular_features:
            df = build_row(clinical_data)
            tabular_pred = int(tabular_model.predict(df)[0])
            prob = tabular_model.predict_proba(df)[0]
            # prob[1] = probability of class 1 (PCOS), always use this as risk
            tabular_risk = float(prob[1] * 100)
        else:
            # Mock logic if model not loaded
            bmi = float(clinical_data.get("BMI", 22) or 22)
            ratio = float(clinical_data.get("Waist:Hip Ratio", 1.0) or 1.0)
            tabular_risk = 75.0 if (bmi > 25 or ratio > 1.2) else 25.0
            tabular_pred = 1 if tabular_risk > 50 else 0

        # 3. Clamp extreme confidences to realistic range
        clamped_image_risk = max(2.0, min(98.0, image_result["risk_score"]))
        clamped_tabular_risk = max(2.0, min(98.0, tabular_risk))

        # 4. Combine results with weighted fusion
        final_score = (clamped_tabular_risk * 0.6) + (clamped_image_risk * 0.4)

        # 5. Risk-level based diagnosis with severity
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

        # 6. Flag ambiguous image results
        image_confidence_note = ""
        if 30 < image_result["risk_score"] < 70:
            image_confidence_note = "Ultrasound analysis was inconclusive. Consider re-uploading a clearer image or consulting a specialist."

        return jsonify({
            "diagnosis": diagnosis,
            "severity": severity,
            "confidence": round(final_score, 2),
            "risk_score": round(final_score, 2),
            "tabular_risk": round(tabular_risk, 2),
            "image_risk": round(image_result["risk_score"], 2),
            "image_confidence_note": image_confidence_note,
            "heatmap_image": image_result.get("heatmap_image"),
            "message": f"Analysis complete. Risk Level: {severity}. {diagnosis}.",
            "details": {
                "clinical_model_weight": "60%",
                "imaging_model_weight": "40%",
                "raw_tabular_risk": round(tabular_risk, 2),
                "raw_image_risk": round(image_result["risk_score"], 2),
                "clamped_tabular_risk": round(clamped_tabular_risk, 2),
                "clamped_image_risk": round(clamped_image_risk, 2),
            }
        })

    except Exception as e:
        print(f"Error in combined prediction: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
