# 1. 베이스 이미지
FROM node:20-alpine

# 2. 작업 폴더 설정
WORKDIR /app

# 3. 패키지 설치
COPY package*.json ./
RUN npm install

# 4. 소스 코드 복사 및 빌드
COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# 메모리 제한(1.5GB) 옵션을 붙여서 빌드 실행
RUN NODE_OPTIONS="--max-old-space-size=1536" npm run build

# 5. 서버 실행 (Next.js start)
CMD ["npm", "run", "start"]
