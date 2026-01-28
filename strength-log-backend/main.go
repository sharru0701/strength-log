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

// 1. 도메인 모델 정의 (Java의 Entity/DTO 역할)
// gorm.Model을 상속받으면 ID, CreatedAt 등이 자동 생성됩니다.
type WorkoutLog struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	WorkoutDate time.Time `json:"workout_date"`
	Title       string    `json:"title"`
	Condition   string    `json:"condition"`
	// PostgreSQL의 JSONB 타입을 Go에서 쉽게 쓰기 위한 타입
	WorkoutData datatypes.JSON `gorm:"type:jsonb" json:"workout_data"`
}

// DB 전역 변수 (간단한 예제라 전역으로 둡니다)
var db *gorm.DB

func main() {
	var err error

	// 2. DB 연결 설정 (아까 만든 GCP 서버 정보 입력!)
	// host=서버IP, password=아까설정한비번(pass1234)
	dsn := "host=34.53.6.55 user=postgres password=pass1234 dbname=postgres port=5432 sslmode=disable TimeZone=Asia/Seoul"

	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("DB 연결 실패 ㅠㅠ: ", err)
	}
	log.Println("🚀 DB 연결 성공!")

	// 3. 테이블 자동 생성 (Auto Migration)
	// Java의 ddl-auto: update 와 같습니다. 없으면 만들고 있으면 유지합니다.
	db.AutoMigrate(&WorkoutLog{})

	// 4. 웹 서버(Router) 설정
	r := gin.Default()

	// GET: 운동 기록 조회
	r.GET("/workouts", func(c *gin.Context) {
		var logs []WorkoutLog
		// SELECT * FROM workout_logs ORDER BY id DESC;
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

		// Request Body의 JSON을 구조체에 바인딩
		if err := c.ShouldBindJSON(&newLog); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// 날짜가 비어있으면 오늘 날짜로
		if newLog.WorkoutDate.IsZero() {
			newLog.WorkoutDate = time.Now()
		}

		// INSERT INTO ...
		db.Create(&newLog)
		c.JSON(http.StatusOK, newLog)
	})

	// 5. 서버 실행 (8080 포트)
	r.Run(":8080")
}
