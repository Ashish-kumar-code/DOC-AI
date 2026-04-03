import os
from app import create_app, db
from app.models import User, DiagnosisHistory, ChatSession, UploadedImage, NearbySearchCache

if __name__ == "__main__":
    app = create_app()

    with app.app_context():
        print("📊 Database Models Summary")
        print("=" * 50)

        models = [
            ("User", User),
            ("DiagnosisHistory", DiagnosisHistory),
            ("UploadedImage", UploadedImage),
            ("ChatSession", ChatSession),
            ("NearbySearchCache", NearbySearchCache),
        ]

        for model_name, model_class in models:
            count = db.session.query(model_class).count()
            print(f"  {model_name}: {count} records")

        print("\n✅ Database connection successful!")
        print("🔧 Models loaded and ready for use.")
