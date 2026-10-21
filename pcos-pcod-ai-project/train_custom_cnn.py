import os
import json
import random
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.preprocessing import image_dataset_from_directory
from sklearn.metrics import roc_auc_score, precision_score, recall_score, f1_score, confusion_matrix

SEED = 42
random.seed(SEED)
np.random.seed(SEED)
tf.random.set_seed(SEED)

DATASET_DIR = "Dataset"
MODEL_SAVE_PATH = os.path.join("models", "image_model.keras")
CLASS_NAMES_PATH = os.path.join("models", "class_names.json")
METRICS_PATH = os.path.join("models", "image_metrics.json")
IMG_SIZE = (128, 128)
BATCH_SIZE = 32

print("Loading dataset...")
train_ds = image_dataset_from_directory(
    DATASET_DIR,
    validation_split=0.2,
    subset="training",
    seed=SEED,
    shuffle=True,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE
)

val_ds = image_dataset_from_directory(
    DATASET_DIR,
    validation_split=0.2,
    subset="validation",
    seed=SEED,
    shuffle=True,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE
)

class_names = train_ds.class_names
print(f"Class names found: {class_names}")

# Save class_names
os.makedirs("models", exist_ok=True)
with open(CLASS_NAMES_PATH, "w") as f:
    json.dump(class_names, f, indent=2)
print(f"Class names saved to {CLASS_NAMES_PATH}")

# Horizontal flip only (no vertical flip), small rotation, zoom, brightness & contrast jitter
data_augmentation = tf.keras.Sequential([
    layers.RandomFlip("horizontal"),
    layers.RandomRotation(0.1),
    layers.RandomZoom(0.1),
    layers.RandomBrightness(0.1),
    layers.RandomContrast(0.1),
], name="data_augmentation")

train_ds = train_ds.map(lambda x, y: (data_augmentation(x, training=True), y))

# GlobalAveragePooling2D replaces Flatten. Last conv layer is named 'conv2d_4' for Grad-CAM
model = models.Sequential([
    layers.Rescaling(1./255, input_shape=(128, 128, 3)),
    
    layers.Conv2D(32, (3, 3), activation='relu', name='conv2d_1'),
    layers.MaxPooling2D((2, 2)),
    
    layers.Conv2D(64, (3, 3), activation='relu', name='conv2d_2'),
    layers.MaxPooling2D((2, 2)),
    
    layers.Conv2D(128, (3, 3), activation='relu', name='conv2d_3'),
    layers.MaxPooling2D((2, 2)),
    
    layers.Conv2D(128, (3, 3), activation='relu', name='conv2d_4'),
    layers.MaxPooling2D((2, 2)),
    
    layers.GlobalAveragePooling2D(name='global_avg_pool'),
    layers.Dropout(0.4),
    layers.Dense(128, activation='relu', name='dense_1'),
    layers.Dense(1, activation='sigmoid', name='final_dense')
])

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
    loss='binary_crossentropy',
    metrics=['accuracy']
)

model.summary()

# EarlyStopping monitor val_loss, patience=3, restore_best_weights=True
early_stopping = EarlyStopping(
    monitor="val_loss",
    patience=3,
    restore_best_weights=True
)

epochs = int(os.environ.get("EPOCHS", 30))
print(f"\nTraining CNN model for up to {epochs} epochs (EarlyStopping patience=3)...")
history = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=epochs,
    callbacks=[early_stopping]
)

# Save the trained model in native .keras format (and also keep image_model.h5 fallback)
model.save(MODEL_SAVE_PATH)
print(f"\nSuccessfully saved trained CNN model to {MODEL_SAVE_PATH}")
# Also save .h5 for fallback compatibility if needed
h5_save_path = os.path.join("models", "image_model.h5")
try:
    model.save(h5_save_path)
    print(f"Fallback model also saved to {h5_save_path}")
except Exception as e:
    print(f"Note: Could not save .h5 fallback ({e}), .keras model is primary.")

# Evaluate on validation set
print("\n--- Evaluating on Validation Set ---")
y_true_list = []
y_pred_raw_list = []

for images, labels in val_ds:
    preds = model(images, training=False).numpy().flatten()
    y_true_list.extend(labels.numpy().flatten())
    y_pred_raw_list.extend(preds)

y_true = np.array(y_true_list)
y_pred_raw = np.array(y_pred_raw_list)

# In class_names (e.g. ['infected', 'noninfected']), class 0 is infected
# Raw model output is P(class 1) = P(noninfected)
infected_idx = class_names.index("infected") if "infected" in class_names else 0
y_true_infected = (y_true == infected_idx).astype(int)

if infected_idx == 0:
    y_prob_infected = 1.0 - y_pred_raw
else:
    y_prob_infected = y_pred_raw

y_pred_infected = (y_prob_infected >= 0.5).astype(int)

val_auc = float(roc_auc_score(y_true_infected, y_prob_infected))
val_precision = float(precision_score(y_true_infected, y_pred_infected, zero_division=0))
val_recall = float(recall_score(y_true_infected, y_pred_infected, zero_division=0))
val_f1 = float(f1_score(y_true_infected, y_pred_infected, zero_division=0))
cm = confusion_matrix(y_true_infected, y_pred_infected).tolist()

print(f"Validation AUC:       {val_auc:.4f}")
print(f"Validation Precision: {val_precision:.4f}")
print(f"Validation Recall:    {val_recall:.4f}")
print(f"Validation F1 Score:  {val_f1:.4f}")
print("Confusion Matrix (rows: true [normal, infected], cols: pred [normal, infected]):")
print(np.array(cm))

metrics = {
    "val_auc": val_auc,
    "val_precision": val_precision,
    "val_recall": val_recall,
    "val_f1": val_f1,
    "val_confusion_matrix": cm,
    "epochs_trained": len(history.history["loss"])
}

with open(METRICS_PATH, "w") as f:
    json.dump(metrics, f, indent=2)
print(f"Metrics saved to {METRICS_PATH}")
