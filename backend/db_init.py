#!/usr/bin/env python
"""
Database initialization and migration script.
Run this from backend/ directory.

Usage:
  python db_init.py init       # Initialize migrations folder
  python db_init.py migrate    # Create migration from current models
  python db_init.py upgrade    # Apply migrations to database
  python db_init.py downgrade  # Revert last migration
  python db_init.py reset      # Drop all tables and reinit (dev only)
"""



import os
import sys
from app import create_app, db
from flask_migrate import Migrate, MigrateCommand
from flask.cli import FlaskGroup

os.environ.setdefault("FLASK_ENV", "development")


def create_migrate_app(info=None):
    app = create_app()
    return app


if __name__ == "__main__":
    import click
    from flask.cli import with_appcontext

    app = create_app()
    migrate = Migrate(app, db)

    @app.cli.command()
    @with_appcontext
    def reset():
        """Drop all tables and recreate from models. WARNING: Deletes all data!"""
        confirm = input("⚠️  This will DELETE ALL DATA. Type 'yes' to confirm: ")
        if confirm.lower() == "yes":
            db.drop_all()
            db.create_all()
            click.echo("✅ Database reset complete.")
        else:
            click.echo("❌ Reset cancelled.")

    @app.cli.command()
    @with_appcontext
    def seed_demo():
        """Insert demo data for testing."""
        from app.models import User, ChatSession
        from datetime import datetime

        user = User(name="Demo User", email="demo@example.com", age=30, gender="other")
        user.set_password("DemoPass123")
        db.session.add(user)
        db.session.commit()
        click.echo(f"✅ Demo user created: {user.email}")

    # Run Flask CLI
    from flask_migrate import MigrateCommand
    cli = FlaskGroup(create_app=create_migrate_app)
    cli()
