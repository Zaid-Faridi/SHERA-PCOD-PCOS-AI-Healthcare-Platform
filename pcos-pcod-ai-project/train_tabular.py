import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score, confusion_matrix

def strip_columns(df):
    df.columns = df.columns.str.strip()
    return df

print("Loading dataset...")
data_path = os.path.join("Dataset", "clinical_data.csv")
df = pd.read_csv(data_path)
df = strip_columns(df)

# Drop non-feature and target columns
drop_cols = ["Sl. No", "Patient File No.", "PCOS (Y/N)", "Unnamed: 44"]
drop_cols = [col for col in drop_cols if col in df.columns]

X = df.drop(columns=drop_cols)
y = df["PCOS (Y/N)"]

# Keep missing as NaN: coerce non-numeric values to NaN, DO NOT fillna with global median
X = X.apply(pd.to_numeric, errors='coerce')
y = pd.to_numeric(y, errors='coerce').fillna(0).astype(int)

feature_names = list(X.columns)
print(f"Features shape: {X.shape}")

# Stratified train/test split (80/20)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Pipeline: SimpleImputer with median strategy + balanced Random Forest
pipeline = Pipeline([
    ("imp", SimpleImputer(strategy="median")),
    ("rf", RandomForestClassifier(n_estimators=300, class_weight="balanced", random_state=42))
])

# 5-fold Stratified Cross-Validation across full dataset
print("\nRunning 5-Fold Stratified Cross-Validation...")
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_results = cross_validate(pipeline, X, y, cv=cv, scoring={'roc_auc': 'roc_auc', 'recall': 'recall'})
cv_auc_mean = float(cv_results['test_roc_auc'].mean())
cv_auc_std = float(cv_results['test_roc_auc'].std())
cv_recall_mean = float(cv_results['test_recall'].mean())
cv_recall_std = float(cv_results['test_recall'].std())

print(f"5-Fold CV ROC AUC: {cv_auc_mean:.4f} (+/- {cv_auc_std:.4f})")
print(f"5-Fold CV Recall:  {cv_recall_mean:.4f} (+/- {cv_recall_std:.4f})")

# Fit pipeline on training set
print("\nTraining final pipeline on train split...")
pipeline.fit(X_train, y_train)

# Evaluation on test split
preds = pipeline.predict(X_test)
probs = pipeline.predict_proba(X_test)[:, 1]

acc = accuracy_score(y_test, preds)
roc_auc = roc_auc_score(y_test, probs)
cm = confusion_matrix(y_test, preds)
report_dict = classification_report(y_test, preds, output_dict=True)
report_str = classification_report(y_test, preds)

print("\n--- Test Set Evaluation ---")
print(f"Accuracy: {acc*100:.2f}%")
print(f"ROC AUC:  {roc_auc:.4f}")
print("Confusion Matrix:")
print(cm)
print("\nClassification Report:")
print(report_str)

# Feature Importances from RF step
rf_step = pipeline.named_steps["rf"]
importances = rf_step.feature_importances_
feat_imp = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
top_15 = feat_imp[:15]

print("\nTop 15 Feature Importances:")
for rank, (feat, imp) in enumerate(top_15, 1):
    print(f"  {rank:2d}. {feat:<28} : {imp:.4f}")

# Save artifacts
models_dir = "models"
os.makedirs(models_dir, exist_ok=True)

model_path = os.path.join(models_dir, "tabular_model.pkl")
joblib.dump(pipeline, model_path)
print(f"\nPipeline model saved to {model_path}")

features_path = os.path.join(models_dir, "tabular_features.pkl")
joblib.dump(feature_names, features_path)
print(f"Feature names saved to {features_path}")

# Save metrics to JSON
metrics = {
    "test_accuracy": float(acc),
    "test_roc_auc": float(roc_auc),
    "test_confusion_matrix": cm.tolist(),
    "test_classification_report": report_dict,
    "cv_5fold": {
        "roc_auc_mean": cv_auc_mean,
        "roc_auc_std": cv_auc_std,
        "recall_mean": cv_recall_mean,
        "recall_std": cv_recall_std
    },
    "top_15_features": [{"feature": feat, "importance": float(imp)} for feat, imp in top_15]
}

metrics_path = os.path.join(models_dir, "tabular_metrics.json")
with open(metrics_path, "w") as f:
    json.dump(metrics, f, indent=2)
print(f"Metrics saved to {metrics_path}")

