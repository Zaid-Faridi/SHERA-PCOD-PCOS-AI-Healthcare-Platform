# SHEra: AI-Powered PCOS/PCOD Healthcare Platform 🌸

<div align="center">
  <p><strong>Early Detection • Multi-Modal AI Fusion • Automatic Image Validation • Smart Tracking • Supportive Community • Medical Guidance</strong></p>
</div>

SHEra is a comprehensive, next-generation healthcare platform designed to assist women in the early detection, tracking, and ongoing management of **Polycystic Ovary Syndrome (PCOS)** and **Polycystic Ovarian Disease (PCOD)**.

Built with a premium, modern, and calming UI, SHEra bridges the gap between daily health tracking and advanced medical diagnostics, bringing professional-grade AI analysis directly to users in a safe, secure, and user-friendly environment.

---

## 🌟 The Problem & The Solution

**The Problem:** PCOS affects up to 10-15% of women worldwide, yet it remains significantly underdiagnosed. Many women struggle with fragmented health tracking apps, delayed diagnoses, and lack of access to specialized medical advice. 

**The Solution:** SHEra consolidates the entire ecosystem of women's reproductive health into a single platform. It uses dual-model Artificial Intelligence (Clinical + Imaging) to provide a highly accurate preliminary risk assessment, while offering daily tracking and community support to help manage the condition long-term.

---

## 💻 Tech Stack

**Frontend:**  
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

**Backend:**  
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)

**AI & Machine Learning:**  
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![TensorFlow](https://img.shields.io/badge/TensorFlow-%23FF6F00.svg?style=for-the-badge&logo=TensorFlow&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-%23F7931E.svg?style=for-the-badge&logo=scikit-learn&logoColor=white)
![Flask](https://img.shields.io/badge/flask-%23000.svg?style=for-the-badge&logo=flask&logoColor=white)

---

## ✨ Core Features & Modules

### 1. 🤖 Multi-Modal AI Diagnostic Hub
The heart of SHEra is its proprietary AI engine. It evaluates both clinical history and medical imaging simultaneously.
*   **Clinical Analysis (Tabular Random Forest):** Evaluates a 41-feature clinical matrix.
*   **Symptom Mapping:** Tracks physical symptoms (acne, hair loss, hirsutism, weight gain) and cycle regularity.
*   **Hormonal Metrics:** Evaluates hormonal balances (FSH, LH, AMH).
*   **Vitals:** Incorporates blood pressure, glucose, and body metrics (BMI, Waist:Hip Ratio).
*   **Lab Report Integration:** Users can optionally input exact clinical lab metrics. Unprovided features fallback to intelligent population medians to ensure accuracy without forcing users to have immediate lab results.
*   **Ultrasound Analysis (CNN):** A deep Convolutional Neural Network visually inspects pelvic ultrasound scans for ovarian cysts.
*   **Weighted AI Fusion Scoring:** Merges outputs (`Clinical Data 60%` + `Visual Scan 40%`) into a unified, highly accurate risk score.
*   **Severity-Tiered Classification:** Seamlessly classifies risk into stages (`PCOS Likely`, `PCOS/PCOD Possible`, `Low Risk - Monitor`, `Normal`).

### 2. 🔍 Explainable AI & Trust
We believe AI in healthcare must be transparent.
*   **Grad-CAM Heatmaps:** Generates a visual heatmap overlay on ultrasound uploads.
*   **Visual Proof:** Highlights exactly which regions of the ultrasound (e.g., specific enlarged follicles) triggered the AI's detection.
*   **Confidence Scoring:** Provides an exact confidence percentage and clinical severity level.

### 3. 🛡️ Smart Ultrasound Image Guardrail
A built-in safety mechanism to ensure the AI isn't fed junk data.
*   **Grayscale Dominance Check:** Rejects colorful photos (like selfies).
*   **Background Ratio Check:** Evaluates pixel darkness to confirm authentic medical imaging characteristics.
*   **Real-time Rejection:** Returns immediate API feedback if a user uploads a document or landscape photo instead of an ultrasound.

### 4. 📝 Premium Clinical Onboarding
A beautiful, interactive profile builder that creates a complete health baseline.
*   **Demographics:** Age, height, weight (with automated BMI calculation).
*   **Medical History:** Past conditions, pregnancy history.
*   **Lifestyle Assessment:** Diet, exercise, and stress levels.
*   **Symptom Check:** Detailed toggles for irregular cycles, hair loss, skin darkening, etc.

### 5. 📄 Exportable Clinical PDF Reports
Take your data to your doctor.
*   **Instant PDF Generation:** Converts the AI risk assessment into a branded, print-ready document.
*   **Comprehensive Summary:** Includes the risk score, patient demographics, and actionable next steps.
*   **Dynamic Binding:** Automatically fetches the user's name, age, and test timestamp.

### 6. 📊 Interactive Health Tracker
A daily digital diary tailored for reproductive health.
*   **Cycle Tracking:** Log menstrual cycle dates with intelligent future predictions.
*   **Mood Logging:** Tag daily moods using a responsive emoji selector.
*   **Symptom Flare-ups:** Record daily symptoms to track patterns over time.
*   **Diagnostic History:** Securely saves all past AI evaluations to track your risk trajectory.

### 7. 💬 Anonymous Social Community
A built-in supportive forum.
*   **Share & Connect:** Share personal experiences, ask questions, and offer advice.
*   **Categorized Tags:** Filter by `#Diet`, `#MentalHealth`, `#TTC` (Trying to Conceive), `#Workouts`.
*   **Upvotes & Comments:** Foster an encouraging digital environment.

### 8. 🩺 Find a Specialist Directory
*   **Geospatial Search:** Suggests nearby gynecologists and endocrinologists.
*   **Distance Calculation:** Uses the Haversine formula based on the user's location.

---

## 🗺️ Application Wireframe & User Flow

```mermaid
graph TD
    A[Welcome / Landing] -->|Register/Login| B(Premium Onboarding)
    B -->|Collect Vitals & Symptoms| C{Main Dashboard}
    
    C -->|Run Analysis| D[Multi-Modal AI Hub]
    D -->|Upload Scan & Lab Data| E(AI Inference Engine)
    E -->|Grad-CAM & Scoring| F[Interactive Results Page]
    F -->|Export Report| G((Clinical PDF Report))
    
    C -->|Daily Tracking| H[Health Tracker]
    H -->|Log Mood & Cycle| I(Diagnostic History)
    
    C -->|Connect| J[Social Community]
    J -->|Post & Upvote| K(Anonymous Forums)
    
    C -->|Get Help| L[Specialist Directory]
    L -->|Geospatial Search| M(Find Nearby Doctors)
```

---

## 🏗️ Technical Architecture & Stack

SHEra utilizes a **Microservices-inspired Dual-Backend Architecture** to ensure high performance and strict isolation between heavy machine learning inference and core application business logic.

### 🎨 Frontend (Client)
*   **Framework:** React 18 & Vite
*   **Styling:** Tailwind CSS & Custom Glassmorphism UI
*   **PDF Generation:** `@react-pdf/renderer` & `jsPDF`
*   **Icons:** Lucide React
*   **Animations:** CSS Keyframes & Framer Motion concepts

### 💾 Application Server (Node.js)
*   **Runtime:** Node.js v18+
*   **Framework:** Express.js
*   **Database:** MongoDB & Mongoose ORM
*   **Authentication:** JWT (JSON Web Tokens) & Bcrypt password hashing
*   **Data Models:** `User`, `HealthData`, `Community`, `Doctor`

### 🧠 AI Inference Engine (Python)
*   **Runtime:** Python 3.9+
*   **Framework:** Flask & Flask-CORS
*   **Machine Learning:** TensorFlow/Keras, Scikit-Learn
*   **Data Processing:** Pandas, NumPy, OpenCV (cv2)
*   **Models:**
    *   **Tabular Model:** `tabular_model.pkl` (Random Forest Classifier)
    *   **Image Model:** `image_model.h5` (Convolutional Neural Network)

---

## 📡 Core API Endpoints

### Application API (`localhost:5001`)
*   **Auth:** `POST /api/auth/register`, `POST /api/auth/login`
*   **Tracking:** `POST /api/health/log`, `GET /api/health/history`
*   **Diagnostics:** `POST /api/health/save-diagnostic`
*   **Community:** `GET /api/community/posts`, `POST /api/community/create`

### AI Engine API (`localhost:5000`)
*   **Dual Fusion Prediction:** `POST /api/predict/combined`
    *   Accepts `multipart/form-data` with `file` (image) and `clinical_data` (JSON).
*   **Standalone Image:** `POST /api/predict/image`
*   **Standalone Tabular:** `POST /api/predict/tabular`

---

## 🚀 Installation & Local Setup

### Prerequisites
*   **Node.js** (v18 or higher)
*   **Python** (v3.9 or higher)
*   **MongoDB** (Running locally on `mongodb://localhost:27017` or via MongoDB Atlas)

### Step 1: Start the AI Backend
```bash
cd pcos-pcod-ai-project
# Optional: Create virtual environment
# python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Development mode:
python3 app.py

# Production mode (Gunicorn WSGI):
gunicorn -w 2 -b 0.0.0.0:5000 app:app
```
*App starts on `http://localhost:5000`*

### Step 2: Start the Node.js Application Server
```bash
cd backend
npm install
npm start
```
*App starts on `http://localhost:5001`*

### Step 3: Start the Frontend Client
```bash
cd frontend
npm install
npm run dev
```
*Access web interface at `http://localhost:5173`*

---

## 🔒 Security & Privacy Notice

SHEra prioritizes health data security:
*   Passwords and sessions are protected via strong hashing and secure tokens.
*   Ultrasound scans uploaded for diagnostic evaluation are processed entirely in temporary memory.
*   **Images are immediately deleted** from the disk upon completion of the AI analysis. They are never permanently stored, logged, or used for subsequent training.

---

*Built to empower women with transparent, multi-modal AI healthcare intelligence.* 🌸
