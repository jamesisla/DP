from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.routes import router
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.seed import seed_initial_data


def auto_migrate_sqlite() -> None:
    if settings.database_url.startswith("sqlite"):
        with engine.connect() as conn:
            try:
                res = conn.execute(text("PRAGMA table_info(users)")).fetchall()
                columns = [row[1] for row in res]
                if columns:
                    if "rut" not in columns:
                        conn.execute(text("ALTER TABLE users ADD COLUMN rut VARCHAR(20)"))
                    if "cargo" not in columns:
                        conn.execute(text("ALTER TABLE users ADD COLUMN cargo VARCHAR(160)"))
                    if "clave_unica_token" not in columns:
                        conn.execute(text("ALTER TABLE users ADD COLUMN clave_unica_token VARCHAR(255)"))
                    conn.commit()
            except Exception as e:
                print(f"[auto_migrate] Notice: {e}")


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(router, prefix="/api")
    return app


app = create_app()


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    auto_migrate_sqlite()
    db = SessionLocal()
    try:
        seed_initial_data(db)
    except Exception as e:
        print(f"[startup] Seed notice: {e}")
    finally:
        db.close()
