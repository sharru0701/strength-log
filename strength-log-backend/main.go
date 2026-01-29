package main

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/datatypes"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// 1. 도메인 모델 정의
type WorkoutLog struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	WorkoutDate time.Time      `json:"workout_date"`
	Title       string         `json:"title"`
	Condition   string         `json:"condition"`
	WorkoutData datatypes.JSON `gorm:"type:jsonb" json:"workout_data"`
}

var db *gorm.DB

func main() {
	var err error

	// 2. DB 연결 설정 (주의: 로컬 테스트용)
	// 선생님 코드에 있던 34.53.6.55 (GCP 공인 IP)를 그대로 둡니다.
	dsn := "host=34.53.6.55 user=postgres password=pass1234 dbname=postgres port=5432 sslmode=disable TimeZone=Asia/Seoul"

	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("DB 연결 실패 ㅠㅠ: ", err)
	}
	log.Println("🚀 DB 연결 성공!")

	// 3. 테이블 자동 생성
	db.AutoMigrate(&WorkoutLog{})

	// 4. 웹 서버(Router) 설정
	r := gin.Default()

	// ⭐️ [여기가 추가된 부분] CORS 설정 미들웨어 ⭐️
	// 프론트엔드(3000번)가 백엔드(8080번)에 접속할 수 있게 문을 열어줍니다.
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// GET: 운동 기록 조회
	r.GET("/workouts", func(c *gin.Context) {
		var logs []WorkoutLog
		result := db.Order("id desc").Find(&logs)

		if result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
			return
		}
		c.JSON(http.StatusOK, logs)
	})

	// POST: 운동 기록 저장
	r.POST("/workouts", func(c *gin.Context) {
		var newLog WorkoutLog

		if err := c.ShouldBindJSON(&newLog); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if newLog.WorkoutDate.IsZero() {
			newLog.WorkoutDate = time.Now()
		}

		db.Create(&newLog)
		c.JSON(http.StatusOK, newLog)
	})

	// 5. 서버 실행
	r.Run(":8080")
}
