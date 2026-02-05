package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	"strength-log-backend/internal/handlers"
	"strength-log-backend/internal/repository"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	// 1. .env 파일 로드 (로컬 개발용)
	// 백엔드 실행 경로(strength-log-backend) 기준 상위 폴더(root)의 .env를 찾습니다.
	// 배포 환경에서는 파일이 없어도 무시하고 넘어갑니다.
	_ = godotenv.Load("../.env")

	// 2. DB 연결 정보(DSN) 설정
	// 배포 환경(Docker)에서는 DB_DSN이 통째로 주입됩니다.
	dsn := os.Getenv("DB_DSN")

	// 3. 로컬 환경 처리 (DB_DSN이 없을 때)
	if dsn == "" {
		// .env 파일에서 불러온 비밀번호를 가져옵니다.
		dbPassword := os.Getenv("DB_PASSWORD")
		if dbPassword == "" {
			log.Fatal("Error: DB_PASSWORD is required in .env or environment variables")
		}

		// 로컬 DB 접속 정보 조합 (host=localhost)
		// 도커가 5432 포트를 열어줬으므로 localhost로 접속합니다.
		dsn = fmt.Sprintf("host=localhost user=postgres password=%s dbname=postgres port=5432 sslmode=disable TimeZone=Asia/Seoul", dbPassword)
	}

	// 4. DB 연결
	log.Println("Connecting to Database...")
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// 연결 테스트
	if err = db.Ping(); err != nil {
		log.Fatal("DB Unreachable:", err)
	}
	log.Println("DB Connected Successfully!")

	// 1. Repository 초기화
	repo := repository.NewRepository(db)

	// 2. Handler 초기화 (Repo 주입)
	h := handlers.NewHandler(repo)

	// 3. 라우팅 설정
	http.HandleFunc("/api/config", handlers.CorsMiddleware(h.HandleConfig))
	http.HandleFunc("/api/dashboard", handlers.CorsMiddleware(h.HandleDashboard))
	http.HandleFunc("/api/workouts", handlers.CorsMiddleware(h.HandleWorkouts))
	http.HandleFunc("/api/history", handlers.CorsMiddleware(h.HandleHistory))

	port := ":8080"
	fmt.Printf("🔥 서버 시작! 포트 %s\n", port)
	log.Fatal(http.ListenAndServe(port, nil))
}
