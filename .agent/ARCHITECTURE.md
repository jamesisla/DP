# 🏛️ LexApp GRC — Arquitectura y Topología

## 🌐 Visión General
Plataforma unificada de Gobernanza, Riesgo y Cumplimiento (GRC) para el sector público y privado chileno, estructurada en dos suites simétricas:
1. **Protección de Datos (Ley N° 21.719)**: Plazo ARCO+ 15 días, Brechas 72h, RAT, EIPD, DPA.
2. **Ciberseguridad & ANCI (Ley N° 21.663)**: Alerta 3h, RSIC/OIV, Protocolo Forense, War Games, Canal CVD.

---

## 📂 Mapa del Repositorio
```
DP/
├── .agent/                      # Memoria y reglas de la IA (RULES, STATE, ARCHITECTURE)
├── backend/
│   ├── app/
│   │   ├── main.py              # Entrypoint FastAPI y montaje de routers
│   │   ├── core/                # Configuración, base de datos y logging
│   │   ├── models/domain.py     # Modelos SQLAlchemy unificados
│   │   ├── schemas/domain.py    # Validación Pydantic v2
│   │   └── routers/             # audit, cybersecurity, documents, gateways
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/Shell.jsx # Navegación global conmutada
│   │   ├── pages/               # Vistas de Protección de Datos
│   │   └── pages/cyber/         # Vistas de Ciberseguridad ANCI
│   └── package.json
├── presentacion/                # Documentación ejecutiva y guías de pruebas
└── scripts/
    ├── dev.sh                   # Iniciar desarrollo local
    ├── stop.sh                  # Detener servicios locales
    └── update-and-rebuild.sh    # Actualización en servidor OCI
```

---

## 🔗 Entidades Principales
* `User`, `ProjectTask`, `TreatmentRecord` (RAT), `RiskAssessment` (5x5), `ThirdPartyDPA`.
* `ArcoRequest` (15d SLA), `SecurityBreach` (72h SLA), `CriticalAssetRSIC` (ANCI Art. 8).
* `CyberIncident` (3h SLA), `WarGameSimulation`, `CvdReport` (Art. 12).
