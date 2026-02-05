package handlers

import (
	"encoding/json"
	"net/http"
	"strength-log-backend/internal/models"
	"strength-log-backend/internal/repository"
)

// Handler 의존성 주입을 위한 구조체
type Handler struct {
	Repo *repository.Repository
}

func NewHandler(repo *repository.Repository) *Handler {
	return &Handler{Repo: repo}
}

// JSON 응답 헬퍼
func (h *Handler) jsonResponse(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}

func (h *Handler) HandleConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method == "GET" {
		config, err := h.Repo.GetUserConfig()
		if err != nil {
			// 기본값 리턴
			h.jsonResponse(w, http.StatusOK, models.UserConfig{
				BodyWeight: 75.0, UnitStandard: 2.5, UnitPullup: 1.0, ExerciseOrder: "SQ,BP,PU,DL,OHP",
			})
			return
		}
		h.jsonResponse(w, http.StatusOK, config)
		return
	}

	if r.Method == "POST" {
		var req models.UserConfig
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid body", http.StatusBadRequest)
			return
		}
		if err := h.Repo.UpsertUserConfig(req); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Write([]byte("Config updated"))
		return
	}
	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}

func (h *Handler) HandleDashboard(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	config, err := h.Repo.GetUserConfig()
	if err != nil {
		config = models.UserConfig{BodyWeight: 75.0, UnitStandard: 2.5, UnitPullup: 1.0, ExerciseOrder: "SQ,BP,PU,DL,OHP"}
	}

	sheets, err := h.Repo.GetLatestLogs()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.jsonResponse(w, http.StatusOK, models.DashboardResponse{Config: config, Sheets: sheets})
}

func (h *Handler) HandleWorkouts(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		var req models.CreateLogRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if err := h.Repo.CreateWorkout(req); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		h.jsonResponse(w, http.StatusCreated, map[string]string{"message": "Saved successfully"})
		return
	}

	if r.Method == "PUT" {
		var req models.UpdateLogRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if err := h.Repo.UpdateWorkout(req); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		h.jsonResponse(w, http.StatusOK, map[string]string{"message": "Updated"})
		return
	}

	if r.Method == "DELETE" {
		idStr := r.URL.Query().Get("id")
		if idStr == "" {
			http.Error(w, "Missing id", http.StatusBadRequest)
			return
		}
		if err := h.Repo.DeleteWorkout(idStr); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		h.jsonResponse(w, http.StatusOK, map[string]string{"message": "Deleted"})
		return
	}
	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}

func (h *Handler) HandleHistory(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	code := r.URL.Query().Get("code")
	logs, err := h.Repo.GetHistory(code)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.jsonResponse(w, http.StatusOK, logs)
}

// Middleware
func CorsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}
