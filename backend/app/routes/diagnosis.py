from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
import os

from ..extensions import db
from ..models import DiagnosisHistory, UploadedImage
from ..schemas.diagnosis_schema import TextDiagnosisSchema, ImageDiagnosisSchema, MultimodalDiagnosisSchema, DiagnosisHistorySchema
from ..ml.text_model import predict_text_symptoms
from ..ml.image_model import predict_image, preprocess_image
from ..ml.multimodal import fuse_results

diagnosis_bp = Blueprint("diagnosis_bp", __name__)


@diagnosis_bp.route("/text", methods=["POST"])
@jwt_required()
def text_diagnosis():
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    try:
        validated = TextDiagnosisSchema().load(data)
    except ValidationError as exc:
        return jsonify({"error": "Invalid input", "messages": exc.messages}), 400

    try:
        structured_symptoms = {
            "age": validated["age"],
            "gender": validated["gender"],
            "duration_days": validated["duration_days"],
            "severity": validated["severity"],
            "temperature": validated.get("temperature"),
            "pain_level": validated.get("pain_level"),
        }

        # Prepare input for model
        model_input = {
            "age": validated["age"],
            "gender": validated["gender"],
            "duration_days": validated["duration_days"],
            "severity": validated["severity"],
            "temperature": validated.get("temperature", 98.6),
            "pain_level": validated.get("pain_level", 0),
        }

        # predict using text model
        prediction = predict_text_symptoms(model_input)

        # advice based on confidence
        advice = "Consult a doctor for proper diagnosis and treatment." if prediction["confidence"] > 0.7 else "Monitor symptoms and seek medical advice if they persist."

        # save diagnosis history
        diagnosis = DiagnosisHistory(
            user_id=user_id,
            symptom_text=validated["symptom_text"],
            structured_symptoms_json=structured_symptoms,
            text_prediction=prediction,
            image_prediction=None,
            final_prediction=prediction.get("predicted_disease"),
            confidence_score=prediction.get("confidence"),
            advice=advice,
        )
        db.session.add(diagnosis)
        db.session.commit()

        return jsonify({
            "diagnosis_id": diagnosis.id,
            "prediction": prediction,
            "advice": advice,
            "disclaimer": "This is for educational purposes only and does not replace professional medical advice.",
        }), 201

    except FileNotFoundError:
        return jsonify({"error": "Text model not trained yet. Please train the model first."}), 503
    except Exception as exc:
        db.session.rollback()
        return jsonify({"error": "Text diagnosis failed", "detail": str(exc)}), 500


@diagnosis_bp.route("/image", methods=["POST"])
@jwt_required()
def image_diagnosis():
    user_id = get_jwt_identity()

    if "file" not in request.files:
        return jsonify({"error": "Image file required"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    allowed_ext = {"jpg", "jpeg", "png"}
    if not ("." in file.filename and file.filename.rsplit(".", 1)[1].lower() in allowed_ext):
        return jsonify({"error": "Only JPG and PNG files allowed"}), 400

    try:
        upload_dir = os.getenv("UPLOAD_FOLDER", "backend/app/static/uploads")
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, f"{user_id}_{file.filename}")
        file.save(file_path)

        # predict using image model
        prediction = predict_image(file_path)

        # Map class index to disease name if mapping available
        disease_map = {0: "Normal", 1: "Mild Condition", 2: "Severe Condition"}
        predicted_disease = disease_map.get(prediction["predicted_class_index"], "Unknown")
        prediction["predicted_disease"] = predicted_disease

        advice = "Consult a medical professional for detailed analysis." if prediction["confidence"] > 0.7 else "Image quality may affect accuracy. Please consult a doctor."

        # save upload and create diagnosis entry if needed
        uploaded = UploadedImage(
            user_id=user_id,
            image_path=file_path,
            image_type=request.form.get("image_type", "general"),
            processed_status="completed",
        )
        db.session.add(uploaded)
        db.session.flush()

        diagnosis = DiagnosisHistory(
            user_id=user_id,
            symptom_text="Image-based diagnosis",
            structured_symptoms_json={},
            text_prediction=None,
            image_prediction=prediction,
            final_prediction=predicted_disease,
            confidence_score=prediction["confidence"],
            advice=advice,
        )
        diagnosis.uploaded_images.append(uploaded)
        db.session.add(diagnosis)
        db.session.commit()

        return jsonify({
            "diagnosis_id": diagnosis.id,
            "prediction": prediction,
            "advice": advice,
            "disclaimer": "This is for educational purposes only and does not replace professional medical advice.",
        }), 201

    except FileNotFoundError:
        return jsonify({"error": "Image model not trained yet. Please train the model first."}), 503
    except Exception as exc:
        db.session.rollback()
        return jsonify({"error": "Image diagnosis failed", "detail": str(exc)}), 500


@diagnosis_bp.route("/multimodal", methods=["POST"])
@jwt_required()
def multimodal_diagnosis():
    user_id = get_jwt_identity()
    data = request.form or {}
    file = request.files.get("file")

    try:
        validated = MultimodalDiagnosisSchema().load(data)
    except ValidationError as exc:
        return jsonify({"error": "Invalid input", "messages": exc.messages}), 400

    try:
        # text diagnosis
        model_input = {
            "age": validated["age"],
            "gender": validated["gender"],
            "duration_days": validated["duration_days"],
            "severity": validated["severity"],
            "temperature": validated.get("temperature", 98.6),
            "pain_level": validated.get("pain_level", 0),
        }
        text_pred = predict_text_symptoms(model_input)

        image_pred = None
        uploaded = None

        # image diagnosis if provided
        if file and file.filename:
            upload_dir = os.getenv("UPLOAD_FOLDER", "backend/app/static/uploads")
            os.makedirs(upload_dir, exist_ok=True)
            file_path = os.path.join(upload_dir, f"{user_id}_{file.filename}")
            file.save(file_path)

            image_pred = predict_image(file_path)
            disease_map = {0: "Normal", 1: "Mild Condition", 2: "Severe Condition"}
            image_pred["predicted_disease"] = disease_map.get(image_pred["predicted_class_index"], "Unknown")

            uploaded = UploadedImage(
                user_id=user_id,
                image_path=file_path,
                image_type=validated.get("image_type", "general"),
                processed_status="completed",
            )
            db.session.add(uploaded)

        # fuse both predictions
        fused = fuse_results(text_result=text_pred, image_result=image_pred)
        advice = f"Prediction: {fused['final_prediction']} (Confidence: {fused['final_score']:.2%}). Consult a doctor for proper evaluation."

        structured_symptoms = {
            "age": validated["age"],
            "gender": validated["gender"],
            "duration_days": validated["duration_days"],
            "severity": validated["severity"],
            "temperature": validated.get("temperature"),
            "pain_level": validated.get("pain_level"),
        }

        diagnosis = DiagnosisHistory(
            user_id=user_id,
            symptom_text=validated["symptom_text"],
            structured_symptoms_json=structured_symptoms,
            text_prediction=text_pred,
            image_prediction=image_pred,
            final_prediction=fused["final_prediction"],
            confidence_score=fused["final_score"],
            advice=advice,
        )

        if uploaded:
            diagnosis.uploaded_images.append(uploaded)

        db.session.add(diagnosis)
        db.session.commit()

        return jsonify({
            "diagnosis_id": diagnosis.id,
            "text_prediction": text_pred,
            "image_prediction": image_pred,
            "fused_result": fused,
            "advice": advice,
            "disclaimer": "This is for educational purposes only and does not replace professional medical advice.",
        }), 201

    except Exception as exc:
        db.session.rollback()
        return jsonify({"error": "Multimodal diagnosis failed", "detail": str(exc)}), 500


@diagnosis_bp.route("/history", methods=["GET"])
@jwt_required()
def history():
    user_id = get_jwt_identity()
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)

    diagnoses = DiagnosisHistory.query.filter_by(user_id=user_id).order_by(DiagnosisHistory.created_at.desc()).paginate(page=page, per_page=limit)

    results = [d.to_dict() for d in diagnoses.items]
    return jsonify({
        "data": results,
        "total": diagnoses.total,
        "pages": diagnoses.pages,
        "current_page": page,
    }), 200


@diagnosis_bp.route("/history/<int:diagnosis_id>", methods=["GET"])
@jwt_required()
def history_detail(diagnosis_id):
    user_id = get_jwt_identity()
    diagnosis = DiagnosisHistory.query.filter_by(id=diagnosis_id, user_id=user_id).first()

    if not diagnosis:
        return jsonify({"error": "Diagnosis not found"}), 404

    return jsonify({"data": diagnosis.to_dict()}), 200
