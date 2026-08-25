package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/jamesisla/DP/internal/database"
	"github.com/jamesisla/DP/internal/middleware"
	"github.com/jamesisla/DP/internal/models"
)

type LegacyHandler struct{}

func NewLegacyHandler() *LegacyHandler {
	return &LegacyHandler{}
}

// Activities
func (h *LegacyHandler) GetActivities(w http.ResponseWriter, r *http.Request) {
	rows, _ := database.DB.Query(`SELECT id, name, area, purpose, legal_basis, risk_level FROM treatment_activities ORDER BY id ASC`)
	defer rows.Close()

	list := []models.Activity{}
	for rows.Next() {
		var a models.Activity
		if err := rows.Scan(&a.ID, &a.Name, &a.Area, &a.Purpose, &a.LegalBasis, &a.RiskLevel); err == nil {
			list = append(list, a)
		}
	}
	middleware.WriteJSON(w, http.StatusOK, list)
}

func (h *LegacyHandler) CreateActivity(w http.ResponseWriter, r *http.Request) {
	var req models.Activity
	json.NewDecoder(r.Body).Decode(&req)
	res, _ := database.DB.Exec(`INSERT INTO treatment_activities (name, area, purpose, legal_basis, risk_level) VALUES (?, ?, ?, ?, ?)`, req.Name, req.Area, req.Purpose, req.LegalBasis, req.RiskLevel)
	id, _ := res.LastInsertId()
	req.ID = int(id)
	middleware.WriteJSON(w, http.StatusCreated, req)
}

func (h *LegacyHandler) UpdateActivity(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idStr)
	var req models.Activity
	json.NewDecoder(r.Body).Decode(&req)
	database.DB.Exec(`UPDATE treatment_activities SET name = ?, area = ?, purpose = ?, legal_basis = ?, risk_level = ? WHERE id = ?`, req.Name, req.Area, req.Purpose, req.LegalBasis, req.RiskLevel, id)
	req.ID = id
	middleware.WriteJSON(w, http.StatusOK, req)
}

func (h *LegacyHandler) DeleteActivity(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idStr)
	database.DB.Exec(`DELETE FROM treatment_activities WHERE id = ?`, id)
	w.WriteHeader(http.StatusNoContent)
}

// Findings
func (h *LegacyHandler) GetFindings(w http.ResponseWriter, r *http.Request) {
	rows, _ := database.DB.Query(`SELECT id, title, severity, status, recommendation FROM findings ORDER BY id ASC`)
	defer rows.Close()

	list := []models.Finding{}
	for rows.Next() {
		var f models.Finding
		if err := rows.Scan(&f.ID, &f.Title, &f.Severity, &f.Status, &f.Recommendation); err == nil {
			list = append(list, f)
		}
	}
	middleware.WriteJSON(w, http.StatusOK, list)
}

func (h *LegacyHandler) CreateFinding(w http.ResponseWriter, r *http.Request) {
	var req models.Finding
	json.NewDecoder(r.Body).Decode(&req)
	res, _ := database.DB.Exec(`INSERT INTO findings (title, severity, status, recommendation) VALUES (?, ?, ?, ?)`, req.Title, req.Severity, req.Status, req.Recommendation)
	id, _ := res.LastInsertId()
	req.ID = int(id)
	middleware.WriteJSON(w, http.StatusCreated, req)
}

func (h *LegacyHandler) UpdateFinding(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idStr)
	var req models.Finding
	json.NewDecoder(r.Body).Decode(&req)
	database.DB.Exec(`UPDATE findings SET title = ?, severity = ?, status = ?, recommendation = ? WHERE id = ?`, req.Title, req.Severity, req.Status, req.Recommendation, id)
	req.ID = id
	middleware.WriteJSON(w, http.StatusOK, req)
}

func (h *LegacyHandler) DeleteFinding(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idStr)
	database.DB.Exec(`DELETE FROM findings WHERE id = ?`, id)
	w.WriteHeader(http.StatusNoContent)
}

// Consents
func (h *LegacyHandler) GetConsents(w http.ResponseWriter, r *http.Request) {
	rows, _ := database.DB.Query(`SELECT id, data_subject, channel, purpose, status FROM consents ORDER BY id ASC`)
	defer rows.Close()

	list := []models.Consent{}
	for rows.Next() {
		var c models.Consent
		if err := rows.Scan(&c.ID, &c.DataSubject, &c.Channel, &c.Purpose, &c.Status); err == nil {
			list = append(list, c)
		}
	}
	middleware.WriteJSON(w, http.StatusOK, list)
}

func (h *LegacyHandler) CreateConsent(w http.ResponseWriter, r *http.Request) {
	var req models.Consent
	json.NewDecoder(r.Body).Decode(&req)
	res, _ := database.DB.Exec(`INSERT INTO consents (data_subject, channel, purpose, status) VALUES (?, ?, ?, ?)`, req.DataSubject, req.Channel, req.Purpose, req.Status)
	id, _ := res.LastInsertId()
	req.ID = int(id)
	middleware.WriteJSON(w, http.StatusCreated, req)
}

func (h *LegacyHandler) UpdateConsent(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idStr)
	var req models.Consent
	json.NewDecoder(r.Body).Decode(&req)
	database.DB.Exec(`UPDATE consents SET data_subject = ?, channel = ?, purpose = ?, status = ? WHERE id = ?`, req.DataSubject, req.Channel, req.Purpose, req.Status, id)
	req.ID = id
	middleware.WriteJSON(w, http.StatusOK, req)
}

func (h *LegacyHandler) DeleteConsent(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idStr)
	database.DB.Exec(`DELETE FROM consents WHERE id = ?`, id)
	w.WriteHeader(http.StatusNoContent)
}

// Tickets
func (h *LegacyHandler) GetTickets(w http.ResponseWriter, r *http.Request) {
	rows, _ := database.DB.Query(`SELECT id, subject, category, status FROM case_tickets ORDER BY id ASC`)
	defer rows.Close()

	list := []models.CaseTicket{}
	for rows.Next() {
		var t models.CaseTicket
		if err := rows.Scan(&t.ID, &t.Subject, &t.Category, &t.Status); err == nil {
			list = append(list, t)
		}
	}
	middleware.WriteJSON(w, http.StatusOK, list)
}

func (h *LegacyHandler) CreateTicket(w http.ResponseWriter, r *http.Request) {
	var req models.CaseTicket
	json.NewDecoder(r.Body).Decode(&req)
	res, _ := database.DB.Exec(`INSERT INTO case_tickets (subject, category, status) VALUES (?, ?, ?)`, req.Subject, req.Category, req.Status)
	id, _ := res.LastInsertId()
	req.ID = int(id)
	middleware.WriteJSON(w, http.StatusCreated, req)
}

func (h *LegacyHandler) UpdateTicket(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idStr)
	var req models.CaseTicket
	json.NewDecoder(r.Body).Decode(&req)
	database.DB.Exec(`UPDATE case_tickets SET subject = ?, category = ?, status = ? WHERE id = ?`, req.Subject, req.Category, req.Status, id)
	req.ID = id
	middleware.WriteJSON(w, http.StatusOK, req)
}

func (h *LegacyHandler) DeleteTicket(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idStr)
	database.DB.Exec(`DELETE FROM case_tickets WHERE id = ?`, id)
	w.WriteHeader(http.StatusNoContent)
}
