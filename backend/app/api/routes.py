from fastapi import APIRouter

from app.routers.arco import router as arco_router
from app.routers.areas import router as areas_router
from app.routers.audit import router as audit_router
from app.routers.auth import router as auth_router
from app.routers.breaches import router as breaches_router
from app.routers.cybersecurity import router as cyber_router
from app.routers.dashboard import router as dashboard_router
from app.routers.documents import router as documents_router
from app.routers.legacy import router as legacy_router
from app.routers.matrix import router as matrix_router
from app.routers.projects import router as projects_router
from app.routers.providers import router as providers_router
from app.routers.risks import router as risks_router
from app.routers.users import router as users_router

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "app": "SIGE-DP & Ciberseguridad ANCI", "version": "2.0.0"}


# Include modular routers
router.include_router(auth_router)
router.include_router(dashboard_router)
router.include_router(projects_router)
router.include_router(areas_router)
router.include_router(users_router)
router.include_router(matrix_router)
router.include_router(risks_router)
router.include_router(documents_router)
router.include_router(providers_router)
router.include_router(arco_router)
router.include_router(breaches_router)
router.include_router(audit_router)
router.include_router(legacy_router)

# Ley 21.663 - Cybersecurity & ANCI
router.include_router(cyber_router)
