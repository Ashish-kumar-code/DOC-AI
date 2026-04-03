import os
from dotenv import load_dotenv

load_dotenv()

TEXT_WEIGHT = float(os.getenv("TEXT_WEIGHT", 0.6))
IMAGE_WEIGHT = float(os.getenv("IMAGE_WEIGHT", 0.4))


def fuse_results(text_result=None, image_result=None, text_weight=TEXT_WEIGHT, image_weight=IMAGE_WEIGHT):
    result = {
        "text_result": text_result,
        "image_result": image_result,
        "final_prediction": None,
        "final_score": 0.0,
        "method": ""
    }

    # fallback
    if text_result is None and image_result is None:
        raise ValueError("At least one of text_result or image_result must be provided")

    if text_result is None:
        result["final_prediction"] = image_result.get("predicted_disease") or image_result.get("predicted_class_index")
        result["final_score"] = image_result.get("confidence", 0.0)
        result["method"] = "image_only"
        return result

    if image_result is None:
        result["final_prediction"] = text_result.get("predicted_disease")
        result["final_score"] = text_result.get("confidence", 0.0)
        result["method"] = "text_only"
        return result

    text_conf = float(text_result.get("confidence", 0.0))
    image_conf = float(image_result.get("confidence", 0.0))

    combined_score = text_weight * text_conf + image_weight * image_conf

    # choose final prediction by higher confidence with weighted bias
    if text_conf >= image_conf:
        fused_label = text_result.get("predicted_disease")
    else:
        fused_label = image_result.get("predicted_disease", image_result.get("predicted_class_index"))

    result.update(
        {
            "final_prediction": fused_label,
            "final_score": float(combined_score),
            "method": "weighted_fusion",
            "text_confidence": text_conf,
            "image_confidence": image_conf,
        }
    )

    return result
