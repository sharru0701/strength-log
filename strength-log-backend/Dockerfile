# 1. 빌드 단계 (Builder Stage)
FROM golang:1.25-alpine AS builder

WORKDIR /app

# [최적화] 의존성 파일만 먼저 복사해서 다운로드 (캐시 활용)
COPY go.mod go.sum ./
RUN go mod download

# 소스 코드 복사
COPY . .

# [수정] main.go 위치를 정확하게 지정 (cmd/api/main.go)
RUN CGO_ENABLED=0 GOOS=linux go build -p 1 -v -o main cmd/api/main.go

# 2. 실행 단계 (Runner Stage)
FROM alpine:latest
WORKDIR /root/

# 빌드 결과물 복사
COPY --from=builder /app/main .

# 한국 시간 설정
RUN apk add --no-cache tzdata
ENV TZ=Asia/Seoul

# 실행
CMD ["./main"]