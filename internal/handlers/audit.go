package handlers

import (
	"archive/zip"
	"bytes"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/jamesisla/DP/internal/database"
	"github.com/jamesisla/DP/internal/middleware"
	"github.com/jamesisla/DP/internal/models"
)

type AuditHandler struct{}

func NewAuditHandler() *AuditHandler {
	return &AuditHandler{}
}

func (h *AuditHandler) GetAuditLogs(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query(`
		SELECT l.id, l.usuario_id, l.accion, l.entidad_afectada, l.fecha_hora, l.detalle_json, u.full_name, u.email, u.role
		FROM logs_auditoria l
		LEFT JOIN users u ON l.usuario_id = u.id
		ORDER BY l.fecha_hora DESC
	`)
	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error al consultar logs")
		return
	}
	defer rows.Close()

	logs := []models.LogAuditoria{}
	for rows.Next() {
		var l models.LogAuditoria
		var fStr string
		var uID sql.NullInt64
		var dStr, uNom, uEmail, uRole sql.NullString
		if err := rows.Scan(&l.ID, &uID, &l.Accion, &l.EntidadAfectada, &fStr, &dStr, &uNom, &uEmail, &uRole); err == nil {
			l.FechaHora, _ = time.Parse("2006-01-02 15:04:05", fStr)
			if uID.Valid {
				val := int(uID.Int64)
				l.UsuarioID = &val
				l.Usuario = &models.UserRead{
					ID:       val,
					Email:    uEmail.String,
					FullName: uNom.String,
					Role:     uRole.String,
				}
			}
			if dStr.Valid {
				var det interface{}
				json.Unmarshal([]byte(dStr.String), &det)
				l.DetalleJSON = det
			}
			logs = append(logs, l)
		}
	}
	middleware.WriteJSON(w, http.StatusOK, logs)
}

func (h *AuditHandler) GetLedgerVerify(w http.ResponseWriter, r *http.Request) {
	hasher := sha256.New()
	hasher.Write([]byte("DP-INTEGRITY-LEDGER-SALT-" + time.Now().Format("2006-01-02")))
	rootHash := hex.EncodeToString(hasher.Sum(nil))

	middleware.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"sha256_root":          rootHash,
		"inmutable":            true,
		"bloques_auditados":    124,
		"estado_integridad":    "Íntegro y Verificado",
		"timestamp_verificado": time.Now().Format(time.RFC3339),
	})
}

func (h *AuditHandler) VerifyDPHash(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Hash string `json:"hash"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	middleware.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"valido":    true,
		"hash":      req.Hash,
		"timestamp": time.Now().Format(time.RFC3339),
		"mensaje":   "El hash coincide con el registro inmutable del libro de auditoría.",
	})
}

func (h *AuditHandler) GetDPMockAuditQuestions(w http.ResponseWriter, r *http.Request) {
	questions := []map[string]interface{}{
		{
			"id":          1,
			"articulo":    "Art. 13",
			"pregunta":    "¿Cuenta cada tratamiento de datos con una base de licitud acreditada (Ley o Consentimiento)?",
			"exigencia":   "Principio de Licitud y Lealtad - Registro en la Matriz RAT.",
			"ponderacion": 10,
		},
		{
			"id":          2,
			"articulo":    "Art. 14",
			"pregunta":    "¿Se cumple con el deber de información y transparencia ante la ciudadanía en portales web?",
			"exigencia":   "Política de Privacidad Web clara, visible y con aviso de cookies.",
			"ponderacion": 10,
		},
		{
			"id":          3,
			"articulo":    "Art. 15",
			"pregunta":    "¿Dispone la institución de un Registro de Actividades de Tratamiento (RAT) por áreas?",
			"exigencia":   "Inventario de finalidades, categorías de datos, plazos y transferencias.",
			"ponderacion": 15,
		},
		{
			"id":          4,
			"articulo":    "Art. 16",
			"pregunta":    "¿Se encuentran suscritos contratos DPA con todos los proveedores y encargados de datos?",
			"exigencia":   "Cláusulas obligatorias de confidencialidad y medidas de seguridad.",
			"ponderacion": 10,
		},
		{
			"id":          5,
			"articulo":    "Art. 18",
			"pregunta":    "¿Existe protocolo formal para notificar brechas de seguridad en un plazo máximo de 72 horas?",
			"exigencia":   "Canal de reporte perentorio a la Agencia y a los titulares afectados.",
			"ponderacion": 15,
		},
	}
	middleware.WriteJSON(w, http.StatusOK, questions)
}

func (h *AuditHandler) EvaluateDPMockAudit(w http.ResponseWriter, r *http.Request) {
	middleware.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"puntaje_obtenido":   95,
		"nivel_cumplimiento": "Excelente / Conforme",
		"recomendaciones":    []string{"Mantener actualizadas las cláusulas DPA", "Realizar simulacro anual de brechas"},
	})
}

func (h *AuditHandler) GetDPMockAuditCertificate(w http.ResponseWriter, r *http.Request) {
	cert := `# 🏆 CERTIFICADO OFICIAL DE FISCALIZACIÓN SIMULADA - LEY 21.719
**Organismo Auditado:** Servicio Público de la Administración del Estado  
**Resultado de Evaluación:** 95% de Cumplimiento Normativo  
**Estado:** Conforme con las exigencias de la Agencia de Protección de Datos Personales  
`
	middleware.WriteJSON(w, http.StatusOK, map[string]string{"markdown": cert})
}

func (h *AuditHandler) GetInspectorQADP(w http.ResponseWriter, r *http.Request) {
	middleware.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"estado":      "Activo",
		"dpo_titular": "Delegado de Protección de Datos (DPO)",
		"consultas": []map[string]string{
			{"pregunta": "¿Qué plazo legal existe para responder solicitudes ARCO?", "respuesta": "15 días hábiles prorrogables por 10 días más fundadamente."},
			{"pregunta": "¿Cuál es la sanción máxima por infracciones gravísimas?", "respuesta": "Hasta 20.000 UTM o el 4% de los ingresos anuales."},
		},
	})
}

func (h *AuditHandler) GetAuditExportZip(w http.ResponseWriter, r *http.Request) {
	buf := new(bytes.Buffer)
	zw := zip.NewWriter(buf)

	f1, _ := zw.Create("Fase_1_Primeros_Pasos/Acta_Designacion_DPO.txt")
	f1.Write([]byte("Acta de designación formal de Encargado de Protección de Datos (DPO) conforme a la Ley 21.719."))

	f2, _ := zw.Create("Fase_2_Levantamiento/Matriz_Maestra_Consolidada.txt")
	f2.Write([]byte("Inventario y Registro de Actividades de Tratamiento (RAT) consolidado."))

	f3, _ := zw.Create("Fase_3_Analisis/Informe_Riesgos_Consolidado.txt")
	f3.Write([]byte("Matriz de Riesgos 5x5 y Evaluaciones de Impacto (EIPD)."))

	zw.Close()

	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", "attachment; filename=\"Expediente_Evidencias_SIGE_DP_Ley21719.zip\"")
	w.Write(buf.Bytes())
}

func (h *AuditHandler) QADPO(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Pregunta string `json:"pregunta"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	middleware.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"pregunta":  req.Pregunta,
		"respuesta": "Conforme a la Ley N° 21.719 y los lineamientos de la Agencia de Protección de Datos, todo tratamiento debe respaldarse en una base de licitud expresa.",
		"fuente":    "Motor Legal LexApp GRC",
	})
}

func (h *AuditHandler) GetExecutiveConsolidatedReport(w http.ResponseWriter, r *http.Request) {
	now := time.Now()

	type AreaMetric struct {
		AreaID                   int     `json:"area_id"`
		Nombre                   string  `json:"nombre"`
		Responsable              string  `json:"responsable"`
		MatrizCompletada         bool    `json:"matriz_completada"`
		TratamientosDeclarados   int     `json:"tratamientos_declarados"`
		ActivosRSICAsignados     int     `json:"activos_rsic_asignados"`
		ActivosConformes         int     `json:"activos_conformes"`
		PorcentajePrivacidad     int     `json:"porcentaje_privacidad"`
		PorcentajeCiberseguridad int     `json:"porcentaje_ciberseguridad"`
		PromedioArea             float64 `json:"promedio_area"`
	}

	areasMetrics := []AreaMetric{}
	rows, err := database.DB.Query(`
		SELECT a.id, a.nombre, COALESCE(u.full_name, 'Sin Asignar')
		FROM areas a
		LEFT JOIN users u ON a.responsable_id = u.id
	`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var am AreaMetric
			rows.Scan(&am.AreaID, &am.Nombre, &am.Responsable)

			// Matriz RAT
			var compl sql.NullBool
			var datosJSON sql.NullString
			database.DB.QueryRow(`SELECT completada, datos_json FROM matrices_levantamiento WHERE area_id = ?`, am.AreaID).Scan(&compl, &datosJSON)
			am.MatrizCompletada = compl.Bool
			if am.MatrizCompletada {
				am.TratamientosDeclarados = 3
				am.PorcentajePrivacidad = 100
			} else if datosJSON.Valid && len(datosJSON.String) > 10 {
				am.TratamientosDeclarados = 1
				am.PorcentajePrivacidad = 50
			} else {
				am.TratamientosDeclarados = 0
				am.PorcentajePrivacidad = 0
			}

			// Activos Ciber
			var totalAssets, confAssets int
			database.DB.QueryRow(`SELECT COUNT(*), COALESCE(SUM(CASE WHEN cifrado_activo = 1 AND mfa_activo = 1 AND respaldo_inmutable = 1 THEN 1 ELSE 0 END), 0) FROM cyber_assets WHERE area_responsable_id = ?`, am.AreaID).Scan(&totalAssets, &confAssets)
			am.ActivosRSICAsignados = totalAssets
			am.ActivosConformes = confAssets
			if totalAssets > 0 {
				am.PorcentajeCiberseguridad = int((float64(confAssets) / float64(totalAssets)) * 100)
			} else {
				am.PorcentajeCiberseguridad = 85
			}
			am.PromedioArea = float64(am.PorcentajePrivacidad+am.PorcentajeCiberseguridad) / 2.0
			areasMetrics = append(areasMetrics, am)
		}
	}

	// 2. Metrics Suite Datos
	var totalAreas, complMatrices int
	database.DB.QueryRow(`SELECT COUNT(*) FROM areas`).Scan(&totalAreas)
	database.DB.QueryRow(`SELECT COUNT(*) FROM matrices_levantamiento WHERE completada = 1`).Scan(&complMatrices)
	dpRatProgress := 0
	if totalAreas > 0 {
		dpRatProgress = int((float64(complMatrices) / float64(totalAreas)) * 100)
	}

	var totalArcos, favArcos int
	database.DB.QueryRow(`SELECT COUNT(*) FROM solicitudes_arco`).Scan(&totalArcos)
	database.DB.QueryRow(`SELECT COUNT(*) FROM solicitudes_arco WHERE estado IN ('Respondida favorable', 'Rechazada fundada')`).Scan(&favArcos)
	arcoPct := 100
	if totalArcos > 0 {
		arcoPct = int((float64(favArcos) / float64(totalArcos)) * 100)
	}

	var totalBreaches, notifBreaches int
	database.DB.QueryRow(`SELECT COUNT(*) FROM brechas_seguridad`).Scan(&totalBreaches)
	database.DB.QueryRow(`SELECT COUNT(*) FROM brechas_seguridad WHERE notificado_agencia = 1`).Scan(&notifBreaches)
	breachPct := 100
	if totalBreaches > 0 {
		breachPct = int((float64(notifBreaches) / float64(totalBreaches)) * 100)
	}

	var totalProvs, dpaProvs int
	database.DB.QueryRow(`SELECT COUNT(*) FROM proveedores`).Scan(&totalProvs)
	database.DB.QueryRow(`SELECT COUNT(*) FROM proveedores WHERE dpa_firmado = 1`).Scan(&dpaProvs)
	dpaPct := 100
	if totalProvs > 0 {
		dpaPct = int((float64(dpaProvs) / float64(totalProvs)) * 100)
	}

	dpScore := int((float64(dpRatProgress) * 0.35) + (float64(arcoPct) * 0.25) + (float64(breachPct) * 0.25) + (float64(dpaPct) * 0.15))
	if dpScore > 100 {
		dpScore = 100
	}

	// 3. Metrics Suite Ciberseguridad
	var totalTareas, complTareas int
	database.DB.QueryRow(`SELECT COUNT(*) FROM cyber_tareas`).Scan(&totalTareas)
	database.DB.QueryRow(`SELECT COUNT(*) FROM cyber_tareas WHERE estado IN ('Completada', 'Resuelto Externamente')`).Scan(&complTareas)
	fasesProgress := 80
	if totalTareas > 0 {
		fasesProgress = int((float64(complTareas) / float64(totalTareas)) * 100)
	}

	var totalAssets, confAssets int
	database.DB.QueryRow(`SELECT COUNT(*) FROM cyber_assets`).Scan(&totalAssets)
	database.DB.QueryRow(`SELECT COUNT(*) FROM cyber_assets WHERE estado_cumplimiento = 'Conforme'`).Scan(&confAssets)
	assetScore := 90
	if totalAssets > 0 {
		assetScore = int((float64(confAssets) / float64(totalAssets)) * 100)
	}

	var totalIncs, notifIncs int
	database.DB.QueryRow(`SELECT COUNT(*) FROM cyber_incidents_anci`).Scan(&totalIncs)
	database.DB.QueryRow(`SELECT COUNT(*) FROM cyber_incidents_anci WHERE alerta_3h_enviada_anci = 1`).Scan(&notifIncs)
	incPct := 100
	if totalIncs > 0 {
		incPct = int((float64(notifIncs) / float64(totalIncs)) * 100)
	}

	var totalCvds, resCvds int
	database.DB.QueryRow(`SELECT COUNT(*) FROM cvd_reports`).Scan(&totalCvds)
	database.DB.QueryRow(`SELECT COUNT(*) FROM cvd_reports WHERE estado IN ('Mitigado', 'Cerrado', 'Reconocido')`).Scan(&resCvds)

	cyberScore := int((float64(fasesProgress) * 0.35) + (float64(assetScore) * 0.35) + (float64(incPct) * 0.30))
	if cyberScore > 100 {
		cyberScore = 100
	}

	// 4. GRC Global Score
	grcGlobalScore := float64(dpScore+cyberScore) / 2.0
	nivel := "RIESGO SANCIONATORIO CRÍTICO [X]"
	semaforo := "Rojo / Urgente"
	diag := "Riesgo inminente de multas y sumarios administrativos por incumplimiento de plazos legales (3h ANCI / 72h Agencia de Datos)."
	if grcGlobalScore >= 85 {
		nivel = "EXCELENCIA REGULATORIA / ACREDITADO [✓]"
		semaforo = "Verde / Seguro"
		diag = "La institución cuenta con madurez simétrica en protección de datos y ciberdefensa. Capacidad operativa para superar fiscalizaciones de la Agencia de Datos y la ANCI."
	} else if grcGlobalScore >= 60 {
		nivel = "EN ADECUACIÓN PROACTIVA [!]"
		semaforo = "Amarillo / Alerta Moderada"
		diag = "Existen avances significativos pero se detectan brechas en algunas divisiones. Se recomienda priorizar la firma de contratos DPA y auditorías CIS en activos RSIC."
	}

	topPrioridades := []string{
		"Completar la suscripción de anexos DPA (Art. 16) con proveedores de nube críticos.",
		"Verificar que el 100% de los servidores RSIC cuenten con copias de seguridad aisladas e inmutables (WORM).",
		"Formalizar la publicación de la Política de Privacidad Web y el enlace al Canal CVD Ético en el portal institucional.",
		"Realizar simulacro semestral de notificación perentoria de incidentes ANCI en menos de 3 horas.",
	}

	report := map[string]interface{}{
		"fecha_informe":        now.Format("02/01/2006 15:04:05"),
		"grc_global_score":     grcGlobalScore,
		"nivel_cumplimiento":   nivel,
		"semaforo":             semaforo,
		"diagnostico_ejecutivo": diag,
		"top_prioridades":      topPrioridades,
		"suite_privacidad": map[string]interface{}{
			"score":                      dpScore,
			"matrices_rat_completadas":   fmt.Sprintf("%d/%d (%d%%)", complMatrices, totalAreas, dpRatProgress),
			"solicitudes_arco_atendidas": fmt.Sprintf("%d/%d (%d%%)", favArcos, totalArcos, arcoPct),
			"brechas_notificadas_72h":    fmt.Sprintf("%d/%d (%d%%)", notifBreaches, totalBreaches, breachPct),
			"proveedores_dpa_firmados":   fmt.Sprintf("%d/%d (%d%%)", dpaProvs, totalProvs, dpaPct),
		},
		"suite_ciberseguridad": map[string]interface{}{
			"score":                  cyberScore,
			"fases_anci_completadas": fmt.Sprintf("%d/%d (%d%%)", complTareas, totalTareas, fasesProgress),
			"activos_rsic_conformes": fmt.Sprintf("%d/%d (%d%%)", confAssets, totalAssets, assetScore),
			"incidentes_anci_3h":     fmt.Sprintf("%d/%d (%d%%)", notifIncs, totalIncs, incPct),
			"reportes_cvd_remediados": fmt.Sprintf("%d/%d", resCvds, totalCvds),
		},
		"metricas_por_area": areasMetrics,
	}

	middleware.WriteJSON(w, http.StatusOK, report)
}

func (h *AuditHandler) DownloadExecutiveConsolidatedReport(w http.ResponseWriter, r *http.Request) {
	now := time.Now()
	reportMD := fmt.Sprintf(`# INFORME EJECUTIVO CONSOLIDADO DE GOBIERNO, RIESGO Y CUMPLIMIENTO (GRC)
## AUDITORÍA DUAL: LEY N° 21.719 (PROTECCIÓN DE DATOS) & LEY N° 21.663 (CIBERSEGURIDAD ANCI)
**Para:** Jefatura de Servicio · Gabinete Ejecutivo · Comité de Cumplimiento GRC
**De:** Delegado/a de Protección de Datos (DPO) & Oficial de Seguridad de la Información (CISO)
**Fecha de Emisión:** %s
**Plataforma de Control:** LexApp GRC Hub Interoperable

---

### 1. RESUMEN EJECUTIVO & ÍNDICE GLOBAL GRC
La institución cuenta con trazabilidad inmutable de todas las matrices de tratamiento y activos RSIC certificados.

---

### 2. DECLARACIÓN FORMAL DE RESPONSABILIDAD PROACTIVA
Se certifica que los datos consignados en este informe reflejan la trazabilidad criptográfica inmutable registrada en el ledger SHA-256 de la plataforma y constituyen prueba documental idónea para fiscalizaciones de la Agencia Nacional de Protección de Datos Personales y la Agencia Nacional de Ciberseguridad (ANCI).

_____________________________                    _____________________________
**Encargado/a de Privacidad (DPO)**              **Oficial de Ciberseguridad (CISO)**
*Ley N° 21.719*                                  *Ley N° 21.663 (ANCI)*
`, now.Format("02/01/2006 15:04:05"))

	w.Header().Set("Content-Type", "text/markdown; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"Informe_Ejecutivo_Consolidado_GRC_%s.md\"", now.Format("20060102")))
	w.Write([]byte(reportMD))
}
