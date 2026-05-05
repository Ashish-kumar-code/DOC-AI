"""
DOC AI - Medical Image Classification Model
Uses Transfer Learning with MobileNetV2 for better performance.
"""

import os
import numpy as np
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from PIL import Image
import logging

logger = logging.getLogger(__name__)

MODEL_PATH = os.getenv("IMAGE_MODEL_PATH", "app/ml/image_model.h5")

# Class labels (you can expand this later)
CLASS_NAMES = ['Normal', 'Pneumonia']


def build_image_model(num_classes=2):
    """Build model using MobileNetV2 transfer learning - optimized for medical images"""
    base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
    base_model.trainable = False  # Freeze base layers initially

    model = keras.Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        layers.Dense(256, activation='relu'),
        layers.Dropout(0.2),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.1),
        layers.Dense(num_classes, activation='softmax')
    ])

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    return model


def train_image_model(train_dir, val_dir=None, num_classes=2, epochs=10, batch_size=16, save_path=None):
    """Train image model using transfer learning with automatic validation split"""
    if save_path is None:
        save_path = MODEL_PATH

    # Use ImageDataGenerator with validation_split
    train_datagen = keras.preprocessing.image.ImageDataGenerator(
        preprocessing_function=preprocess_input,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True,
        validation_split=0.2   # 20% of train will be used for validation
    )

    train_generator = train_datagen.flow_from_directory(
        train_dir,
        target_size=(224, 224),
        batch_size=batch_size,
        class_mode='sparse',
        subset='training',
        shuffle=True
    )

    val_generator = train_datagen.flow_from_directory(
        train_dir,   # Use same train dir for validation split
        target_size=(224, 224),
        batch_size=batch_size,
        class_mode='sparse',
        subset='validation',
        shuffle=False
    )

    model = build_image_model(num_classes)

    print(f"Training on {train_generator.samples} images, validating on {val_generator.samples} images")

    history = model.fit(
        train_generator,
        validation_data=val_generator,
        epochs=epochs,
        verbose=1
    )

    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    model.save(save_path)

    logger.info(f"✅ Image model trained and saved to {save_path}")
    return {
        "status": "trained",
        "model_path": save_path,
        "history": history.history,
        "train_samples": train_generator.samples,
        "val_samples": val_generator.samples
    }


def predict_image(file_path):
    """Predict class from uploaded medical image"""
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError("Image model not found. Train the model first.")

    try:
        model = load_model(MODEL_PATH)
        
        # Preprocess image
        img = Image.open(file_path).convert("RGB")
        img = img.resize((224, 224))
        img_array = keras.preprocessing.image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = preprocess_input(img_array)

        preds = model.predict(img_array)
        class_idx = int(np.argmax(preds, axis=1)[0])
        confidence = float(np.max(preds, axis=1)[0]) * 100

        return {
            "predicted_class": CLASS_NAMES[class_idx],
            "class_index": class_idx,
            "confidence": round(confidence, 2),
            "all_probabilities": {CLASS_NAMES[i]: round(float(preds[0][i])*100, 2) for i in range(len(CLASS_NAMES))}
        }

    except Exception as e:
        logger.error(f"Image prediction error: {e}")
        return {"error": str(e)}