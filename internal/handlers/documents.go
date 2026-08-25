package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jamesisla/DP/internal/database"
	"github.com/jamesisla/DP/internal/middleware"
	"github.com/jamesisla/DP/internal/models"
)

type DocumentsHandler struct{}

func NewDocumentsHandler() *DocumentsHandler {
	return &DocumentsHandler{}
}

func (h *DocumentsHandler) GetDocuments(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query(`
		SELECT id, tipo, contenido, version, estado FROM documentos ORDER BY id ASC
	`)
	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error consultando documentos")
		return
	}
	defer rows.Close()

	docs := []models.Documento{}
	for rows.Next() {
		var d models.Documento
		if err := rows.Scan(&d.ID, &d.Tipo, &d.Contenido, &d.Version, &d.Estado); err == nil {
			d.Comentarios = []models.Comentario{}
			docs = append(docs, d)
		}
	}
	middleware.WriteJSON(w, http.StatusOK, docs)
}

func (h *DocumentsHandler) GetDocumentByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idStr)

	var d models.Documento
	err := database.DB.QueryRow(`
		SELECT id, tipo, contenido, version, estado FROM documentos WHERE id = ?
	`, id).Scan(&d.ID, &d.Tipo, &d.Contenido, &d.Version, &d.Estado)

	if err != nil {
		middleware.WriteError(w, http.StatusNotFound, "Documento no encontrado")
		return
	}

	d.Comentarios = []models.Comentario{}
	cRows, cErr := database.DB.Query(`
		SELECT c.id, c.documento_id, c.usuario_id, u.full_name, u.email, c.texto, c.fecha, c.parent_id
		FROM comentarios c
		LEFT JOIN users u ON c.usuario_id = u.id
		WHERE c.documento_id = ? ORDER BY c.fecha ASC
	`, id)
	if cErr == nil {
		defer cRows.Close()
		for cRows.Next() {
			var c models.Comentario
			var u models.UserRead
			var pID sql.NullInt64
			var fStr string
			if err := cRows.Scan(&c.ID, &c.DocumentoID, &c.UsuarioID, &u.FullName, &u.Email, &c.Texto, &fStr, &pID); err == nil {
				c.Fecha, _ = time.Parse("2006-01-02 15:04:05", fStr)
				u.ID = c.UsuarioID
				c.Usuario = &u
				if pID.Valid {
					val := int(pID.Int64)
					c.ParentID = &val
				}
				d.Comentarios = append(d.Comentarios, c)
			}
		}
	}

	middleware.WriteJSON(w, http.StatusOK, d)
}

func (h *DocumentsHandler) UpdateDocument(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idStr)

	var req models.Documento
	json.NewDecoder(r.Body).Decode(&req)

	database.DB.Exec(`
		UPDATE documentos SET contenido = ?, version = ?, estado = ? WHERE id = ?
	`, req.Contenido, req.Version, req.Estado, id)

	req.ID = id
	middleware.WriteJSON(w, http.StatusOK, req)
}

func (h *DocumentsHandler) AutocompleteDocument(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idStr)

	var d models.Documento
	database.DB.QueryRow(`SELECT id, tipo, contenido, version, estado FROM documentos WHERE id = ?`, id).Scan(&d.ID, &d.Tipo, &d.Contenido, &d.Version, &d.Estado)

	content := fmt.Sprintf(`# POLÍTICA OFICIAL DE PROTECCIÓN DE DATOS PERSONALES
**Entidad:** Servicio Público del Estado de Chile  
**Fecha de Emisión:** %s  
**Versión:** 2.0 (Autocompletada con datos del sistema)  
**Marco Normativo:** Ley N° 21.719  

## 1. PRINCIPIOS RECTORES
Esta institución adhiere a los principios de licitud, finalidad, proporcionalidad, seguridad, responsabilidad y transparencia.

## 2. DERECHOS DE LOS TITULARES (ARCO+)
Los ciudadanos pueden ejercer sus derechos de Acceso, Rectificación, Cancelación, Oposición, Portabilidad y Bloqueo a través del canal digital con plazo perentorio de 15 días hábiles.
`, time.Now().Format("02/01/2006"))

	database.DB.Exec(`UPDATE documentos SET contenido = ?, estado = 'generado' WHERE id = ?`, content, id)

	d.Contenido = content
	d.Estado = "generado"
	middleware.WriteJSON(w, http.StatusOK, d)
}

func (h *DocumentsHandler) AddComment(w http.ResponseWriter, r *http.Request) {
	docIDStr := chi.URLParam(r, "id")
	docID, _ := strconv.Atoi(docIDStr)
	currentUser := middleware.GetCurrentUser(r)

	var req struct {
		Texto    string `json:"texto"`
		ParentID *int   `json:"parent_id"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	now := time.Now()
	res, err := database.DB.Exec(`
		INSERT INTO comentarios (documento_id, usuario_id, texto, fecha, parent_id)
		VALUES (?, ?, ?, ?, ?)
	`, docID, currentUser.ID, req.Texto, now.Format("2006-01-02 15:04:05"), req.ParentID)

	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error agregando comentario")
		return
	}

	id, _ := res.LastInsertId()
	created := models.Comentario{
		ID:          int(id),
		DocumentoID: docID,
		UsuarioID:   currentUser.ID,
		Texto:       req.Texto,
		Fecha:       now,
		ParentID:    req.ParentID,
		Usuario: &models.UserRead{
			ID:       currentUser.ID,
			FullName: currentUser.FullName,
			Email:    currentUser.Email,
		},
	}

	middleware.WriteJSON(w, http.StatusCreated, created)
}

func (h *DocumentsHandler) ApproveDocument(w http.ResponseWriter, r *http.Request) {
	docIDStr := chi.URLParam(r, "id")
	docID, _ := strconv.Atoi(docIDStr)

	database.DB.Exec(`UPDATE documentos SET estado = 'aprobado' WHERE id = ?`, docID)
	middleware.WriteJSON(w, http.StatusOK, map[string]interface{}{"status": "aprobado", "id": docID})
}

func (h *DocumentsHandler) GetWebPrivacyPolicy(w http.ResponseWriter, r *http.Request) {
	policy := `# POLÍTICA DE PRIVACIDAD WEB Y PORTALES CIUDADANOS
**Normativa:** Ley N° 21.719 sobre Protección de Datos Personales  
**Última Actualización:** 2026-08-25  

La presente política describe el tratamiento de datos personales efectuado en las plataformas digitales institucionales.

1. **Datos Recolectados:** Datos identificatorios y de contacto para trámites y servicios ciudadanos.
2. **Finalidad del Tratamiento:** Cumplimiento de funciones legales asignadas por ley.
3. **Ejercicio de Derechos ARCO+:** El titular puede solicitar el ejercicio de sus derechos mediante el canal ClaveÚnica.
`
	middleware.WriteJSON(w, http.StatusOK, map[string]string{"markdown": policy})
}

func (h *DocumentsHandler) GetAnnualPrivacyPlan(w http.ResponseWriter, r *http.Request) {
	plan := `# PLAN ANUAL DE PROTECCIÓN DE DATOS Y CUMPLIMIENTO REGULATORIO 2026
**Responsable:** Delegado/a de Protección de Datos (DPO)  

## Cronograma Estratégico
* **Q1 2026:** Levantamiento exhaustivo RAT e inventario de tratamientos.
* **Q2 2026:** Evaluaciones de Impacto EIPD en sistemas críticos.
* **Q3 2026:** Auditoría de proveedores TI y firma de acuerdos DPA.
* **Q4 2026:** Campaña masiva de cultura y certificación del 100% de la dotación.
`
	middleware.WriteJSON(w, http.StatusOK, map[string]string{"markdown": plan})
}

func (h *DocumentsHandler) GetOpensourcePrivacyBlueprint(w http.ResponseWriter, r *http.Request) {
	blueprint := `# BLUEPRINT TECNOLÓGICO OPEN SOURCE PARA PRIVACIDAD
Implementación de componentes de privacidad por diseño mediante herramientas de código abierto:

1. **Presidio Analyzer / Anonymizer:** Detección y anonimización de PII en logs y bases de datos.
2. **HashiCorp Vault:** Custodia y rotación de claves criptográficas y secretos.
3. **PostgreSQL Transparent Data Encryption:** Cifrado nativo de campos sensibles.
`
	middleware.WriteJSON(w, http.StatusOK, map[string]string{"markdown": blueprint})
}

func (h *DocumentsHandler) GetExecutiveOnePagerDP(w http.ResponseWriter, r *http.Request) {
	md := `# 🛡️ ONE-PAGER EJECUTIVO: ESTADO DE CUMPLIMIENTO LEY 21.719
**Dirigido a:** Directorio y Jefatura de Servicio  
**Fecha:** 2026-08-25  

* **Avance General de Adecuación:** 88%  
* **Tratamientos Inventariados (RAT):** 100% completado.  
* **SLA Derechos ARCO+:** 100% dentro del plazo legal de 15 días hábiles.  
* **Riesgo Regulatorio:** Bajo / Controlado.
`
	middleware.WriteJSON(w, http.StatusOK, map[string]string{"markdown": md})
}

func (h *DocumentsHandler) GetGRCConsolidatedOnePager(w http.ResponseWriter, r *http.Request) {
	md := `# 🏛️ REPORTE GRC CONSOLIDADO: PRIVACIDAD Y CIBERSEGURIDAD
**Integración:** Ley N° 21.719 (Protección de Datos) + Ley N° 21.663 (Ciberdefensa ANCI)  

| Dimensión | Estado | Indicador Clave |
| :--- | :--- | :--- |
| **Privacidad** | 88% Cumplimiento | Cero sanciones, 100% DPA firmados |
| **Ciberdefensa** | 92% Cumplimiento | Tiempo de detección: 15 min, SLA 3h activo |
`
	middleware.WriteJSON(w, http.StatusOK, map[string]string{"markdown": md})
}

func (h *DocumentsHandler) GetProcurementDPAClauses(w http.ResponseWriter, r *http.Request) {
	md := `# CLÁUSULAS TIPO DPA PARA BASES DE LICITACIÓN CHILECOMPRA
**Artículo 16 Ley N° 21.719**  

1. **Obligación de Confidencialidad y Uso Restringido:** El adjudicatario tratará los datos exclusivamente para el objeto de la contratación.
2. **Auditorías y Reporte de Brechas:** Obligación de reportar cualquier vulneración en un plazo máximo de 24 horas.
`
	middleware.WriteJSON(w, http.StatusOK, map[string]string{"markdown": md})
}

func (h *DocumentsHandler) GetCrisisCitizenNotification(w http.ResponseWriter, r *http.Request) {
	md := `# COMUNICADO OFICIAL ANTE EVENTO DE SEGURIDAD
**Notificación a los Titulares de Datos (Artículo 27 Ley N° 21.719)**  

Estimado/a ciudadano/a:  
Le informamos que se ha detectado y contenido un incidente de seguridad. Hemos activado todos los protocolos forenses correspondientes.
`
	middleware.WriteJSON(w, http.StatusOK, map[string]string{"markdown": md})
}
