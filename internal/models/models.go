package models

import "time"

// User structs
type User struct {
	ID              int       `json:"id"`
	Email           string    `json:"email"`
	FullName        string    `json:"full_name"`
	Role            string    `json:"role"`
	HashedPassword  string    `json:"-"`
	IsActive        bool      `json:"is_active"`
	AreaID          *int      `json:"area_id"`
	ClaveUnicaToken *string   `json:"clave_unica_token,omitempty"`
	Rut             *string   `json:"rut,omitempty"`
	Cargo           *string   `json:"cargo,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type UserRead struct {
	ID       int     `json:"id"`
	Email    string  `json:"email"`
	FullName string  `json:"full_name"`
	Role     string  `json:"role"`
	AreaID   *int    `json:"area_id"`
	Rut      *string `json:"rut,omitempty"`
	Cargo    *string `json:"cargo,omitempty"`
}

type UserCreate struct {
	Email    string  `json:"email"`
	FullName string  `json:"full_name"`
	Role     string  `json:"role"`
	Password string  `json:"password"`
	AreaID   *int    `json:"area_id"`
	Rut      *string `json:"rut,omitempty"`
	Cargo    *string `json:"cargo,omitempty"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type Token struct {
	AccessToken string   `json:"access_token"`
	TokenType   string   `json:"token_type"`
	User        UserRead `json:"user"`
}

// Area structs
type Area struct {
	ID            int    `json:"id"`
	Nombre        string `json:"nombre"`
	Descripcion   string `json:"descripcion"`
	ResponsableID *int   `json:"responsable_id"`
}

type AreaCreate struct {
	Nombre        string `json:"nombre"`
	Descripcion   string `json:"descripcion"`
	ResponsableID *int   `json:"responsable_id"`
}

// Project, Fase & Tarea structs
type Project struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Stage       string    `json:"stage"`
	Progress    int       `json:"progress"`
	Owner       string    `json:"owner"`
	Summary     string    `json:"summary"`
	FechaInicio string    `json:"fecha_inicio"`
	FechaFin    string    `json:"fecha_fin"`
	Estado      string    `json:"estado"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Tarea struct {
	ID                int     `json:"id"`
	Nombre            string  `json:"nombre"`
	Descripcion       string  `json:"descripcion"`
	FaseID            int     `json:"fase_id"`
	AreaResponsableID *int    `json:"area_responsable_id"`
	UsuarioAsignadoID *int    `json:"usuario_asignado_id"`
	FechaInicio       string  `json:"fecha_inicio"`
	FechaFin          string  `json:"fecha_fin"`
	Estado            string  `json:"estado"`
	DependenciaDe     *int    `json:"dependencia_de"`
}

type Fase struct {
	ID                    int     `json:"id"`
	Nombre                string  `json:"nombre"`
	Orden                 int     `json:"orden"`
	FechaInicioPlan       string  `json:"fecha_inicio_plan"`
	FechaFinPlan          string  `json:"fecha_fin_plan"`
	Ponderacion           int     `json:"ponderacion"`
	ResueltoExternamente  bool    `json:"resuelto_externamente"`
	MotivoResueltoExterno string  `json:"motivo_resuelto_externo"`
	ProyectoID            int     `json:"proyecto_id"`
	Tareas                []Tarea `json:"tareas"`
}

// Matrix (RAT)
type MatrizLevantamiento struct {
	ID         int         `json:"id"`
	AreaID     int         `json:"area_id"`
	DatosJSON  interface{} `json:"datos_json"`
	Completada bool        `json:"completada"`
}

// Risk (EIPD / 5x5)
type Riesgo struct {
	ID           int    `json:"id"`
	MatrizID     *int   `json:"matriz_id"`
	Nivel        string `json:"nivel"`
	Descripcion  string `json:"descripcion"`
	Puntuacion   int    `json:"puntuacion"`
	Probabilidad int    `json:"probabilidad"`
	Impacto      int    `json:"impacto"`
	RequiereEIPD bool   `json:"requiere_eipd"`
}

type ImpactAssessment struct {
	ID                     int    `json:"id"`
	Titulo                 string `json:"titulo"`
	AreaID                 int    `json:"area_id"`
	ProcesoRelacionado     string `json:"proceso_relacionado"`
	MotivoAltoRiesgo       string `json:"motivo_alto_riesgo"`
	DescripcionTratamiento string `json:"descripcion_tratamiento"`
	AnalisisNecesidad      string `json:"analisis_necesidad"`
	RiesgosDerechos        string `json:"riesgos_derechos"`
	MedidasMitigacion      string `json:"medidas_mitigacion"`
	RiesgoResidual         string `json:"riesgo_residual"`
	OpinionDPO             string `json:"opinion_dpo"`
	Estado                 string `json:"estado"`
	Area                   *Area  `json:"area,omitempty"`
}

// Providers (DPA / Supply Chain)
type Proveedor struct {
	ID                   int     `json:"id"`
	Nombre               string  `json:"nombre"`
	Rut                  string  `json:"rut"`
	Servicio             string  `json:"servicio"`
	FechaContratoInicio  string  `json:"fecha_contrato_inicio"`
	FechaContratoFin     string  `json:"fecha_contrato_fin"`
	AreaID               *int    `json:"area_id"`
	Area                 *Area   `json:"area,omitempty"`
	CriticidadCiber      string  `json:"criticidad_ciber"`
	ClausulaANCIFirmada  bool    `json:"clausula_anci_firmada"`
	DPAFirmado           bool    `json:"dpa_firmado"`
	PaisAlojamiento      string  `json:"pais_alojamiento"`
	SLANotificacionHoras int     `json:"sla_notificacion_horas"`
	EvaluacionSeguridad  string  `json:"evaluacion_seguridad"`
}

// ARCO+ Requests (15d)
type ArcoRequest struct {
	ID                    int       `json:"id"`
	Folio                 string    `json:"folio"`
	TipoDerecho           string    `json:"tipo_derecho"`
	TitularNombre         string    `json:"titular_nombre"`
	TitularRut            string    `json:"titular_rut"`
	TitularEmail          string    `json:"titular_email"`
	FechaIngreso          string    `json:"fecha_ingreso"`
	DiasHabilesLimite     int       `json:"dias_habiles_limite"`
	FechaLimiteLegal      string    `json:"fecha_limite_legal"`
	Estado                string    `json:"estado"`
	DescripcionSolicitud  string    `json:"descripcion_solicitud"`
	FundamentoRespuesta   string    `json:"fundamento_respuesta"`
	AreaDerivadaID        *int      `json:"area_derivada_id"`
	ResponsableAsignadoID *int      `json:"responsable_asignado_id"`
	AreaDerivada          *Area     `json:"area_derivada,omitempty"`
	ResponsableAsignado   *UserRead `json:"responsable_asignado,omitempty"`
}

// Security Breaches (72h)
type SecurityBreach struct {
	ID                        int       `json:"id"`
	CodigoIncidente           string    `json:"codigo_incidente"`
	FechaDeteccion            time.Time `json:"fecha_deteccion"`
	FechaLimiteNotificacion   time.Time `json:"fecha_limite_notificacion"`
	TipoIncidente             string    `json:"tipo_incidente"`
	Gravedad                  string    `json:"gravedad"`
	Descripcion               string    `json:"descripcion"`
	DatosAfectados            string    `json:"datos_afectados"`
	CantidadTitularesAfectados int      `json:"cantidad_titulares_afectados"`
	MedidasContencion         string    `json:"medidas_contencion"`
	NotificadoAgencia         bool      `json:"notificado_agencia"`
	FechaNotificacionAgencia  *time.Time `json:"fecha_notificacion_agencia,omitempty"`
	NotificadoTitulares       bool      `json:"notificado_titulares"`
	Estado                    string    `json:"estado"`
	OrigenCiberseguridad      bool      `json:"origen_ciberseguridad"`
	IncidenteAnciID           *int      `json:"incidente_anci_id,omitempty"`
	CodigoIncidenteCiber      *string   `json:"codigo_incidente_ciber,omitempty"`
	ActivoRSICAfectado        string    `json:"activo_rsic_afectado"`
	ReportadoPorID            *int      `json:"reportado_por_id,omitempty"`
	ReportadoPor              *UserRead `json:"reportado_por,omitempty"`
}

// Training Campaigns
type TrainingCampaign struct {
	ID                    int      `json:"id"`
	Titulo                string   `json:"titulo"`
	Tipo                  string   `json:"tipo"`
	Descripcion           string   `json:"descripcion"`
	FechaInicio           string   `json:"fecha_inicio"`
	FechaFin              string   `json:"fecha_fin"`
	TotalConvocados       int      `json:"total_convocados"`
	TotalCapacitados      int      `json:"total_capacitados"`
	PorcentajeAprobacion  int      `json:"porcentaje_aprobacion"`
	TasaClicPhishing      float64  `json:"tasa_clic_phishing"`
	Estado                string   `json:"estado"`
	InstructorOPlataforma string   `json:"instructor_o_plataforma"`
	AreaResponsableID     *int     `json:"area_responsable_id"`
	AreaResponsable       *Area    `json:"area_responsable,omitempty"`
}

// Documents & Comments
type Comentario struct {
	ID          int       `json:"id"`
	DocumentoID int       `json:"documento_id"`
	UsuarioID   int       `json:"usuario_id"`
	Texto       string    `json:"texto"`
	Fecha       time.Time `json:"fecha"`
	ParentID    *int      `json:"parent_id"`
	Usuario     *UserRead `json:"usuario,omitempty"`
}

type Documento struct {
	ID          int          `json:"id"`
	Tipo        string       `json:"tipo"`
	Contenido   string       `json:"contenido"`
	Version     string       `json:"version"`
	Estado      string       `json:"estado"`
	Comentarios []Comentario `json:"comentarios"`
}

type FlujoAprobacion struct {
	ID               int       `json:"id"`
	DocumentoID      int       `json:"documento_id"`
	EstadoActual     string    `json:"estado_actual"`
	UsuarioOrigenID  *int      `json:"usuario_origen_id"`
	UsuarioDestinoID *int      `json:"usuario_destino_id"`
	Fecha            time.Time `json:"fecha"`
	UsuarioOrigen    *UserRead `json:"usuario_origen,omitempty"`
	UsuarioDestino   *UserRead `json:"usuario_destino,omitempty"`
}

type LogAuditoria struct {
	ID              int         `json:"id"`
	UsuarioID       *int        `json:"usuario_id"`
	Accion          string      `json:"accion"`
	EntidadAfectada string      `json:"entidad_afectada"`
	FechaHora       time.Time   `json:"fecha_hora"`
	DetalleJSON     interface{} `json:"detalle_json"`
	Usuario         *UserRead   `json:"usuario,omitempty"`
}

// ==========================================
// CIBERSEGURIDAD & ANCI (LEY 21.663)
// ==========================================

type CyberAsset struct {
	ID                     int         `json:"id"`
	CodigoActivo           string      `json:"codigo_activo"`
	Nombre                 string      `json:"nombre"`
	Tipo                   string      `json:"tipo"`
	CapaTecnologica        string      `json:"capa_tecnologica"`
	Criticidad             string      `json:"criticidad"`
	ServicioEsencial       string      `json:"servicio_esencial"`
	UbicacionOIp           string      `json:"ubicacion_o_ip"`
	PuertosExpuestos       string      `json:"puertos_expuestos"`
	VersionSO              string      `json:"version_so"`
	ImpactoCaidaServicio   string      `json:"impacto_caida_servicio"`
	DependenciasIDs        interface{} `json:"dependencias_ids"`
	AreaResponsableID      *int        `json:"area_responsable_id"`
	CifradoActivo          bool        `json:"cifrado_activo"`
	MFAActivo              bool        `json:"mfa_activo"`
	RespaldoInmutable      bool        `json:"respaldo_inmutable"`
	EstadoCumplimiento     string      `json:"estado_cumplimiento"`
	AlbergaDatosPersonales bool        `json:"alberga_datos_personales"`
	TratamientosAsociados  string      `json:"tratamientos_asociados"`
	SensibilidadDatos      string      `json:"sensibilidad_datos"`
	AreaResponsable        *Area       `json:"area_responsable,omitempty"`
}

type CyberTarea struct {
	ID                int       `json:"id"`
	Nombre            string    `json:"nombre"`
	Descripcion       string    `json:"descripcion"`
	FaseID            int       `json:"fase_id"`
	AreaResponsableID *int      `json:"area_responsable_id"`
	AreaResponsable   *Area     `json:"area_responsable,omitempty"`
	UsuarioAsignadoID *int      `json:"usuario_asignado_id"`
	UsuarioAsignado   *UserRead `json:"usuario_asignado,omitempty"`
	FechaInicio       string    `json:"fecha_inicio"`
	FechaFin          string    `json:"fecha_fin"`
	Estado            string    `json:"estado"`
	ControlCIS        string    `json:"control_cis"`
	ArticuloLeyANCI   string    `json:"articulo_ley_anci"`
	DependenciaDe     *int      `json:"dependencia_de"`
}

type CyberFase struct {
	ID              int          `json:"id"`
	Nombre          string       `json:"nombre"`
	Orden           int          `json:"orden"`
	Ponderacion     int          `json:"ponderacion"`
	FechaInicioPlan string       `json:"fecha_inicio_plan"`
	FechaFinPlan    string       `json:"fecha_fin_plan"`
	ProyectoID      int          `json:"proyecto_id"`
	Tareas          []CyberTarea `json:"tareas"`
}

type CyberRisk struct {
	ID                  int         `json:"id"`
	Amenaza             string      `json:"amenaza"`
	CategoriaMitre      string      `json:"categoria_mitre"`
	ActivoID            *int        `json:"activo_id"`
	Activo              *CyberAsset `json:"activo,omitempty"`
	Probabilidad        int         `json:"probabilidad"`
	Impacto             int         `json:"impacto"`
	Puntuacion          int         `json:"puntuacion"`
	NivelRiesgo         string      `json:"nivel_riesgo"`
	ControlesExistentes string      `json:"controles_existentes"`
	PlanTratamiento     string      `json:"plan_tratamiento"`
	Estado              string      `json:"estado"`
	ResponsableID       *int        `json:"responsable_id"`
	Responsable         *UserRead   `json:"responsable,omitempty"`
}

type CyberIncidentANCI struct {
	ID                       int         `json:"id"`
	CodigoIncidente          string      `json:"codigo_incidente"`
	FechaDeteccion           time.Time   `json:"fecha_deteccion"`
	FechaLimiteAlerta3h      time.Time   `json:"fecha_limite_alerta_3h"`
	FechaLimiteInforme72h    time.Time   `json:"fecha_limite_informe_72h"`
	TipoAtaque               string      `json:"tipo_ataque"`
	Severidad                string      `json:"severidad"`
	AfectaServicioEsencial   bool        `json:"afecta_servicio_esencial"`
	Descripcion              string      `json:"descripcion"`
	SistemasComprometidos    string      `json:"sistemas_comprometidos"`
	MedidasContencionAplicadas string    `json:"medidas_contencion_aplicadas"`
	IOCsJSON                 interface{} `json:"iocs_json"`
	ChecklistForenseJSON     interface{} `json:"checklist_forense_json"`
	TiempoDeteccionMinutos   int         `json:"tiempo_deteccion_minutos"`
	Alerta3hEnviadaANCI      bool        `json:"alerta_3h_enviada_anci"`
	FechaAlerta3hANCI        *time.Time  `json:"fecha_alerta_3h_anci,omitempty"`
	Informe72hEnviadoANCI    bool        `json:"informe_72h_enviado_anci"`
	FechaInforme72hANCI      *time.Time  `json:"fecha_informe_72h_anci,omitempty"`
	Estado                   string      `json:"estado"`
	ReportadoPorID           *int        `json:"reportado_por_id,omitempty"`
	ReportadoPor             *UserRead   `json:"reportado_por,omitempty"`
	AfectaDatosPersonales    bool        `json:"afecta_datos_personales"`
	BrechaSeguridadID        *int        `json:"brecha_seguridad_id,omitempty"`
	CodigoBrechaRelacionada  *string     `json:"codigo_brecha_relacionada,omitempty"`
	TratamientosAfectados    string      `json:"tratamientos_afectados"`
}

type CyberSimulation struct {
	ID                    int         `json:"id"`
	CodigoEjercicio       string      `json:"codigo_ejercicio"`
	Titulo                string      `json:"titulo"`
	TipoEscenario         string      `json:"tipo_escenario"`
	EscenarioNarrativa    string      `json:"escenario_narrativa"`
	FechaEjecucion        string      `json:"fecha_ejecucion"`
	TiempoRespuestaMinutos int        `json:"tiempo_respuesta_minutos"`
	ParticipantesJSON     interface{} `json:"participantes_json"`
	CumplioPlazo3h        bool        `json:"cumplio_plazo_3h"`
	LeccionesAprendidas   string      `json:"lecciones_aprendidas"`
	Estado                string      `json:"estado"`
}

type CyberPolicy struct {
	ID        int    `json:"id"`
	Tipo      string `json:"tipo"`
	Titulo    string `json:"titulo"`
	Contenido string `json:"contenido"`
	Version   string `json:"version"`
	Estado    string `json:"estado"`
}

type CyberMaturityAssessment struct {
	ID                   int    `json:"id"`
	Titulo               string `json:"titulo"`
	FechaEvaluacion      string `json:"fecha_evaluacion"`
	PorcentajeIdentificar int   `json:"porcentaje_identificar"`
	PorcentajeProteger   int    `json:"porcentaje_proteger"`
	PorcentajeDetectar   int    `json:"porcentaje_detectar"`
	PorcentajeResponder  int    `json:"porcentaje_responder"`
	PorcentajeRecuperar  int    `json:"porcentaje_recuperar"`
	MadurezGlobal        int    `json:"madurez_global"`
	ConclusionesCISO     string `json:"conclusiones_ciso"`
	Estado               string `json:"estado"`
}

type CvdReport struct {
	ID                 int     `json:"id"`
	Folio              string  `json:"folio"`
	Titulo             string  `json:"titulo"`
	InvestigadorAlias  string  `json:"investigador_alias"`
	InvestigadorEmail  string  `json:"investigador_email"`
	ActivoAfectado     string  `json:"activo_afectado"`
	Severidad          string  `json:"severidad"`
	CvssScore          float64 `json:"cvss_score"`
	DescripcionTecnica string  `json:"descripcion_tecnica"`
	PoaRemediacion     string  `json:"poa_remediacion"`
	Estado             string  `json:"estado"`
	HashEvidencia      string  `json:"hash_evidencia"`
	CreatedAt          string  `json:"created_at"`
}

type TelemetryEvent struct {
	ID              int         `json:"id"`
	Fuente          string      `json:"fuente"`
	TipoEvento      string      `json:"tipo_evento"`
	NivelAlerta     string      `json:"nivel_alerta"`
	OrigenIP        string      `json:"origen_ip"`
	DestinoRecurso  string      `json:"destino_recurso"`
	Mensaje         string      `json:"mensaje"`
	Timestamp       time.Time   `json:"timestamp"`
	PayloadJSON     interface{} `json:"payload_json"`
	RequiereAccion  bool        `json:"requiere_accion"`
}

// Backward compatibility legacy structs
type Activity struct {
	ID         int    `json:"id"`
	Name       string `json:"name"`
	Area       string `json:"area"`
	Purpose    string `json:"purpose"`
	LegalBasis string `json:"legal_basis"`
	RiskLevel  string `json:"risk_level"`
}

type Finding struct {
	ID             int    `json:"id"`
	Title          string `json:"title"`
	Severity       string `json:"severity"`
	Status         string `json:"status"`
	Recommendation string `json:"recommendation"`
}

type Consent struct {
	ID          int    `json:"id"`
	DataSubject string `json:"data_subject"`
	Channel     string `json:"channel"`
	Purpose     string `json:"purpose"`
	Status      string `json:"status"`
}

type CaseTicket struct {
	ID       int    `json:"id"`
	Subject  string `json:"subject"`
	Category string `json:"category"`
	Status   string `json:"status"`
}
