# 1. 베이스 이미지
FROM node:20-alpine

# 2. 작업 폴더 설정
WORKDIR /app

# 3. 패키지 설치 [최적화]
# 소스 코드를 복사하기 전에 package.json만 먼저 복사해서 install 수행
# (소스 코드가 바뀌어도 npm install을 건너뛰어 빌드가 빨라짐)
COPY package*.json ./
RUN npm install

# 4. 소스 코드 복사
COPY . .

# 환경변수 주입 (빌드 시점에 필요)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# 빌드 실행 (메모리 제한 옵션 포함)
RUN NODE_OPTIONS="--max-old-space-size=1536" npm run build

# 5. 서버 실행
CMD ["npm", "run", "start"]