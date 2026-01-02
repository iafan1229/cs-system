# 상담예약 시스템 (Consultation System)

상담사가 상담 스케줄을 관리하고, 신청자가 이메일 링크를 통해 상담을 예약할 수 있는 시스템입니다.

## 프로젝트 구조

```
cs-system/
├── backend/          # NestJS 백엔드
├── frontend/         # React 프론트엔드
├── prd.md           # 제품 요구사항 문서
├── IMPLEMENTATION_PLAN.md  # 실행 계획
└── docker-compose.yml
```

## 기술 스택

- **Backend**: NestJS, TypeScript
- **Frontend**: React, TypeScript, Vite
- **Database**: PostgreSQL
- **Container**: Docker, Docker Compose

## 시작하기

### 사전 요구사항

- Node.js 20 이상
- Docker & Docker Compose
- npm 또는 yarn

### 환경 설정

1. 환경 변수 파일 생성

```bash
# Backend
cp backend/.env.example backend/.env
# .env 파일을 열어서 필요한 값들을 설정하세요

# Frontend
cp frontend/.env.example frontend/.env
```

2. Docker로 전체 환경 실행

```bash
docker-compose up -d
```

또는 로컬에서 실행:

```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend (새 터미널)
cd frontend
npm install
npm run dev
```

## 개발 상태

현재 프로젝트 초기 설정 단계입니다.

## 문서

- [PRD (제품 요구사항)](./prd.md)
- [실행 계획](./IMPLEMENTATION_PLAN.md)
