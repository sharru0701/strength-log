# 1. 빌드 단계 (Builder Stage)
FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY . .
# 윈도우에서 빌드해도 리눅스용으로 나오게 설정
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o main main.go

# 2. 실행 단계 (Runner Stage) - 가벼운 Alpine 리눅스 사용
FROM alpine:latest
WORKDIR /root/
# 빌드 단계에서 만든 'main' 실행 파일만 쏙 가져옴
COPY --from=builder /app/main .
# 한국 시간 설정 (로그 찍힐 때 중요)
RUN apk add --no-cache tzdata
ENV TZ=Asia/Seoul

# 실행
CMD ["./main"]
