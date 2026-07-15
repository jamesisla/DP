from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models import HealthCheck, User
from app.routers.auth import router as auth_router
from app.routers.health import router as health_router
from app.routers.matrix_catalog import router as matrix_catalog_router
from app.routers.modules import router as modules_router
from app.routers.reports import router as reports_router
from app.seed.modules import seed_module_data
from app.seed.users import seed_demo_user


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(auth_router, prefix="/api", tags=["auth"])
    app.include_router(health_router, prefix="/api", tags=["health"])
    app.include_router(matrix_catalog_router, prefix="/api")
    app.include_router(reports_router, prefix="/api")
    app.include_router(modules_router, prefix="/api")

    @app.get("/")
    def root() -> dict[str, str]:
        return {
            "service": settings.app_name,
            "status": "ok",
            "docs": "/docs",
            "health": "/api/health",
        }

    @app.get("/api")
    def api_root() -> dict[str, str]:
        return {"status": "ok", "health": "/api/health"}

    return app


app = create_app()


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_demo_user(db)
        seed_module_data(db)
    finally:
        db.close()
