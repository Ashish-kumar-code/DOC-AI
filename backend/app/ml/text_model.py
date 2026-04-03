import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

MODEL_PATH = os.getenv("TEXT_MODEL_PATH", "backend/app/ml/text_model.joblib")


def load_symptom_dataset(csv_path):
    df = pd.read_csv(csv_path)
    if "disease" not in df.columns:
        raise ValueError("Dataset must include disease label")
    return df


def build_pipeline():
    numeric_features = ["age", "duration_days", "temperature", "pain_level"]
    categorical_features = ["gender", "severity"]

    numeric_transformer = Pipeline([
        ("scaler", StandardScaler()),
    ])

    categorical_transformer = Pipeline([
        ("encoder", OneHotEncoder(handle_unknown="ignore")),
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, numeric_features),
            ("cat", categorical_transformer, categorical_features),
        ],
        remainder="drop",
    )

    model_pipeline = Pipeline(
        [
            ("preprocess", preprocessor),
            ("classifier", LogisticRegression(max_iter=500)),
        ]
    )

    return model_pipeline


def evaluate_and_select_model(X_train, X_test, y_train, y_test):
    models = {
        "LogisticRegression": LogisticRegression(max_iter=500),
        "DecisionTree": DecisionTreeClassifier(random_state=42),
        "RandomForest": RandomForestClassifier(n_estimators=100, random_state=42),
        "NaiveBayes": GaussianNB(),
    }

    results = {}
    for name, clf in models.items():
        pipe = Pipeline(
            [
                ("scaler", StandardScaler()),
                ("classifier", clf),
            ]
        )
        pipe.fit(X_train, y_train)
        preds = pipe.predict(X_test)
        score = accuracy_score(y_test, preds)
        results[name] = {
            "score": score,
            "model": pipe,
            "report": classification_report(y_test, preds, output_dict=True),
            "confusion_matrix": confusion_matrix(y_test, preds).tolist(),
        }

    best_name = max(results, key=lambda k: results[k]["score"])
    return best_name, results[best_name]


def train_text_model(csv_path= "datasets/symptom_dataset.csv"):
    df = load_symptom_dataset(csv_path)
    # required columns: age, gender, duration_days, severity, temperature, pain_level, disease
    df = df.dropna(subset=["disease"])

    X = df[["age", "gender", "duration_days", "severity", "temperature", "pain_level"]]
    y = df["disease"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    best_name, best_result = evaluate_and_select_model(X_train, X_test, y_train, y_test)

    # save best pipeline model
    best_model = best_result["model"]
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(best_model, MODEL_PATH)

    return {
        "best_model": best_name,
        "accuracy": best_result["score"],
        "report": best_result["report"],
        "confusion_matrix": best_result["confusion_matrix"],
    }


def predict_text_symptoms(input_data):
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError("Text model file not found. Train using train_text_model() first.")

    model = joblib.load(MODEL_PATH)
    df = pd.DataFrame([input_data])
    preds = model.predict(df)
    prob = model.predict_proba(df).max(axis=1).tolist()

    return {
        "predicted_disease": preds[0],
        "confidence": float(prob[0]),
    }
