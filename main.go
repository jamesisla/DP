package main

import (
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jamesisla/DP/internal/config"
	"github.com/jamesisla/DP/internal/database"
	"github.com/jamesisla/DP/internal/handlers"
	"github.com/jamesisla/DP/internal/middleware"
)

func main() {
	log.Println("==================================================")
	log.Println("🏛️ Iniciando LexApp GRC — Core Monolito Modular en Go")
	log.Println("   (Ley N° 21.719 Privacidad + Ley N° 21.663 ANCI)")
	log.Println("==================================================")

	// 1. Cargar Configuración
	cfg := config.LoadConfig()

	// 2. Conectar a Base de Datos SQLite (WAL)
	_, err := database.InitDB(cfg.DatabasePath)
	if err != nil {
		log.Fatalf("❌ Error crítico inicializando SQLite: %v", err)
	}

	// 3. Inicializar Handlers
	authH := handlers.NewAuthHandler(cfg)
	dashH := handlers.NewDashboardHandler()
	projH := handlers.NewProjectsHandler()
	areaUserH := handlers.NewAreasUsersHandler()
	matrixH := handlers.NewMatrixHandler()
	riskH := handlers.NewRisksHandler()
	provH := handlers.NewProvidersHandler()
	arcoH := handlers.NewArcoHandler()
	breachH := handlers.NewBreachesHandler()
	trainH := handlers.NewTrainingHandler()
	docH := handlers.NewDocumentsHandler()
	auditH := handlers.NewAuditHandler()
	cyberH := handlers.NewCyberHandler()
	gwH := handlers.NewGatewaysHandler()
	legacyH := handlers.NewLegacyHandler()

	// 4. Configurar Router Chi
	r := chi.NewRouter()

	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(chimw.Compress(5))

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// 5. Rutas API
	r.Route("/api", func(api chi.Router) {
		// Health check
		api.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			middleware.WriteJSON(w, http.StatusOK, map[string]string{
				"status":  "ok",
				"app":     "SIGE-DP & Ciberseguridad ANCI (Go Native)",
				"version": "2.0.0",
				"engine":  "Go 1.25 + SQLite WAL",
			})
		})

		// Public Auth
		api.Post("/auth/login", authH.Login)
		api.Post("/auth/claveunica", authH.LoginClaveUnica)

		// Gateways (con y sin prefijo /gateways/)
		registerGateways := func(g chi.Router) {
			g.Post("/simulate-citizen-arco", gwH.SimulateCitizenArco)
			g.Get("/track-arco-citizen", gwH.TrackArcoCitizen)
			g.Post("/simulate-cvd-report", gwH.SimulateCvdReport)
			g.Get("/track-cvd-report", gwH.TrackCvdReport)
			g.Post("/simulate-presidio-scan", gwH.SimulatePresidioScan)
			g.Post("/simulate-wazuh-alert", gwH.SimulateWazuhAlert)
			g.Get("/cvd-reports", gwH.GetCvdReports)
			g.Put("/cvd-reports/{report_id}/status", gwH.UpdateCvdReportStatus)
			g.Get("/telemetry-feed", gwH.GetTelemetryFeed)
		}

		registerGateways(api)
		api.Route("/gateways", registerGateways)

		// Authenticated Endpoints
		api.Group(func(auth chi.Router) {
			auth.Use(middleware.AuthMiddleware(cfg))

			// Auth Me
			auth.Get("/me", authH.Me)

			// Dashboard
			auth.Get("/dashboard", dashH.GetDashboard)
			auth.Get("/compliance-timeline", dashH.GetComplianceTimeline)

			// Projects, Fases & Tasks
			auth.Get("/projects", projH.GetProjects)
			auth.Get("/projects/{project_id}/fases", projH.GetFases)
			auth.Put("/fases/{fase_id}/toggle-externo", projH.ToggleExternoFase)
			auth.Put("/tareas/{tarea_id}", projH.UpdateTarea)

			// Users & Areas
			auth.Get("/users", areaUserH.GetUsers)
			auth.Post("/users", areaUserH.CreateUser)
			auth.Put("/users/{id}", areaUserH.UpdateUser)
			auth.Delete("/users/{id}", areaUserH.DeleteUser)

			auth.Get("/areas", areaUserH.GetAreas)
			auth.Post("/areas", areaUserH.CreateArea)

			// Matrix RAT
			auth.Get("/matrix/my-area", matrixH.GetMyAreaMatrix)
			auth.Post("/matrix", matrixH.CreateOrUpdateMatrix)
			auth.Get("/matrix/master", matrixH.GetMasterMatrix)

			// Risks & EIPD
			auth.Get("/risks", riskH.GetRisks)
			auth.Get("/risks/heatmap", riskH.GetRiskHeatmap)
			auth.Get("/risks/report", riskH.GetRiskReport)
			auth.Get("/risks/fines-simulator", riskH.GetFinesSimulator)
			auth.Get("/impact-assessments", riskH.GetImpactAssessments)
			auth.Post("/impact-assessments", riskH.CreateImpactAssessment)

			// Providers (DPA / Supply chain)
			auth.Get("/proveedores", provH.GetProviders)
			auth.Post("/proveedores", provH.CreateProvider)
			auth.Delete("/proveedores/{id}", provH.DeleteProvider)
			auth.Get("/proveedores/{id}/annex", provH.GetProviderAnnex)

			// ARCO+ Requests
			auth.Get("/arco", arcoH.GetArcoRequests)
			auth.Post("/arco", arcoH.CreateArcoRequest)
			auth.Put("/arco/{id}", arcoH.UpdateArcoRequest)

			// Security Breaches
			auth.Get("/breaches", breachH.GetBreaches)
			auth.Post("/breaches", breachH.CreateBreach)
			auth.Put("/breaches/{id}", breachH.UpdateBreach)

			// Training
			auth.Get("/campaigns", trainH.GetCampaigns)
			auth.Get("/training/campaigns", trainH.GetCampaigns)
			auth.Post("/campaigns", trainH.CreateCampaign)
			auth.Post("/training/campaigns", trainH.CreateCampaign)
			auth.Delete("/campaigns/{id}", trainH.DeleteCampaign)
			auth.Delete("/training/campaigns/{id}", trainH.DeleteCampaign)
			auth.Get("/campaigns/{id}/certificate", trainH.GetCampaignCertificate)
			auth.Get("/training/campaigns/{id}/certificate", trainH.GetCampaignCertificate)

			// Documents & One-Pagers
			auth.Get("/documents", docH.GetDocuments)
			auth.Get("/documents/{id}", docH.GetDocumentByID)
			auth.Put("/documents/{id}", docH.UpdateDocument)
			auth.Post("/documents/{id}/autocomplete", docH.AutocompleteDocument)
			auth.Post("/documents/{id}/comments", docH.AddComment)
			auth.Post("/documents/{id}/approve", docH.ApproveDocument)

			auth.Get("/web-privacy-policy", docH.GetWebPrivacyPolicy)
			auth.Get("/annual-privacy-plan", docH.GetAnnualPrivacyPlan)
			auth.Get("/opensource-privacy-blueprint", docH.GetOpensourcePrivacyBlueprint)
			auth.Get("/executive-onepager-dp", docH.GetExecutiveOnePagerDP)
			auth.Get("/grc-consolidated-onepager", docH.GetGRCConsolidatedOnePager)
			auth.Get("/procurement-dpa-clauses", docH.GetProcurementDPAClauses)
			auth.Get("/crisis-citizen-notification", docH.GetCrisisCitizenNotification)

			// Document endpoints with /documents/ prefix
			auth.Get("/documents/web-privacy-policy", docH.GetWebPrivacyPolicy)
			auth.Get("/documents/annual-privacy-plan", docH.GetAnnualPrivacyPlan)
			auth.Get("/documents/opensource-privacy-blueprint", docH.GetOpensourcePrivacyBlueprint)
			auth.Get("/documents/executive-onepager-dp", docH.GetExecutiveOnePagerDP)
			auth.Get("/documents/grc-consolidated-onepager", docH.GetGRCConsolidatedOnePager)
			auth.Get("/documents/procurement-dpa-clauses", docH.GetProcurementDPAClauses)
			auth.Get("/documents/crisis-citizen-notification", docH.GetCrisisCitizenNotification)
			auth.Get("/documents/privacy-policy-download", docH.GetWebPrivacyPolicy)

			// Audit & Q&A & Evidence
			auth.Get("/audit-logs", auditH.GetAuditLogs)
			auth.Get("/audit/logs", auditH.GetAuditLogs)
			auth.Get("/audit/ledger-verify", auditH.GetLedgerVerify)
			auth.Get("/audit/export-zip", auditH.GetAuditExportZip)
			auth.Get("/evidence-zip", auditH.GetAuditExportZip)
			auth.Post("/audit/qa-dpo", auditH.QADPO)

			auth.Get("/dp-integrity-ledger", auditH.GetLedgerVerify)
			auth.Post("/dp-verify-hash", auditH.VerifyDPHash)
			auth.Get("/dp-mock-audit/questions", auditH.GetDPMockAuditQuestions)
			auth.Post("/dp-mock-audit/evaluate", auditH.EvaluateDPMockAudit)
			auth.Get("/dp-mock-audit/certificate", auditH.GetDPMockAuditCertificate)
			auth.Get("/inspector-qa-dp", auditH.GetInspectorQADP)
			auth.Get("/executive-consolidated-report", auditH.GetExecutiveConsolidatedReport)
			auth.Get("/executive-consolidated-report/download", auditH.DownloadExecutiveConsolidatedReport)

			// Cybersecurity & ANCI Suite (Ley 21.663)
			auth.Get("/cyber/dashboard", cyberH.GetCyberDashboard)
			auth.Get("/cyber/project", projH.GetProjects)
			auth.Get("/cyber/projects", projH.GetProjects)
			auth.Get("/cyber/fases", cyberH.GetCyberPhases)
			auth.Get("/cyber/phases", cyberH.GetCyberPhases)
			auth.Put("/cyber/fases/{id}/toggle-modular", cyberH.ToggleModularFase)
			auth.Put("/cyber/tareas/{id}", cyberH.UpdateCyberTask)
			auth.Put("/cyber/tasks/{id}", cyberH.UpdateCyberTask)

			auth.Get("/cyber/assets", cyberH.GetCyberAssets)
			auth.Post("/cyber/assets", cyberH.CreateCyberAsset)
			auth.Put("/cyber/assets/{id}", cyberH.UpdateCyberAsset)
			auth.Delete("/cyber/assets/{id}", cyberH.DeleteCyberAsset)
			auth.Post("/cyber/assets/{id}/scan", cyberH.ScanCyberAsset)
			auth.Get("/cyber/assets/topology", cyberH.GetCyberTopology)

			auth.Get("/cyber/risks", cyberH.GetCyberRisks)
			auth.Post("/cyber/risks", cyberH.CreateCyberRisk)
			auth.Put("/cyber/risks/{id}", cyberH.UpdateCyberRisk)
			auth.Delete("/cyber/risks/{id}", cyberH.DeleteCyberRisk)

			auth.Get("/cyber/maturity", cyberH.GetCyberMaturity)
			auth.Post("/cyber/maturity", cyberH.AssessCyberMaturity)
			auth.Post("/cyber/maturity/assess", cyberH.AssessCyberMaturity)

			auth.Get("/cyber/incidents", cyberH.GetCyberIncidents)
			auth.Post("/cyber/incidents", cyberH.CreateCyberIncident)
			auth.Put("/cyber/incidents/{id}", cyberH.UpdateCyberIncident)
			auth.Post("/cyber/incidents/{id}/panic", cyberH.PanicCyberIncident)

			auth.Get("/cyber/simulations", cyberH.GetCyberSimulations)
			auth.Post("/cyber/simulations", cyberH.CreateCyberSimulation)
			auth.Post("/cyber/simulations/{id}/execute", cyberH.ExecuteCyberSimulation)

			// Cyber Policies
			auth.Get("/cyber/policies", cyberH.GetCyberPolicies)
			auth.Get("/cyber/policies/{id}", cyberH.GetCyberPolicy)
			auth.Put("/cyber/policies/{id}", cyberH.UpdateCyberPolicy)

			// Cyber Audit & Crosswalk
			auth.Get("/cyber/mock-audit/questions", cyberH.GetCyberMockAuditQuestions)
			auth.Post("/cyber/mock-audit/evaluate", cyberH.EvaluateCyberMockAudit)
			auth.Get("/cyber/mock-audit/certificate", cyberH.GetCyberMockAuditCertificate)
			auth.Get("/cyber/inspector-qa-cyber", cyberH.GetCyberInspectorQA)
			auth.Get("/cyber/integrity-ledger", cyberH.GetIntegrityLedger)
			auth.Post("/cyber/verify-hash", cyberH.VerifyCyberHash)
			auth.Get("/cyber/crosswalk-matrix", cyberH.GetCyberCrosswalk)
			auth.Get("/cyber/crosswalk-matrix/download", cyberH.GetCyberCrosswalkDownload)

			// Cyber Downloads & One-Pagers
			auth.Get("/cyber/evidence-zip", cyberH.GetCyberEvidenceZip)
			auth.Get("/cyber/executive-dossier", cyberH.GetCyberExecutiveDossier)
			auth.Get("/cyber/incidents-book", cyberH.GetCyberIncidentsBook)
			auth.Get("/cyber/annual-cybersecurity-plan", cyberH.GetCyberAnnualPlan)
			auth.Get("/cyber/opensource-cyber-blueprint", docH.GetOpensourcePrivacyBlueprint)
			auth.Get("/cyber/executive-onepager-cyber", cyberH.GetExecutiveOnePagerCyber)
			auth.Get("/cyber/grc-consolidated-onepager", docH.GetGRCConsolidatedOnePager)
			auth.Get("/cyber/procurement-security-clauses", docH.GetProcurementDPAClauses)
			auth.Get("/cyber/crisis-isolation-protocol", docH.GetCrisisCitizenNotification)
			auth.Get("/cyber/hardening/custom-script", cyberH.HardeningCustomScript)
			auth.Get("/cyber/hardening-script", cyberH.HardeningCustomScript)

			// Legacy
			auth.Get("/activities", legacyH.GetActivities)
			auth.Post("/activities", legacyH.CreateActivity)
			auth.Put("/activities/{id}", legacyH.UpdateActivity)
			auth.Delete("/activities/{id}", legacyH.DeleteActivity)

			auth.Get("/findings", legacyH.GetFindings)
			auth.Post("/findings", legacyH.CreateFinding)
			auth.Put("/findings/{id}", legacyH.UpdateFinding)
			auth.Delete("/findings/{id}", legacyH.DeleteFinding)

			auth.Get("/consents", legacyH.GetConsents)
			auth.Post("/consents", legacyH.CreateConsent)
			auth.Put("/consents/{id}", legacyH.UpdateConsent)
			auth.Delete("/consents/{id}", legacyH.DeleteConsent)

			auth.Get("/tickets", legacyH.GetTickets)
			auth.Post("/tickets", legacyH.CreateTicket)
			auth.Put("/tickets/{id}", legacyH.UpdateTicket)
			auth.Delete("/tickets/{id}", legacyH.DeleteTicket)
		})
	})

	log.Printf("🚀 Servidor Go escuchando en http://0.0.0.0:%s", cfg.Port)
	log.Printf("📱 API REST, Seguridad ANCI y Privacidad activas.")

	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatalf("Error en el servidor HTTP: %v", err)
	}
}
