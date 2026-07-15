from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User


def seed_demo_user(db: Session) -> None:
    exists = db.query(User).filter(User.email == "admin@patagua.cl").first()
    if exists:
        return

    db.add(
        User(
            email="admin@patagua.cl",
            full_name="Administrador Patagua",
            role="Administrador",
            hashed_password=get_password_hash("admin123"),
        )
    )
    db.commit()
