package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	_ "github.com/lib/pq"
)

// ---------------------------------------------------------
// 1. 데이터 모델 (응답용 구조체)
// ---------------------------------------------------------

type UserConfig struct {
	ID            int     `json:"id"`
	BodyWeight    float64 `json:"body_weight"`
	UnitStandard  float64 `json:"unit_standard"`
	UnitPullup    float64 `json:"unit_pullup"`
	ExerciseOrder string  `json:"exercise_order"` // [추가] 운동 순서 ("SQ,BP,PU...")
}

type WorkoutLog struct {
	ID           int             `json:"id"`
	WorkoutDate  string          `json:"workout_date"`
	ExerciseCode string          `json:"exercise_code"`
	ExerciseName string          `json:"exercise_name"`
	ExerciseType string          `json:"exercise_type"` // "531", "custom_dl" 등
	Data         json.RawMessage `json:"data"`          // JSON 그대로 전달
	Memo         string          `json:"memo"`
}

// 대시보드 API 최종 응답 형태
type DashboardResponse struct {
	Config UserConfig            `json:"config"`
	Sheets map[string]WorkoutLog `json:"sheets"` // "SQ": {Log...}, "DL": {Log...}
}

// ---------------------------------------------------------
// 2. 서버 및 핸들러
// ---------------------------------------------------------

var db *sql.DB

func main() {
	// 1. 환경변수(Docker)에 값이 있으면 그걸 우선 사용 (배포용)
	// docker-compose.yml에 적어둔 DB_DSN 값을 읽어옵니다.
	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=pass1234 dbname=postgres port=5432 sslmode=disable TimeZone=Asia/Seoul"
	}

	var err error
	db, err = sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal(err)
	}

	// 라우팅 설정
	http.HandleFunc("/api/config", corsMiddleware(handleConfig))
	http.HandleFunc("/api/dashboard", corsMiddleware(handleDashboard))  // 조회
	http.HandleFunc("/api/workouts", corsMiddleware(handleSaveWorkout)) // 저장
	http.HandleFunc("/api/history", corsMiddleware(handleHistory))

	port := ":8080"
	fmt.Printf("🔥 서버 시작! 포트 %s\n", port)
	log.Fatal(http.ListenAndServe(port, nil))
}

// CORS 미들웨어
func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// [수정 1] '*' 대신 요청한 사람의 주소(Origin)를 그대로 돌려줍니다.
		origin := r.Header.Get("Origin")
		if origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}

		// [수정 2] "쿠키(신분증) 받아도 됨"이라고 명시
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}

// ---------------------------------------------------------
// 3. 비즈니스 로직 (핸들러)
// ---------------------------------------------------------

// GET & POST /api/config
func handleConfig(w http.ResponseWriter, r *http.Request) {
	// 1. 설정 조회 (GET)
	if r.Method == "GET" {
		var config UserConfig
		// [수정] exercise_order 조회 추가 (NULL일 경우 빈 문자열 반환을 위해 COALESCE 사용)
		err := db.QueryRow("SELECT body_weight, unit_standard, unit_pullup, COALESCE(exercise_order, '') FROM user_config LIMIT 1").Scan(
			&config.BodyWeight, &config.UnitStandard, &config.UnitPullup, &config.ExerciseOrder,
		)
		if err != nil {
			// 값이 없으면 기본값 리턴
			json.NewEncoder(w).Encode(UserConfig{
				BodyWeight:    75.0,
				UnitStandard:  2.5,
				UnitPullup:    1.0,
				ExerciseOrder: "SQ,BP,PU,DL,OHP", // 기본 순서
			})
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(config)
		return
	}

	// 2. 설정 저장 (POST)
	if r.Method == "POST" {
		var req UserConfig
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid body", http.StatusBadRequest)
			return
		}

		// 항상 ID=1인 행을 업데이트 (싱글 유저 가정)
		// [수정] exercise_order 컬럼 추가
		query := `
            INSERT INTO user_config (id, body_weight, unit_standard, unit_pullup, exercise_order)
            VALUES (1, $1, $2, $3, $4)
            ON CONFLICT (id) DO UPDATE 
            SET body_weight = EXCLUDED.body_weight,
                unit_standard = EXCLUDED.unit_standard,
                unit_pullup = EXCLUDED.unit_pullup,
                exercise_order = EXCLUDED.exercise_order
        `
		_, err := db.Exec(query, req.BodyWeight, req.UnitStandard, req.UnitPullup, req.ExerciseOrder)
		if err != nil {
			http.Error(w, "DB Error: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Config updated"))
		return
	}

	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}

// GET /api/dashboard
func handleDashboard(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// 1) 사용자 설정 가져오기 (가장 최근 것 1개)
	var config UserConfig
	// [수정] exercise_order 조회 추가
	err := db.QueryRow(`
        SELECT id, body_weight, unit_standard, unit_pullup, COALESCE(exercise_order, '') 
        FROM user_config 
        ORDER BY id DESC LIMIT 1
    `).Scan(&config.ID, &config.BodyWeight, &config.UnitStandard, &config.UnitPullup, &config.ExerciseOrder)

	if err != nil {
		// 설정이 없으면 기본값 사용
		config = UserConfig{
			BodyWeight:    75.0,
			UnitStandard:  2.5,
			UnitPullup:    1.0,
			ExerciseOrder: "SQ,BP,PU,DL,OHP",
		}
	}

	// 2) 종목별 최신 기록 가져오기
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

	rows, err := db.Query(query)
	if err != nil {
		http.Error(w, "DB Error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	sheets := make(map[string]WorkoutLog)

	for rows.Next() {
		var log WorkoutLog
		var dataStr string // JSON 문자열 임시 저장

		err := rows.Scan(
			&log.ExerciseCode, &log.ExerciseName, &log.ExerciseType,
			&log.ID, &log.WorkoutDate, &dataStr, &log.Memo,
		)
		if err != nil {
			continue
		}

		// DB에서 꺼낸 JSON 문자열을 RawMessage로 변환
		log.Data = json.RawMessage(dataStr)

		// 맵에 담기 (예: sheets["SQ"] = log)
		sheets[log.ExerciseCode] = log
	}

	// 3) 최종 응답 생성
	resp := DashboardResponse{
		Config: config,
		Sheets: sheets,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// 1. 저장 요청용 구조체 정의
type CreateLogRequest struct {
	WorkoutDate  string          `json:"workout_date"`
	ExerciseCode string          `json:"exercise_code"`
	Data         json.RawMessage `json:"data"` // 프론트가 주는 JSON 그대로 받음
	Memo         string          `json:"memo"`
}

// 2. 저장 핸들러 구현
// POST /api/workouts
func handleSaveWorkout(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// 1) 요청 바디 해석
	var req CreateLogRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad Request: "+err.Error(), http.StatusBadRequest)
		return
	}

	// 2) 유효성 검사 (간단하게)
	if req.WorkoutDate == "" || req.ExerciseCode == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	// 3) DB 저장 (INSERT)
	query := `
        INSERT INTO workout_logs (workout_date, exercise_code, data, memo)
        VALUES ($1, $2, $3, $4)
    `
	_, err := db.Exec(query, req.WorkoutDate, req.ExerciseCode, req.Data, req.Memo)
	if err != nil {
		log.Printf("DB Insert Error: %v", err) // 서버 로그에 에러 출력
		http.Error(w, "DB Error", http.StatusInternalServerError)
		return
	}

	// 4) 성공 응답
	w.WriteHeader(http.StatusCreated)
	fmt.Fprintf(w, `{"message": "Saved successfully"}`)
}

// GET /api/history
func handleHistory(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// URL 쿼리 파라미터에서 code 읽기 (예: /api/history?code=SQ)
	code := r.URL.Query().Get("code")

	// 기본 쿼리
	query := `
        SELECT 
            l.id, 
            TO_CHAR(l.workout_date, 'YYYY-MM-DD'), 
            l.exercise_code, 
            e.name, 
            e.type,
            l.data, 
            l.memo
        FROM workout_logs l
        JOIN exercises e ON l.exercise_code = e.code
        WHERE 1=1
    `

	var args []interface{}
	paramCount := 1

	// code 파라미터가 있으면 WHERE 절 추가
	if code != "" {
		query += fmt.Sprintf(" AND l.exercise_code = $%d", paramCount)
		args = append(args, code)
		paramCount++
	}

	// 정렬 및 제한
	query += " ORDER BY l.workout_date DESC, l.id DESC LIMIT 50"

	rows, err := db.Query(query, args...)
	if err != nil {
		http.Error(w, "DB Error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var logs []WorkoutLog
	for rows.Next() {
		var l WorkoutLog
		var dataStr string
		err := rows.Scan(&l.ID, &l.WorkoutDate, &l.ExerciseCode, &l.ExerciseName, &l.ExerciseType, &dataStr, &l.Memo)
		if err != nil {
			continue
		}
		l.Data = json.RawMessage(dataStr)
		logs = append(logs, l)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}
