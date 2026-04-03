import os
import numpy as np
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from PIL import Image

MODEL_PATH = os.getenv("IMAGE_MODEL_PATH", "backend/app/ml/image_model.h5")


def build_cnn_model(input_shape=(128, 128, 3), num_classes=3):
    inputs = keras.Input(shape=input_shape)
    x = layers.Rescaling(1.0 / 255)(inputs)

    x = layers.Conv2D(32, 3, activation="relu", padding="same")(x)
    x = layers.MaxPooling2D(2)(x)
    x = layers.Conv2D(64, 3, activation="relu", padding="same")(x)
    x = layers.MaxPooling2D(2)(x)
    x = layers.Conv2D(128, 3, activation="relu", padding="same")(x)
    x = layers.MaxPooling2D(2)(x)

    x = layers.Flatten()(x)
    x = layers.Dense(128, activation="relu")(x)
    x = layers.Dropout(0.5)(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)

    model = keras.Model(inputs=inputs, outputs=outputs, name="basic_cnn")
    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def train_image_model(train_dir, val_dir, num_classes, epochs=10, batch_size=32, save_path=None):
    if save_path is None:
        save_path = MODEL_PATH

    train_ds = keras.preprocessing.image_dataset_from_directory(
        train_dir,
        labels="inferred",
        label_mode="int",
        image_size=(128, 128),
        batch_size=batch_size,
        shuffle=True,
    )

    val_ds = keras.preprocessing.image_dataset_from_directory(
        val_dir,
        labels="inferred",
        label_mode="int",
        image_size=(128, 128),
        batch_size=batch_size,
        shuffle=False,
    )

    model = build_cnn_model(input_shape=(128, 128, 3), num_classes=num_classes)
    history = model.fit(train_ds, validation_data=val_ds, epochs=epochs)

    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    model.save(save_path)

    return {
        "training_history": history.history,
        "model_path": save_path,
    }


def preprocess_image(file_path, target_size=(128, 128)):
    img = Image.open(file_path).convert("RGB")
    img = img.resize(target_size)
    arr = np.array(img) / 255.0
    arr = np.expand_dims(arr, axis=0)
    return arr


def predict_image(file_path):
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError("Image model file not found. Train using train_image_model() first.")

    model = load_model(MODEL_PATH)
    arr = preprocess_image(file_path)
    preds = model.predict(arr)
    class_idx = int(np.argmax(preds, axis=1)[0])
    confidence = float(np.max(preds, axis=1)[0])

    return {
        "predicted_class_index": class_idx,
        "confidence": confidence,
    }
