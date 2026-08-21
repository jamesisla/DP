from datetime import date, datetime
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.domain import (
    ArcoRequest,
    Area,
    CaseTicket,
    Comentario,
    Consent,
    CyberAsset,
    CyberFase,
    CyberIncidentANCI,
    CyberMaturityAssessment,
    CyberPolicy,
    CyberProject,
    CyberRisk,
    CyberSimulation,
    CyberTarea,
    Documento,
    Fase,
    Finding,
    FlujoAprobacion,
    ImpactAssessment,
    ImplementationProject,
    LogAuditoria,
    MatrizLevantamiento,
    Proveedor,
    Riesgo,
    SecurityBreach,
    Tarea,
    TrainingCampaign,
    TreatmentActivity,
    User,
)


def seed_initial_data(db: Session) -> None:
    # 1. Seed Areas first (without responsable_id initially to avoid cyclic dependency constraint)
    areas_data = {
        "Tecnología de la Información": "Gestión del soporte tecnológico, infraestructura, bases de datos y seguridad de la información.",
        "Legal y Cumplimiento": "Asesoría legal, revisión de contratos, convenios y gestión de derechos ARCO.",
        "Gestión de Personas": "Administración del personal, remuneraciones, capacitaciones y bienestar interno.",
        "Atención Ciudadana": "Gestión de solicitudes de información, reclamaciones y contacto con el público general."
    }
    
    db_areas = {}
    for nombre, desc in areas_data.items():
        area = db.query(Area).filter(Area.nombre == nombre).first()
        if not area:
            area = Area(nombre=nombre, descripcion=desc)
            db.add(area)
            db.flush()
        db_areas[nombre] = area

    # 2. Seed Users
    users_data = [
        {
            "email": "admin@protecciondatos.cl",
            "full_name": "DPO Demo",
            "role": "Encargado/a Responsable",
            "password": "admin123",
            "area": "Legal y Cumplimiento",
            "rut": "14.567.890-1",
            "cargo": "Delegado de Protección de Datos (DPO)"
        },
        {
            "email": "jefe@protecciondatos.cl",
            "full_name": "Jefe de Servicio",
            "role": "Jefe de Servicio",
            "password": "admin123",
            "area": "Legal y Cumplimiento",
            "rut": "10.234.567-8",
            "cargo": "Director Nacional / Jefe de Servicio"
        },
        {
            "email": "ti@protecciondatos.cl",
            "full_name": "Responsable de TI",
            "role": "Responsable de Área",
            "password": "admin123",
            "area": "Tecnología de la Información",
            "rut": "16.789.012-3",
            "cargo": "Jefe del Departamento de Tecnología"
        },
        {
            "email": "legal@protecciondatos.cl",
            "full_name": "Responsable Legal",
            "role": "Responsable de Área",
            "password": "admin123",
            "area": "Legal y Cumplimiento",
            "rut": "15.345.678-9",
            "cargo": "Jefe de la División Jurídica"
        },
        {
            "email": "comite@protecciondatos.cl",
            "full_name": "Comité Ejecutivo",
            "role": "Comité Ejecutivo",
            "password": "admin123",
            "area": "Legal y Cumplimiento",
            "rut": "12.456.789-0",
            "cargo": "Coordinador de Cumplimiento / Control de Gestión"
        },
        {
            "email": "invitado@protecciondatos.cl",
            "full_name": "Funcionario Observador",
            "role": "Invitado/Colaborador",
            "password": "admin123",
            "area": "Atención Ciudadana",
            "rut": "18.901.234-5",
            "cargo": "Analista Técnico de Atención Ciudadana"
        }
    ]

    db_users = {}
    for ud in users_data:
        user = db.query(User).filter(User.email == ud["email"]).first()
        if not user:
            area_obj = db_areas[ud["area"]]
            user = User(
                email=ud["email"],
                full_name=ud["full_name"],
                role=ud["role"],
                hashed_password=get_password_hash(ud["password"]),
                area_id=area_obj.id,
                rut=ud["rut"],
                cargo=ud["cargo"]
            )
            db.add(user)
            db.flush()
        db_users[ud["email"]] = user

    # 3. Update Area Responsables
    db_areas["Tecnología de la Información"].responsable_id = db_users["ti@protecciondatos.cl"].id
    db_areas["Legal y Cumplimiento"].responsable_id = db_users["legal@protecciondatos.cl"].id
    db_areas["Gestión de Personas"].responsable_id = db_users["admin@protecciondatos.cl"].id
    db_areas["Atención Ciudadana"].responsable_id = db_users["invitado@protecciondatos.cl"].id
    db.flush()

    # 4. Seed Implementation Projects
    project = db.query(ImplementationProject).filter(ImplementationProject.name == "Implementación Ley 21.719").first()
    if not project:
        project = ImplementationProject(
            name="Implementación Ley 21.719",
            stage="Levantamiento",
            progress=28,
            owner="DPO Demo",
            summary="Proyecto principal para la adecuación y cumplimiento con la Ley de Protección de Datos Personales en el Servicio Público.",
            fecha_inicio=date(2025, 12, 1),
            fecha_fin=date(2026, 12, 1),
            estado="Activo"
        )
        db.add(project)
        db.flush()

    # 5. Seed Fases
    fases_data = [
        {"nombre": "F1: Primeros Pasos", "orden": 1, "fecha_inicio": date(2025, 12, 1), "fecha_fin": date(2026, 1, 31), "ponderacion": 10},
        {"nombre": "F2: Levantamiento", "orden": 2, "fecha_inicio": date(2026, 2, 1), "fecha_fin": date(2026, 4, 30), "ponderacion": 25},
        {"nombre": "F3: Análisis y Comité", "orden": 3, "fecha_inicio": date(2026, 5, 1), "fecha_fin": date(2026, 5, 31), "ponderacion": 15},
        {"nombre": "F4: Catálogo", "orden": 4, "fecha_inicio": date(2026, 6, 1), "fecha_fin": date(2026, 7, 31), "ponderacion": 15},
        {"nombre": "F5: Política", "orden": 5, "fecha_inicio": date(2026, 8, 1), "fecha_fin": date(2026, 8, 31), "ponderacion": 15},
        {"nombre": "F6: Protocolos", "orden": 6, "fecha_inicio": date(2026, 9, 1), "fecha_fin": date(2026, 11, 30), "ponderacion": 20},
    ]

    db_fases = {}
    for fd in fases_data:
        fase = db.query(Fase).filter(Fase.proyecto_id == project.id, Fase.nombre == fd["nombre"]).first()
        if not fase:
            fase = Fase(
                nombre=fd["nombre"],
                orden=fd["orden"],
                fecha_inicio_plan=fd["fecha_inicio"],
                fecha_fin_plan=fd["fecha_fin"],
                ponderacion=fd["ponderacion"],
                proyecto_id=project.id
            )
            db.add(fase)
            db.flush()
        db_fases[fd["orden"]] = fase

    # 6. Seed Tareas
    tareas_data = [
        # Fase 1
        {"nombre": "Designar Encargado", "desc": "Designar formalmente al Encargado de Protección de Datos (DPO) mediante acto administrativo.", "fase": 1, "area": "Legal y Cumplimiento", "user": "admin@protecciondatos.cl", "inicio": date(2025, 12, 1), "fin": date(2025, 12, 15), "estado": "Completada", "dep": None},
        {"nombre": "Configurar proyecto en app", "desc": "Parametrizar las fechas base y asignar áreas responsables en la plataforma SIGE-DP.", "fase": 1, "area": "Legal y Cumplimiento", "user": "admin@protecciondatos.cl", "inicio": date(2025, 12, 16), "fin": date(2025, 12, 31), "estado": "Completada", "dep": None},
        {"nombre": "Comunicación interna", "desc": "Difundir la iniciativa y capacitar a las jefaturas de las divisiones sobre la ley y el uso del Wizard.", "fase": 1, "area": "Legal y Cumplimiento", "user": "admin@protecciondatos.cl", "inicio": date(2026, 1, 1), "fin": date(2026, 1, 31), "estado": "Completada", "dep": None},
        # Fase 2
        {"nombre": "Completar Wizard por cada Área", "desc": "Cada Responsable de Área debe rellenar el formulario de levantamiento de actividades de tratamiento.", "fase": 2, "area": "Tecnología de la Información", "user": "ti@protecciondatos.cl", "inicio": date(2026, 2, 1), "fin": date(2026, 3, 31), "estado": "En progreso", "dep": None},
        {"nombre": "Consolidar matrices", "desc": "Unificar el levantamiento de información en la Matriz Maestra y validación del DPO.", "fase": 2, "area": "Legal y Cumplimiento", "user": "admin@protecciondatos.cl", "inicio": date(2026, 4, 1), "fin": date(2026, 4, 30), "estado": "Pendiente", "dep": None},
        # Fase 3
        {"nombre": "Generar Informe de Hallazgos", "desc": "Correr el motor de riesgos sobre la Matriz Maestra y generar el borrador automático de brechas.", "fase": 3, "area": "Legal y Cumplimiento", "user": "admin@protecciondatos.cl", "inicio": date(2026, 5, 1), "fin": date(2026, 5, 15), "estado": "Pendiente", "dep": None},
        {"nombre": "Constituir Comité Ejecutivo", "desc": "Formalizar constitución del comité ejecutivo de protección de datos con áreas críticas.", "fase": 3, "area": "Legal y Cumplimiento", "user": "legal@protecciondatos.cl", "inicio": date(2026, 5, 16), "fin": date(2026, 5, 31), "estado": "Pendiente", "dep": None},
        # Fase 4
        {"nombre": "Generar borrador de Catálogo", "desc": "Autocompletar el Catálogo Nacional de Datos con los datos consolidados del levantamiento.", "fase": 4, "area": "Legal y Cumplimiento", "user": "admin@protecciondatos.cl", "inicio": date(2026, 6, 1), "fin": date(2026, 6, 30), "estado": "Pendiente", "dep": None},
        {"nombre": "Revisión Comité Catálogo", "desc": "Revisión colaborativa y aprobación del Catálogo de Datos Personales por el Comité.", "fase": 4, "area": "Legal y Cumplimiento", "user": "comite@protecciondatos.cl", "inicio": date(2026, 7, 1), "fin": date(2026, 7, 31), "estado": "Pendiente", "dep": None},
        # Fase 5
        {"nombre": "Generar borrador de Política", "desc": "Crear borrador autocompletado de la Política de Privacidad y Tratamiento de Datos.", "fase": 5, "area": "Legal y Cumplimiento", "user": "admin@protecciondatos.cl", "inicio": date(2026, 8, 1), "fin": date(2026, 8, 15), "estado": "Pendiente", "dep": None},
        {"nombre": "Aprobación Jefe Servicio", "desc": "Firma formal y publicación de la Política en el Portal de Transparencia.", "fase": 5, "area": "Legal y Cumplimiento", "user": "jefe@protecciondatos.cl", "inicio": date(2026, 8, 16), "fin": date(2026, 8, 31), "estado": "Pendiente", "dep": None},
        # Fase 6
        {"nombre": "Priorizar riesgos", "desc": "Establecer mapa de calor e identificar riesgos prioritarios que requieren protocolos.", "fase": 6, "area": "Legal y Cumplimiento", "user": "admin@protecciondatos.cl", "inicio": date(2026, 9, 1), "fin": date(2026, 9, 30), "estado": "Pendiente", "dep": None},
        {"nombre": "Redactar protocolos asignados", "desc": "Finalizar la redacción e implementación de medidas de seguridad, respuesta ante brechas y de conservación.", "fase": 6, "area": "Tecnología de la Información", "user": "ti@protecciondatos.cl", "inicio": date(2026, 10, 1), "fin": date(2026, 11, 30), "estado": "Pendiente", "dep": None},
    ]

    db_tareas = {}
    for td in tareas_data:
        tarea = db.query(Tarea).filter(Tarea.nombre == td["nombre"]).first()
        if not tarea:
            fase_obj = db_fases[td["fase"]]
            area_obj = db_areas[td["area"]]
            user_obj = db_users[td["user"]]
            tarea = Tarea(
                nombre=td["nombre"],
                descripcion=td["desc"],
                fase_id=fase_obj.id,
                area_responsable_id=area_obj.id,
                usuario_asignado_id=user_obj.id,
                fecha_inicio=td["inicio"],
                fecha_fin=td["fin"],
                estado=td["estado"]
            )
            db.add(tarea)
            db.flush()
        db_tareas[td["nombre"]] = tarea

    # Set dependency constraints where specified
    db_tareas["Constituir Comité Ejecutivo"].dependencia_de = db_tareas["Generar Informe de Hallazgos"].id
    db_tareas["Revisión Comité Catálogo"].dependencia_de = db_tareas["Generar borrador de Catálogo"].id
    db_tareas["Aprobación Jefe Servicio"].dependencia_de = db_tareas["Generar borrador de Política"].id
    db_tareas["Redactar protocolos asignados"].dependencia_de = db_tareas["Priorizar riesgos"].id
    db.flush()

    # 7. Seed MatrizLevantamiento
    matriz_ti = db.query(MatrizLevantamiento).filter(MatrizLevantamiento.area_id == db_areas["Tecnología de la Información"].id).first()
    if not matriz_ti:
        datos_ti = [
            {
                "proceso": "Plataforma de Trámites Digitales",
                "tipo_datos": "Nombre, RUN, Correo electrónico, Teléfono, Dirección",
                "datos_sensibles": "No",
                "finalidad": "Permitir el ingreso, seguimiento y resolución de trámites ciudadanos en línea.",
                "base_legal": "Cumplimiento de funciones legales de la institución (Ley 19.880)",
                "origen": "Ingreso directo por el titular en formulario web",
                "almacenamiento": "Servidor de base de datos PostgreSQL en datacenter institucional",
                "acceso": "Funcionarios de la OIRS y Área de Operaciones",
                "transferencia_internacional": "No",
                "encargado": "Interno",
                "medidas_seguridad": "Control de acceso con contraseña, logs de auditoría básica",
                "plazo_conservacion": "5 años tras finalizar el trámite",
                "uso_ia": "No",
                "volumen": "12,500 registros"
            },
            {
                "proceso": "Ficha Social y Beneficios Internos",
                "tipo_datos": "Datos socioeconómicos, Afiliación de salud, Discapacidad",
                "datos_sensibles": "Sí (Datos de salud, Ingresos familiares)",
                "finalidad": "Evaluar y otorgar beneficios sociales internos.",
                "base_legal": "Consentimiento explícito firmado por el postulante",
                "origen": "Entrevista presencial y carga de documentos",
                "almacenamiento": "Servidor institucional compartido (carpeta restringida)",
                "acceso": "Asistentes Sociales de RRHH",
                "transferencia_internacional": "Sí (Respaldo en la nube AWS USA)",
                "encargado": "Amazon Web Services Inc. (Contrato vigente)",
                "medidas_seguridad": "Cifrado de datos en tránsito, permisos NTFS de usuario único",
                "plazo_conservacion": "Durante la vigencia de la postulación y 2 años posteriores",
                "uso_ia": "No",
                "volumen": "450 registros"
            }
        ]
        matriz_ti = MatrizLevantamiento(
            area_id=db_areas["Tecnología de la Información"].id,
            datos_json=datos_ti,
            completada=True
        )
        db.add(matriz_ti)
        db.flush()

    # 8. Seed Riesgos with 5x5 Probability and Impact
    if not db.query(Riesgo).first():
        db.add_all([
            Riesgo(
                matriz_id=matriz_ti.id,
                nivel="Alto",
                descripcion="Ficha Social y Beneficios Internos: Cuenta con transferencia internacional a EE.UU. de datos sensibles de salud sin cláusulas contractuales adecuadas.",
                puntuacion=20,
                probabilidad=4,
                impacto=5,
                requiere_eipd=True
            ),
            Riesgo(
                matriz_id=matriz_ti.id,
                nivel="Bajo",
                descripcion="Plataforma de Trámites Digitales: Datos identificativos básicos almacenados localmente con control de credenciales y bitácora activa.",
                puntuacion=4,
                probabilidad=2,
                impacto=2,
                requiere_eipd=False
            )
        ])
        db.flush()

    # 8.1 Seed ARCO+ Requests
    if not db.query(ArcoRequest).first():
        today = date.today()
        from app.core.helpers import add_business_days
        db.add_all([
            ArcoRequest(
                folio="ARCO-2026-0001",
                tipo_derecho="Acceso",
                titular_nombre="María José Valenzuela",
                titular_rut="16.432.198-4",
                titular_email="mj.valenzuela@correo.cl",
                fecha_ingreso=today,
                dias_habiles_limite=15,
                fecha_limite_legal=add_business_days(today, 15),
                estado="En análisis",
                descripcion_solicitud="Solicito copia íntegra y detallada de mis registros de postulaciones y antecedentes socioeconómicos almacenados en el sistema.",
                area_derivada_id=db_areas["Legal y Cumplimiento"].id,
                responsable_asignado_id=db_users["admin@protecciondatos.cl"].id
            ),
            ArcoRequest(
                folio="ARCO-2026-0002",
                tipo_derecho="Rectificación",
                titular_nombre="Carlos Roberto Morales",
                titular_rut="11.876.543-2",
                titular_email="carlos.morales@empresa.cl",
                fecha_ingreso=today,
                dias_habiles_limite=15,
                fecha_limite_legal=add_business_days(today, 15),
                estado="Ingresada",
                descripcion_solicitud="Solicito actualizar mi domicilio fiscal y correo electrónico en la base de datos de trámites institucionales.",
                area_derivada_id=db_areas["Atención Ciudadana"].id,
                responsable_asignado_id=db_users["invitado@protecciondatos.cl"].id
            )
        ])
        db.flush()

    # 8.2 Seed Security Breaches (72h)
    if not db.query(SecurityBreach).first():
        from datetime import timedelta
        now = datetime.now()
        db.add_all([
            SecurityBreach(
                codigo_incidente="INC-2026-0001",
                fecha_deteccion=now,
                fecha_limite_notificacion=now + timedelta(hours=72),
                tipo_incidente="Acceso no autorizado",
                gravedad="Alta",
                descripcion="Detección de intento de escalamiento de privilegios en el servidor web de postulaciones. Se comprometieron temporalmente registros de contacto.",
                datos_afectados="Nombres, RUNs y correos electrónicos de 150 usuarios.",
                cantidad_titulares_afectados=150,
                medidas_contencion="Bloqueo inmediato de IPs de origen, forzado de cambio de contraseñas de administradores y parche de seguridad aplicado.",
                notificado_agencia=False,
                notificado_titulares=False,
                estado="En contención",
                reportado_por_id=db_users["ti@protecciondatos.cl"].id
            )
        ])
        db.flush()

    # 9. Seed Documentos
    docs_to_seed = [
        {
            "tipo": "politica",
            "version": "1.0",
            "estado": "borrador",
            "contenido": """# Política de Tratamiento de Datos Personales
**Organismo:** Gobierno Demo de Chile
**Fecha de Aprobación:** Borrador en Preparación

## 1. Introducción
Esta política establece las directrices para el tratamiento de datos personales en nuestro servicio público, de conformidad con la Ley 21.719.

## 2. Datos Tratados y Finalidades
El organismo trata los siguientes datos obtenidos a través de nuestros procesos:
{{lista_datos_sensibles}}

Las finalidades principales de dicho tratamiento son:
{{finalidades}}

## 3. Medidas de Seguridad
El organismo aplica las siguientes medidas técnicas y organizativas para proteger la confidencialidad:
{{medidas_seguridad}}

## 4. Vigencia y Modificaciones
Este documento entrará en vigor tras la firma del Jefe de Servicio.
"""
        },
        {
            "tipo": "catalogo",
            "version": "1.0",
            "estado": "revision",
            "contenido": """# Catálogo Nacional de Datos Personales
*Borrador Consolidado para el Comité Ejecutivo.*

### Registro de Bases de Datos Activas:
{{catalogo}}
"""
        }
    ]

    db_docs = {}
    for docd in docs_to_seed:
        doc = db.query(Documento).filter(Documento.tipo == docd["tipo"]).first()
        if not doc:
            doc = Documento(
                tipo=docd["tipo"],
                version=docd["version"],
                estado=docd["estado"],
                contenido=docd["contenido"]
            )
            db.add(doc)
            db.flush()
        db_docs[docd["tipo"]] = doc

    # 10. Seed Comentarios on Docs
    if not db.query(Comentario).first():
        com1 = Comentario(
            documento_id=db_docs["politica"].id,
            usuario_id=db_users["comite@protecciondatos.cl"].id,
            texto="Sugiero robustecer la sección 3 sobre medidas de seguridad físicas, agregando el control de acceso biométrico.",
            fecha=datetime.now()
        )
        db.add(com1)
        db.flush()
        
        com2 = Comentario(
            documento_id=db_docs["politica"].id,
            usuario_id=db_users["legal@protecciondatos.cl"].id,
            texto="De acuerdo con la sugerencia, la agregaremos una vez se unifique la matriz de TI.",
            fecha=datetime.now(),
            parent_id=com1.id
        )
        db.add(com2)
        db.flush()

    # 11. Seed Proveedores
    if not db.query(Proveedor).first():
        db.add_all([
            Proveedor(
                nombre="Servicios Globales SpA",
                rut="76.123.456-7",
                servicio="Soporte y Mesa de Ayuda TI",
                fecha_contrato_inicio=date(2025, 1, 1),
                fecha_contrato_fin=date(2026, 8, 30),  # Expires in < 2 months from current date (July 2026)
                area_id=db_areas["Tecnología de la Información"].id
            ),
            Proveedor(
                nombre="Consultora Legal Chile",
                rut="77.987.654-3",
                servicio="Asesoría Externa Cumplimiento L21719",
                fecha_contrato_inicio=date(2026, 1, 15),
                fecha_contrato_fin=date(2027, 6, 30),
                area_id=db_areas["Legal y Cumplimiento"].id
            )
        ])
        db.flush()

    # 12. Seed LogAuditoria
    if not db.query(LogAuditoria).first():
        db.add_all([
            LogAuditoria(
                usuario_id=db_users["admin@protecciondatos.cl"].id,
                accion="Creación de Proyecto",
                entidad_afectada="ImplementationProject",
                fecha_hora=datetime.now(),
                detalle_json={"proyecto_id": project.id, "nombre": project.name}
            ),
            LogAuditoria(
                usuario_id=db_users["ti@protecciondatos.cl"].id,
                accion="Finalización de Wizard de Levantamiento",
                entidad_afectada="MatrizLevantamiento",
                fecha_hora=datetime.now(),
                detalle_json={"matriz_id": matriz_ti.id, "area": "Tecnología de la Información"}
            )
        ])
        db.flush()

    # 13. Maintain backward compatibility tables data
    if not db.query(TreatmentActivity).first():
        db.add_all([
            TreatmentActivity(name="Gestión de colaboradores", area="Personas", purpose="Administrar contratos, remuneraciones y beneficios.", legal_basis="Ejecución contractual", risk_level="Medio"),
            TreatmentActivity(name="Prospección comercial", area="Ventas", purpose="Gestionar oportunidades comerciales y comunicaciones.", legal_basis="Consentimiento", risk_level="Bajo"),
            TreatmentActivity(name="Atención de derechos ARCO", area="Legal", purpose="Responder solicitudes de titulares de datos.", legal_basis="Obligación legal", risk_level="Alto"),
        ])
    if not db.query(Finding).first():
        db.add_all([
            Finding(title="Falta registro consolidado de actividades", severity="Alta", status="Abierto", recommendation="Completar matriz por área y validar bases de licitud."),
            Finding(title="Política de privacidad requiere actualización", severity="Media", status="En progreso", recommendation="Alinear textos con derechos del titular y canales de contacto."),
        ])
    if not db.query(Consent).first():
        db.add_all([
            Consent(data_subject="Cliente web demo", channel="Formulario web", purpose="Envío de comunicaciones comerciales", status="Vigente"),
            Consent(data_subject="Postulante demo", channel="Portal de empleo", purpose="Gestión de proceso de selección", status="Revocado"),
        ])
    if not db.query(CaseTicket).first():
        db.add_all([
            CaseTicket(subject="Solicitud de acceso a datos", category="Derechos titulares", status="Nuevo"),
            CaseTicket(subject="Revisión contrato proveedor", category="Encargados", status="En revisión"),
        ])

    # ==============================================================================
    # 14. SEED CIBERSEGURIDAD E INFRAESTRUCTURA CRÍTICA (LEY 21.663 / ANCI)
    # ==============================================================================
    cyber_project = db.query(CyberProject).first()
    if not cyber_project:
        cyber_project = CyberProject(
            name="Plan de Adecuación Ley 21.663 Marco de Ciberseguridad",
            stage="Gobernanza",
            progress=25,
            ciso_owner="CISO / Responsable Ciberseguridad",
            clasificacion_institucional="Prestador de Servicios Esenciales (PSE)",
            resumen_ejecutivo="Implementación del marco técnico y organizativo exigido por la Agencia Nacional de Ciberseguridad (ANCI) para la protección de Redes y Sistemas Informáticos Críticos (RSIC).",
            fecha_inicio=date(2026, 1, 1),
            fecha_fin=date(2027, 1, 1),
            estado="Activo"
        )
        db.add(cyber_project)
        db.flush()

        # 6 Fases Metodológicas de Ciberseguridad
        cyber_fases_data = [
            {
                "orden": 1,
                "nombre": "Fase 1: Gobernanza y Designación de Responsables (Art. 7 y 8)",
                "descripcion": "Designación formal del Responsable de Ciberseguridad (CISO) ante la ANCI, constitución del Comité Institucional y definición del marco de gobierno.",
                "ponderacion": 15,
                "inicio": date(2026, 1, 1),
                "fin": date(2026, 2, 28),
                "tareas": [
                    ("Designación formal del Responsable de Seguridad / CISO ante la ANCI", "Emitir resolución o decreto de nombramiento y registrar credenciales en portal ANCI.", "Completada"),
                    ("Constitución del Comité de Ciberseguridad y Gestión de Crisis", "Acta formal de conformación con directores de TI, Legal y Operaciones.", "Completada"),
                    ("Definición de Alcance y Clasificación Institucional (OIV / PSE)", "Determinar si el servicio califica como Operador de Importancia Vital o Prestador de Servicios Esenciales.", "En progreso")
                ]
            },
            {
                "orden": 2,
                "nombre": "Fase 2: Inventario de Redes y Sistemas Críticos RSIC (Art. 4 y 5)",
                "descripcion": "Catálogo exhaustivo de activos de información, servidores, bases de datos, redes perimetrales y dependencias de proveedores externos.",
                "ponderacion": 20,
                "inicio": date(2026, 3, 1),
                "fin": date(2026, 4, 30),
                "tareas": [
                    ("Levantamiento del Catálogo de Redes y Sistemas Críticos (RSIC)", "Registrar servidores, bases de datos, APIs y portales de atención ciudadana.", "En progreso"),
                    ("Mapeo de Interconexiones y Topología Perimetral", "Diagramar flujos de red, túneles VPN, DMZ y accesos remotos de terceros.", "Pendiente"),
                    ("Evaluación de Proveedores TI Críticos y Cadena de Suministro", "Exigir cláusulas de seguridad y notificación de incidentes en 24h a proveedores.", "Pendiente")
                ]
            },
            {
                "orden": 3,
                "nombre": "Fase 3: Gestión de Riesgos y Diagnóstico de Madurez (Art. 9)",
                "descripcion": "Evaluación de madurez bajo estándares ANCI / NIST CSF (Identificar, Proteger, Detectar, Responder, Recuperar) y análisis de vulnerabilidades.",
                "ponderacion": 20,
                "inicio": date(2026, 5, 1),
                "fin": date(2026, 6, 30),
                "tareas": [
                    ("Evaluación de Madurez NIST CSF / Marco Nacional ANCI", "Autoevaluación de los 5 dominios de seguridad y cálculo del índice de madurez.", "Pendiente"),
                    ("Escaneo Periódico de Vulnerabilidades y Análisis de Amenazas", "Detección de puertos expuestos, software obsoleto y configuraciones débiles.", "Pendiente"),
                    ("Matriz de Riesgos Tecnológicos y Plan de Tratamiento", "Jerarquizar riesgos según probabilidad de ciberataque e impacto operacional.", "Pendiente")
                ]
            },
            {
                "orden": 4,
                "nombre": "Fase 4: Políticas, Protocolos y Continuidad BCP/DRP (Art. 10)",
                "descripcion": "Elaboración y aprobación formal de la Política de Seguridad de la Información, Plan de Respuesta a Incidentes (PRI) y Plan de Continuidad Operacional.",
                "ponderacion": 20,
                "inicio": date(2026, 7, 1),
                "fin": date(2026, 8, 31),
                "tareas": [
                    ("Aprobación de Política General de Seguridad de la Información", "Documento normativo de uso de activos, contraseñas, teletrabajo y accesos.", "Pendiente"),
                    ("Elaboración del Plan de Respuesta a Incidentes (PRI)", "Definición de roles de contención, protocolos de comunicación y cadena de mando.", "Pendiente"),
                    ("Plan de Continuidad Operacional y Respaldo Inmutable (BCP/DRP)", "Garantizar copias de respaldo aisladas (air-gapped) ante ataques de ransomware.", "Pendiente")
                ]
            },
            {
                "orden": 5,
                "nombre": "Fase 5: Notificación y Gestión de Incidentes ANCI (Art. 12 y 13)",
                "descripcion": "Implementación del canal de Alerta Temprana de 3 horas e Informe Técnico de 72 horas ante incidentes que comprometan la continuidad.",
                "ponderacion": 15,
                "inicio": date(2026, 9, 1),
                "fin": date(2026, 10, 31),
                "tareas": [
                    ("Activación del Flujo de Notificación Temprana (3 Horas)", "Procedimiento express para informar al CSIRT Nacional / ANCI ante ciberataques.", "Pendiente"),
                    ("Protocolo de Preservación de Evidencia Forense Digital", "Reglas para congelar logs, memoria y discos sin alterar la cadena de custodia.", "Pendiente")
                ]
            },
            {
                "orden": 6,
                "nombre": "Fase 6: Auditoría Técnica y Certificación de Controles (Art. 14)",
                "descripcion": "Verificación de cumplimiento de controles mínimos: Autenticación Multifactor (MFA), Cifrado de datos en reposo/tránsito y pruebas de penetración.",
                "ponderacion": 10,
                "inicio": date(2026, 11, 1),
                "fin": date(2026, 12, 31),
                "tareas": [
                    ("Auditoría de Cumplimiento de Controles Técnicos Mínimos", "Verificar 100% de cobertura en MFA para administradores y cifrado TLS 1.3.", "Pendiente"),
                    ("Pruebas de Penetración (Pentesting) y Ejercicios de Simulación", "Simulacro anual de ransomware o phishing para probar tiempos de respuesta.", "Pendiente")
                ]
            }
        ]

        for fd in cyber_fases_data:
            fase = CyberFase(
                proyecto_id=cyber_project.id,
                orden=fd["orden"],
                nombre=fd["nombre"],
                descripcion=fd["descripcion"],
                ponderacion=fd["ponderacion"],
                fecha_inicio_plan=fd["inicio"],
                fecha_fin_plan=fd["fin"],
                activo=True,
                resuelto_externamente=False
            )
            db.add(fase)
            db.flush()

            for t_nom, t_desc, t_est in fd["tareas"]:
                tarea = CyberTarea(
                    fase_id=fase.id,
                    nombre=t_nom,
                    descripcion=t_desc,
                    area_responsable_id=db_areas["Tecnología de la Información"].id,
                    usuario_asignado_id=db_users["ti@protecciondatos.cl"].id,
                    fecha_inicio=fd["inicio"],
                    fecha_fin=fd["fin"],
                    estado=t_est,
                    estandar_asociado="ANCI - Requisitos Mínimos"
                )
                db.add(tarea)
                db.flush()

    # 15. Seed Activos Críticos RSIC
    if not db.query(CyberAsset).first():
        db.add_all([
            CyberAsset(
                codigo_activo="RSIC-0001",
                nombre="Servidor Central de Trámites y Postulaciones",
                tipo="Servidor Central",
                criticidad="Crítico OIV",
                servicio_esencial="Portal Ciudadano y Ventanilla Única",
                ubicacion_o_ip="10.0.1.15 (OCI Virtual Cloud Network)",
                area_responsable_id=db_areas["Tecnología de la Información"].id,
                cifrado_activo=True,
                mfa_activo=True,
                respaldo_inmutable=True,
                estado_cumplimiento="Conforme"
            ),
            CyberAsset(
                codigo_activo="RSIC-0002",
                nombre="Base de Datos Institucional PostgreSQL",
                tipo="Base de Datos",
                criticidad="Alto PSE",
                servicio_esencial="Almacenamiento de Registros de Usuarios",
                ubicacion_o_ip="10.0.2.20 (Subred Privada OCI)",
                area_responsable_id=db_areas["Tecnología de la Información"].id,
                cifrado_activo=True,
                mfa_activo=True,
                respaldo_inmutable=True,
                estado_cumplimiento="Conforme"
            ),
            CyberAsset(
                codigo_activo="RSIC-0003",
                nombre="Firewall Perimetral y Concentrador VPN",
                tipo="Red / Firewall",
                criticidad="Crítico OIV",
                servicio_esencial="Control de Accesos Perimetrales y DMZ",
                ubicacion_o_ip="192.168.1.1",
                area_responsable_id=db_areas["Tecnología de la Información"].id,
                cifrado_activo=True,
                mfa_activo=True,
                respaldo_inmutable=False,
                estado_cumplimiento="En Adecuación"
            )
        ])
        db.flush()

    # 16. Seed Incidente ANCI (3h)
    if not db.query(CyberIncidentANCI).first():
        now = datetime.now()
        db.add(CyberIncidentANCI(
            codigo_incidente="INC-ANCI-2026-0001",
            fecha_deteccion=now,
            fecha_limite_alerta_3h=now + timedelta(hours=3),
            fecha_limite_informe_72h=now + timedelta(hours=72),
            tipo_ataque="Intrusión no autorizada / Fuerza Bruta",
            severidad="Alta",
            afecta_servicio_esencial=True,
            descripcion="Detección de múltiples intentos fallidos de autenticación SSH dirigidos al servidor de base de datos desde IPs externas bloqueadas.",
            sistemas_comprometidos="Servidor Central de Postulaciones (RSIC-0001)",
            medidas_contencion_aplicadas="Bloqueo a nivel de Security List en OCI, rotación de claves RSA y forzado de túnel VPN exclusivo.",
            alerta_3h_enviada_anci=False,
            informe_72h_enviado_anci=False,
            estado="Alerta Inicial (3h)",
            reportado_por_id=db_users["ti@protecciondatos.cl"].id
        ))
        db.flush()

    # 17. Seed Madurez NIST / ANCI
    if not db.query(CyberMaturityAssessment).first():
        db.add(CyberMaturityAssessment(
            titulo="Diagnóstico Inicial de Madurez Ciberseguridad 2026",
            fecha_evaluacion=date.today(),
            porcentaje_identificar=65,
            porcentaje_proteger=60,
            porcentaje_detectar=50,
            porcentaje_responder=45,
            porcentaje_recuperar=55,
            madurez_global=55,
            conclusiones_ciso="La institución cuenta con buen nivel en identificación y cifrado de activos. Se requiere fortalecer el monitoreo 24/7 (SIEM) y ejercitar el Plan de Respuesta a Incidentes (PRI) con la ANCI.",
            estado="Vigente"
        ))
        db.flush()

    # 18. Seed Políticas de Ciberseguridad
    if not db.query(CyberPolicy).first():
        db.add_all([
            CyberPolicy(
                tipo="politica_seguridad",
                titulo="Política General de Seguridad de la Información (PGSI)",
                version="1.0",
                estado="revision",
                contenido="""# Política General de Seguridad de la Información y Ciberseguridad
**Marco Jurídico:** Ley N° 21.663 de Ciberseguridad de Chile
**Ámbito de Aplicación:** Todos los funcionarios, colaboradores y proveedores del Servicio.

## 1. Principios Rectores
1. **Confidencialidad, Integridad y Disponibilidad** de la información institucional.
2. **Defensa en Profundidad:** Aplicación de controles múltiples (Firewall, EDR, MFA, Cifrado).
3. **Mínimo Privilegio:** Acceso concedido únicamente según el rol y funciones estrictas.

## 2. Controles Técnicos Obligatorios
- **Autenticación Multifactor (MFA):** Requisito obligatorio para todos los accesos administrativos y remotos.
- **Cifrado de Datos:** Todos los datos en tránsito deben usar TLS 1.3 y los datos en reposo cifrado AES-256.
- **Respaldos:** Copias de seguridad diarias con al menos una copia desconectada e inmutable (Anti-Ransomware).

## 3. Notificación a la ANCI
Todo incidente con impacto potencial en servicios esenciales debe ser comunicado al Responsable de Seguridad dentro de los primeros 60 minutos de detección.
"""
            ),
            CyberPolicy(
                tipo="plan_respuesta_pri",
                titulo="Plan de Respuesta a Incidentes de Ciberseguridad (PRI)",
                version="1.0",
                estado="borrador",
                contenido="""# Plan Institucional de Respuesta a Incidentes de Ciberseguridad (PRI)
**Conforme a las directrices de la Agencia Nacional de Ciberseguridad (ANCI)**

## 1. Equipo de Respuesta (CSIRT Institucional)
- **Líder de Incidentes:** CISO / Responsable de Seguridad
- **Comandante Técnico:** Jefe de Infraestructura TI
- **Asesor Legal:** Responsable de Legal y Cumplimiento
- **Comunicaciones:** Encargado de Prensa y Comunicaciones Institucionales

## 2. Fases de Atención
1. **Detección y Triaje:** Clasificación de severidad (Crítica, Alta, Media, Baja).
2. **Alerta Temprana ANCI (0 a 3 Horas):** Notificación oficial a la plataforma nacional de la ANCI.
3. **Contención Inmediata:** Aislamiento de segmentos de red, revocación de credenciales.
4. **Erradicación y Recuperación:** Restauración desde copias limpias y parches.
5. **Informe Técnico (72 Horas):** Entrega de informe final de causa raíz a la ANCI.
"""
            )
        ])
        db.flush()

    # 19. Seed Matriz de Riesgos Tecnológicos (5x5)
    if not db.query(CyberRisk).first():
        asset1 = db.query(CyberAsset).filter(CyberAsset.codigo_activo == "RSIC-0001").first()
        asset2 = db.query(CyberAsset).filter(CyberAsset.codigo_activo == "RSIC-0002").first()
        asset3 = db.query(CyberAsset).filter(CyberAsset.codigo_activo == "RSIC-0003").first()

        db.add_all([
            CyberRisk(
                amenaza="Secuestro de Datos mediante Ransomware en Servidor de Postulaciones",
                categoria_mitre="Impacto",
                activo_id=asset1.id if asset1 else None,
                probabilidad=3,
                impacto=5,
                puntuacion=15,
                nivel_riesgo="Crítico",
                controles_existentes="EDR en endpoints, firewall perimetral y respaldo diario.",
                plan_tratamiento="Habilitar almacenamiento inmutable WORM y MFA obligatorio en consolas de administración.",
                estado="En Mitigación",
                responsable_id=db_users["ti@protecciondatos.cl"].id
            ),
            CyberRisk(
                amenaza="Ataque de Denegación de Servicio Distribuido (DDoS) a Ventanilla Única",
                categoria_mitre="Impacto",
                activo_id=asset1.id if asset1 else None,
                probabilidad=4,
                impacto=3,
                puntuacion=12,
                nivel_riesgo="Alto",
                controles_existentes="Rate limiting en Nginx y Security List en OCI.",
                plan_tratamiento="Integrar WAF con mitigación automatizada de tráfico anómalo.",
                estado="Identificado",
                responsable_id=db_users["ti@protecciondatos.cl"].id
            ),
            CyberRisk(
                amenaza="Exfiltración de Credenciales de Acceso VPN por Phishing Masivo",
                categoria_mitre="Acceso Inicial",
                activo_id=asset3.id if asset3 else None,
                probabilidad=3,
                impacto=4,
                puntuacion=12,
                nivel_riesgo="Alto",
                controles_existentes="Autenticación con contraseña fuerte.",
                plan_tratamiento="Forzar MFA FIDO2/TOTP en todos los clientes VPN institucionales.",
                estado="En Mitigación",
                responsable_id=db_users["ti@protecciondatos.cl"].id
            )
        ])
        db.flush()

    # 20. Seed Simulador de Crisis / War Game
    if not db.query(CyberSimulation).first():
        db.add(CyberSimulation(
            codigo_ejercicio="SIM-WARGAME-2026-001",
            titulo="Simulacro Anual de Ransomware con Notificación ANCI en 3 Horas",
            tipo_escenario="Ransomware & Extorsión Doble",
            escenario_narrativa="Se simuló la infección de una estación de trabajo administrativa con propagación simulada al servidor de base de datos. El CSIRT aisló la subred en 15 minutos y se despachó la Alerta Temprana en 45 minutos.",
            fecha_ejecucion=date(2026, 6, 15),
            tiempo_respuesta_minutos=45,
            participantes_json=["Jefe de Servicio", "CISO / Resp. TI", "Jefe Legal", "Encargado de Comunicaciones"],
            cumplio_plazo_3h=True,
            lecciones_aprendidas="Se evidenció la necesidad de mantener copias físicas impresas del directorio de contactos de emergencia del CSIRT Nacional y proveedores clave.",
            estado="Completado y Firmado"
        ))
        db.flush()

    # 21. Seed Capacitaciones y Concientización (Art. 14 L21.719 / Art. 8 L21.663)
    if not db.query(TrainingCampaign).first():
        db.add_all([
            TrainingCampaign(
                titulo="Campaña Nacional de Phishing Simulado y Detección de Ingeniería Social",
                tipo="Phishing Simulado ANCI",
                descripcion="Evaluación controlada de correos simulados de suplantación bancaria y de RRHH para medir la vulnerabilidad del personal ante ataques de phishing.",
                fecha_inicio=date(2026, 4, 1),
                fecha_fin=date(2026, 4, 30),
                total_convocados=150,
                total_capacitados=138,
                porcentaje_aprobacion=92,
                tasa_clic_phishing=4.2,
                estado="Finalizada",
                instructor_o_plataforma="Plataforma de Simulación CISO / ANCI",
                area_responsable_id=db_areas["Tecnología de la Información"].id
            ),
            TrainingCampaign(
                titulo="Curso Obligatorio de Protección de Datos Personales y Deber de Secreto (Ley 21.719)",
                tipo="Protección de Datos Ley 21.719",
                descripcion="Taller formativo sobre bases de licitud, tratamiento de datos sensibles, confidencialidad y protocolo de escalamiento de derechos ARCO+.",
                fecha_inicio=date(2026, 5, 10),
                fecha_fin=date(2026, 6, 10),
                total_convocados=150,
                total_capacitados=145,
                porcentaje_aprobacion=96,
                tasa_clic_phishing=0.0,
                estado="Finalizada",
                instructor_o_plataforma="Delegado de Protección de Datos (DPO)",
                area_responsable_id=db_areas["Legal y Cumplimiento"].id
            ),
            TrainingCampaign(
                titulo="Taller de Higiene de Contraseñas, MFA y Uso Seguro de Dispositivos Móviles",
                tipo="Higiene de Contraseñas & MFA",
                descripcion="Entrenamiento práctico en autenticación multifactor FIDO2, bloqueo automático de pantallas y directivas de teletrabajo seguro.",
                fecha_inicio=date(2026, 8, 1),
                fecha_fin=date(2026, 8, 31),
                total_convocados=150,
                total_capacitados=110,
                porcentaje_aprobacion=88,
                tasa_clic_phishing=0.0,
                estado="En Ejecución",
                instructor_o_plataforma="Área de Infraestructura y Ciberseguridad",
                area_responsable_id=db_areas["Tecnología de la Información"].id
            )
        ])
        db.flush()

    db.commit()


