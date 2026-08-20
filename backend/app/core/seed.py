from datetime import date, datetime
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.domain import (
    Area,
    CaseTicket,
    Comentario,
    Consent,
    Documento,
    Fase,
    Finding,
    FlujoAprobacion,
    ImplementationProject,
    LogAuditoria,
    MatrizLevantamiento,
    Proveedor,
    Riesgo,
    Tarea,
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

    db.commit()
