package models

import "encoding/json"

// UserConfig 사용자 설정 모델
type UserConfig struct {
	ID            int     `json:"id"`
	BodyWeight    float64 `json:"body_weight"`
	UnitStandard  float64 `json:"unit_standard"`
	UnitPullup    float64 `json:"unit_pullup"`
	ExerciseOrder string  `json:"exercise_order"`
}

// WorkoutLog 운동 기록 모델
type WorkoutLog struct {
	ID           int             `json:"id"`
	WorkoutDate  string          `json:"workout_date"`
	ExerciseCode string          `json:"exercise_code"`
	ExerciseName string          `json:"exercise_name"`
	ExerciseType string          `json:"exercise_type"`
	Data         json.RawMessage `json:"data"`
	Memo         string          `json:"memo"`
}

// DashboardResponse 대시보드 응답 모델
type DashboardResponse struct {
	Config UserConfig            `json:"config"`
	Sheets map[string]WorkoutLog `json:"sheets"`
}

// CreateLogRequest 기록 생성 요청 모델
type CreateLogRequest struct {
	WorkoutDate  string          `json:"workout_date"`
	ExerciseCode string          `json:"exercise_code"`
	Data         json.RawMessage `json:"data"`
	Memo         string          `json:"memo"`
}

// UpdateLogRequest 기록 수정 요청 모델
type UpdateLogRequest struct {
	ID           int             `json:"id"`
	WorkoutDate  string          `json:"workout_date"`
	ExerciseCode string          `json:"exercise_code"`
	Data         json.RawMessage `json:"data"`
	Memo         string          `json:"memo"`
}
