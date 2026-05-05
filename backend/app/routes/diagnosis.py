"""
Diagnosis Routes - Text, Image & Multimodal Diagnosis
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
import os
import time  # ← This was missing (causing the error)

from ..extensions import db
from ..models import DiagnosisHistory, UploadedImage
from ..schemas.diagnosis_schema import (
    TextDiagnosisSchema, 
    ImageDiagnosisSchema, 
    MultimodalDiagnosisSchema, 
    DiagnosisHistorySchema
)
from ..ml.text_model import predict_text_symptoms
from ..ml.image_model import predict_image
from ..ml.multimodal import fuse_results

# Free OSM + Overpass API
from ..utils.nearby_facilities import get_nearby_medical_facilities, get_user_location_from_ip

from app.utils.logger import (
    get_logger, 
    ErrorLogger, 
    Timer
)

diagnosis_bp = Blueprint("diagnosis_bp", __name__)
logger = get_logger(__name__)


@diagnosis_bp.route("/text", methods=["POST"])
@jwt_required()
def text_diagnosis():
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    try:
        validated = TextDiagnosisSchema().load(data)
    except ValidationError as exc:
        ErrorLogger.log_validation_error("symptoms", str(data), str(exc.messages))
        return jsonify({"error": "Invalid input", "messages": exc.messages}), 400

    with Timer("text_diagnosis"):
        try:
            model_input = {
                "age": validated["age"],
                "gender": validated["gender"],
                "duration_days": validated["duration_days"],
                "severity": validated["severity"],
                "temperature": validated.get("temperature", 98.6),
                "pain_level": validated.get("pain_level", 0),
            }

            prediction = predict_text_symptoms(model_input)

            advice = (
                "Consult a doctor for proper diagnosis and treatment."
                if prediction.get("confidence", 0) > 0.7
                else "Monitor symptoms and seek medical advice if they persist."
            )

            diagnosis = DiagnosisHistory(
                user_id=user_id,
                symptom_text=validated.get("symptom_text", ""),
                structured_symptoms_json=validated,
                text_prediction=prediction,
                image_prediction=None,
                final_prediction=prediction.get("predicted_disease"),
                confidence_score=prediction.get("confidence", 0.0),
                advice=advice,
            )
            db.session.add(diagnosis)
            db.session.commit()

            return jsonify({
                "diagnosis_id": diagnosis.id,
                "prediction": prediction,
                "advice": advice,
                "disclaimer": "This is for educational purposes only. Not a substitute for professional medical advice.",
            }), 201

        except FileNotFoundError:
            return jsonify({"error": "Text model not trained yet. Please train the model first."}), 503
        except Exception as exc:
            db.session.rollback()
            ErrorLogger.log_error(exc, context="text_diagnosis", user_id=user_id)
            logger.error(f"Text diagnosis failed for user {user_id}: {exc}")
            return jsonify({"error": "Text diagnosis failed", "detail": str(exc)}), 500


@diagnosis_bp.route("/image", methods=["POST"])
@jwt_required()
def image_diagnosis():
    user_id = get_jwt_identity()

    if "file" not in request.files:
        return jsonify({"error": "Image file required"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "No file selected"}), 400

    allowed_ext = {"jpg", "jpeg", "png"}
    ext = file.filename.rsplit(".", 1)[1].lower() if "." in file.filename else ""
    if ext not in allowed_ext:
        return jsonify({"error": "Only JPG, JPEG and PNG files allowed"}), 400

    file_path = None
    with Timer("image_diagnosis"):
        try:
            upload_dir = os.getenv("UPLOAD_FOLDER", "backend/app/static/uploads")
            os.makedirs(upload_dir, exist_ok=True)
            
            # Unique filename to avoid collisions
            file_path = os.path.join(upload_dir, f"{user_id}_{int(time.time())}_{file.filename}")
            file.save(file_path)

            prediction = predict_image(file_path)

            disease_map = {0: "Normal", 1: "Mild Condition", 2: "Severe Condition"}
            predicted_disease = prediction.get("predicted_class", "Unknown")
            prediction["predicted_disease"] = predicted_disease

            advice = (
                "Consult a medical professional for detailed analysis."
                if prediction.get("confidence", 0) > 0.7
                else "Image quality may affect accuracy. Please consult a doctor."
            )

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
                confidence_score=prediction.get("confidence", 0.0),
                advice=advice,
            )
            diagnosis.uploaded_images.append(uploaded)
            db.session.add(diagnosis)
            db.session.commit()

            return jsonify({
                "diagnosis_id": diagnosis.id,
                "prediction": prediction,
                "advice": advice,
                "disclaimer": "This is for educational purposes only. Not a substitute for professional medical advice.",
            }), 201

        except FileNotFoundError:
            return jsonify({"error": "Image model not trained yet. Please train the model first."}), 503
        except Exception as exc:
            db.session.rollback()
            ErrorLogger.log_error(exc, context="image_diagnosis", user_id=user_id)
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except:
                    pass
            return jsonify({"error": "Image diagnosis failed", "detail": str(exc)}), 500


@diagnosis_bp.route("/multimodal", methods=["POST"])
@jwt_required()
def multimodal_diagnosis():
    user_id = get_jwt_identity()
    data = request.form.to_dict() if request.form else {}
    file = request.files.get("file")

    try:
        validated = MultimodalDiagnosisSchema().load(data)
    except ValidationError as exc:
        ErrorLogger.log_validation_error("multimodal_input", str(data), str(exc.messages))
        return jsonify({"error": "Invalid input", "messages": exc.messages}), 400

    file_path = None
    with Timer("multimodal_diagnosis"):
        try:
            # Text Prediction
            model_input = {
                "age": validated["age"],
                "gender": validated["gender"],
                "duration_days": validated["duration_days"],
                "severity": validated["severity"],
                "temperature": validated.get("temperature", 98.6),
                "pain_level": validated.get("pain_level", 0),
                "symptom_text": validated.get("symptom_text", "")
            }
            text_pred = predict_text_symptoms(model_input)

            # Image Prediction (if file uploaded)
            image_pred = None
            uploaded = None

            if file and file.filename:
                upload_dir = os.getenv("UPLOAD_FOLDER", "app/static/uploads")
                os.makedirs(upload_dir, exist_ok=True)
                file_path = os.path.join(upload_dir, f"{user_id}_{int(time.time())}_{file.filename}")
                file.save(file_path)

                image_pred = predict_image(file_path)

                # Clean up image prediction
                if "predicted_class" in image_pred:
                    image_pred["predicted_disease"] = image_pred["predicted_class"]

                uploaded = UploadedImage(
                    user_id=user_id,
                    image_path=file_path,
                    image_type=validated.get("image_type", "general"),
                    processed_status="completed",
                )
                db.session.add(uploaded)
                db.session.flush()

            # Fuse results
            fused = fuse_results(text_result=text_pred, image_result=image_pred)

            # Improved Advice Generation
            final_disease = fused.get("final_prediction", "Unknown Condition")
            final_conf = fused.get("final_confidence", 0.0)

            if final_conf >= 75:
                advice = f"High confidence assessment suggests {final_disease}. Please consult a doctor as soon as possible for confirmation and treatment."
            elif final_conf >= 50:
                advice = f"Moderate confidence for {final_disease}. It is recommended to seek medical evaluation."
            else:
                advice = f"Preliminary assessment indicates possible {final_disease} with low confidence ({final_conf:.1f}%). Further clinical evaluation is strongly advised."

            # Create Diagnosis Record
            diagnosis = DiagnosisHistory(
                user_id=user_id,
                symptom_text=validated.get("symptom_text", "Multimodal diagnosis"),
                structured_symptoms_json=validated,
                text_prediction=text_pred,
                image_prediction=image_pred,
                final_prediction=final_disease,
                confidence_score=final_conf,
                advice=advice,
            )

            if uploaded:
                diagnosis.uploaded_images.append(uploaded)

            db.session.add(diagnosis)
            db.session.commit()

            # Clean response
            return jsonify({
                "success": True,
                "diagnosis_id": diagnosis.id,
                "final_diagnosis": {
                    "disease": final_disease,
                    "confidence": final_conf,
                    "method": fused.get("method", "unknown")
                },
                "text_prediction": text_pred,
                "image_prediction": image_pred,
                "fused_result": fused,
                "advice": advice,
                "disclaimer": "This is an AI-assisted preliminary assessment for educational purposes only. It is not a substitute for professional medical advice. Always consult a qualified doctor."
            }), 201

        except Exception as exc:
            db.session.rollback()
            ErrorLogger.log_error(exc, context="multimodal_diagnosis", user_id=user_id)
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except:
                    pass
            return jsonify({"error": "Multimodal diagnosis failed", "detail": str(exc)}), 500
        
# ====================== NEW FREE NEARBY FACILITIES ENDPOINT ======================
@diagnosis_bp.route("/nearby-facilities", methods=["GET"])
@jwt_required()
def nearby_facilities():
    """Get nearby hospitals/clinics using free OpenStreetMap Overpass API."""
    try:
        lat = request.args.get("lat", type=float)
        lon = request.args.get("lon", type=float)
        radius = request.args.get("radius", 5000, type=int)

        if not lat or not lon:
            location = get_user_location_from_ip()
            lat = location.get("latitude")
            lon = location.get("longitude")

        if not lat or not lon:
            return jsonify({"error": "Location (lat/lon) is required"}), 400

        facilities = get_nearby_medical_facilities(lat, lon, radius=radius)

        return jsonify({
            "success": True,
            "facilities": facilities,
            "count": len(facilities),
            "source": "OpenStreetMap Overpass API (Completely Free)",
            "message": "Data is community contributed. Accuracy may vary."
        }), 200

    except Exception as exc:
        ErrorLogger.log_error(exc, context="nearby_facilities")
        return jsonify({"error": "Failed to fetch nearby facilities", "detail": str(exc)}), 500


# History Routes
@diagnosis_bp.route("/history", methods=["GET"])
@jwt_required()
def history():
    user_id = get_jwt_identity()
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)

    diagnoses = DiagnosisHistory.query.filter_by(user_id=user_id)\
        .order_by(DiagnosisHistory.created_at.desc())\
        .paginate(page=page, per_page=limit, error_out=False)

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