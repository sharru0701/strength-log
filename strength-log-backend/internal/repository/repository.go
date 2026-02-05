package repository

import (
	"database/sql"
	"encoding/json"
	"strength-log-backend/internal/models" // 모듈명은 go.mod에 설정된 이름으로 변경하세요
)

// Repository DB 연결을 보유하는 구조체
type Repository struct {
	DB *sql.DB
}

// NewRepository 생성자
func NewRepository(db *sql.DB) *Repository {
	return &Repository{DB: db}
}

func (r *Repository) GetUserConfig() (models.UserConfig, error) {
	var config models.UserConfig
	err := r.DB.QueryRow("SELECT body_weight, unit_standard, unit_pullup, COALESCE(exercise_order, '') FROM user_config LIMIT 1").Scan(
		&config.BodyWeight, &config.UnitStandard, &config.UnitPullup, &config.ExerciseOrder,
	)
	return config, err
}

func (r *Repository) UpsertUserConfig(req models.UserConfig) error {
	query := `
		INSERT INTO user_config (id, body_weight, unit_standard, unit_pullup, exercise_order)
		VALUES (1, $1, $2, $3, $4)
		ON CONFLICT (id) DO UPDATE 
		SET body_weight = EXCLUDED.body_weight,
			unit_standard = EXCLUDED.unit_standard,
			unit_pullup = EXCLUDED.unit_pullup,
			exercise_order = EXCLUDED.exercise_order
	`
	_, err := r.DB.Exec(query, req.BodyWeight, req.UnitStandard, req.UnitPullup, req.ExerciseOrder)
	return err
}

func (r *Repository) GetLatestLogs() (map[string]models.WorkoutLog, error) {
	query := `
		SELECT DISTINCT ON (e.code) 
			e.code, e.name, e.type,
			COALESCE(l.id, 0),
			COALESCE(TO_CHAR(l.workout_date, 'YYYY-MM-DD'), ''),
			COALESCE(l.data, '{}'), 
			COALESCE(l.memo, '')
		FROM exercises e
		LEFT JOIN workout_logs l ON e.code = l.exercise_code
		ORDER BY e.code, l.workout_date DESC, l.id DESC
	`
	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	sheets := make(map[string]models.WorkoutLog)
	for rows.Next() {
		var log models.WorkoutLog
		var dataStr string
		if err := rows.Scan(&log.ExerciseCode, &log.ExerciseName, &log.ExerciseType, &log.ID, &log.WorkoutDate, &dataStr, &log.Memo); err != nil {
			continue
		}
		log.Data = json.RawMessage(dataStr)
		sheets[log.ExerciseCode] = log
	}
	return sheets, nil
}

func (r *Repository) CreateWorkout(req models.CreateLogRequest) error {
	query := `INSERT INTO workout_logs (workout_date, exercise_code, data, memo) VALUES ($1, $2, $3, $4)`
	_, err := r.DB.Exec(query, req.WorkoutDate, req.ExerciseCode, req.Data, req.Memo)
	return err
}

func (r *Repository) UpdateWorkout(req models.UpdateLogRequest) error {
	query := `UPDATE workout_logs SET workout_date = $1, data = $2, memo = $3 WHERE id = $4`
	_, err := r.DB.Exec(query, req.WorkoutDate, req.Data, req.Memo, req.ID)
	return err
}

func (r *Repository) DeleteWorkout(id string) error {
	_, err := r.DB.Exec("DELETE FROM workout_logs WHERE id = $1", id)
	return err
}

func (r *Repository) GetHistory(code string) ([]models.WorkoutLog, error) {
	query := `
		SELECT l.id, TO_CHAR(l.workout_date, 'YYYY-MM-DD'), l.exercise_code, e.name, e.type, l.data, l.memo
		FROM workout_logs l
		JOIN exercises e ON l.exercise_code = e.code
		WHERE 1=1
	`
	var args []interface{}
	if code != "" {
		query += " AND l.exercise_code = $1"
		args = append(args, code)
	}
	query += " ORDER BY l.workout_date DESC, l.id DESC LIMIT 50"

	rows, err := r.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []models.WorkoutLog
	for rows.Next() {
		var l models.WorkoutLog
		var dataStr string
		if err := rows.Scan(&l.ID, &l.WorkoutDate, &l.ExerciseCode, &l.ExerciseName, &l.ExerciseType, &dataStr, &l.Memo); err != nil {
			continue
		}
		l.Data = json.RawMessage(dataStr)
		logs = append(logs, l)
	}
	return logs, nil
}
