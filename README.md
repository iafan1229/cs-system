# 상담예약 시스템 (Consultation Scheduling System)

상담 예약을 관리하는 웹 애플리케이션입니다. 관리자는 스케줄을 생성하고, 상담 희망자는 링크를 통해 예약할 수 있습니다.

## 문서

더 자세한 내용은 다음 문서를 참고하세요:

- [프로젝트 설치법](https://pouncing-jaguar-da7.notion.site/2df5d4f5ac7a80ea9aadc39bb2ee9ddc)
- [스크린샷 및 사용법](https://pouncing-jaguar-da7.notion.site/2df5d4f5ac7a80bdb85ddd314c9f3171)
- [설계 문서](https://pouncing-jaguar-da7.notion.site/2df5d4f5ac7a80bdb85ddd314c9f3171)

## 기술 스택

- **Backend**: NestJS, TypeScript, Prisma, PostgreSQL
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Database**: PostgreSQL 15
- **Infrastructure**: Docker, Docker Compose

## 빠른 시작

### 사전 요구사항

- Docker Desktop 설치
- Docker Compose (Docker Desktop에 포함)

### 접속 정보

- **백엔드 API**: http://localhost:3000
- **프론트엔드**: http://localhost:5173
- **PostgreSQL**: localhost:5432

## 프로젝트 구조

```
cs-system/
├── backend/          # NestJS 백엔드
├── frontend/         # React 프론트엔드
├── docker-compose.yml
└── README.md
```

## 주요 기능

- 관리자 인증 및 스케줄 관리
- 상담 예약 링크 생성 및 이메일 발송
- 예약 관리 및 상담 기록 작성
- 실시간 예약 현황 확인
