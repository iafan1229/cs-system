# 상담예약 시스템 실행 가이드

본 문서는 상담예약 시스템을 처음 실행하는 방법을 안내합니다.

## 목차

1. [사전 요구사항](#1-사전-요구사항)
2. [프로젝트 클론 및 설치](#2-프로젝트-클론-및-설치)
3. [실행 방법](#3-실행-방법)
   - [방법 1: Docker 사용 (권장)](#방법-1-docker-사용-권장)
   - [방법 2: 로컬 실행](#방법-2-로컬-실행)
4. [초기 설정](#4-초기-설정)
5. [API 문서 접근](#5-api-문서-접근)
6. [문제 해결](#6-문제-해결)

---

## 1. 사전 요구사항

### Docker 사용 시

- Docker Desktop 설치
- Docker Compose 설치 (Docker Desktop에 포함)

### 로컬 실행 시

- Node.js 20 이상
- PostgreSQL 15 이상
- npm 또는 yarn

---

## 2. 프로젝트 클론 및 설치

```bash
# 프로젝트 클론
git clone [프로젝트-URL]
cd cs-system

# 의존성 설치 (Docker 사용 시에도 로컬 개발 편의를 위해 권장)
cd backend && npm install
cd ../frontend && npm install
```

---

## 3. 실행 방법

### 방법 1: Docker 사용 (권장)

Docker를 사용하면 환경 변수 설정 없이 바로 실행할 수 있습니다.

#### 3.1 Docker로 실행

```bash
# 프로젝트 루트에서
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 중지
docker-compose down
```

#### 3.2 접속 정보

- **백엔드 API**: http://localhost:3000
- **프론트엔드**: http://localhost:5173
- **API 문서 (Swagger)**: http://localhost:3000/api
- **PostgreSQL**: localhost:5432

#### 3.3 환경 변수 커스터마이징 (선택)

Docker에서 환경 변수를 변경하려면:

```bash
# .env 파일 생성 (프로젝트 루트)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password
POSTGRES_DB=consultation_system
JWT_SECRET=your-secret-key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

또는 `docker-compose.yml`에서 직접 수정:

```yaml
environment:
  - JWT_SECRET=your-custom-secret
  - EMAIL_HOST=smtp.gmail.com
  # ...
```

### 방법 2: 로컬 실행

#### 3.1 PostgreSQL 설치 및 데이터베이스 생성

**macOS:**

```bash
brew install postgresql@15
brew services start postgresql@15
createdb consultation_system
```

**Ubuntu/Debian:**

```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb consultation_system
```

**Windows:**

- PostgreSQL 공식 사이트에서 설치
- pgAdmin 또는 psql로 데이터베이스 생성

#### 3.2 환경 변수 설정

```bash
# backend/.env 파일 생성
cd backend
cp .env.example .env

# .env 파일 편집
# DATABASE_URL을 본인의 PostgreSQL 설정에 맞게 수정
```

**backend/.env 예시:**

```bash
# 로컬 PostgreSQL 사용 시
DATABASE_URL="postgresql://[사용자명]@localhost:5432/consultation_system?schema=public"

# 예시 (macOS 사용자명이 hylee인 경우)
# DATABASE_URL="postgresql://hylee@localhost:5432/consultation_system?schema=public"

# 예시 (postgres 사용자 사용)
# DATABASE_URL="postgresql://postgres:password@localhost:5432/consultation_system?schema=public"

# JWT 설정
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"

# 이메일 설정 (선택)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="your-email@gmail.com"

# 프론트엔드 URL
FRONTEND_URL="http://localhost:5173"

# 포트
PORT=3000
```

#### 3.3 데이터베이스 마이그레이션

```bash
cd backend

# Prisma Client 생성
npm run db:generate

# 마이그레이션 실행
npm run db:migrate

# 또는 스키마를 직접 푸시 (개발 환경)
npm run db:push
```

#### 3.4 초기 관리자 계정 생성

```bash
cd backend

# 기본 계정 생성 (admin@example.com / admin123)
npm run seed

# 또는 커스텀 계정 생성
npm run seed your-email@example.com your-password "관리자 이름"
```

#### 3.5 백엔드 실행

```bash
cd backend
npm run start:dev
```

백엔드가 http://localhost:3000 에서 실행됩니다.

#### 3.6 프론트엔드 실행

새 터미널에서:

```bash
cd frontend
npm run dev
```

프론트엔드가 http://localhost:5173 에서 실행됩니다.

---

## 4. 초기 설정

### 4.1 관리자 계정 생성

**Docker 사용 시:**

```bash
# 백엔드 컨테이너에 접속
docker-compose exec backend sh

# 컨테이너 내부에서
npm run seed
# 또는
npm run seed your-email@example.com your-password "관리자 이름"
```

**로컬 실행 시:**

```bash
cd backend
npm run seed
```

### 4.2 로그인

1. 프론트엔드 접속: http://localhost:5173
2. 관리자 로그인 페이지로 자동 리다이렉트
3. 생성한 관리자 계정으로 로그인

**기본 계정 (seed 스크립트 기본값):**

- 이메일: `admin@example.com`
- 비밀번호: `admin123`

---

## 5. API 문서 접근

Swagger API 문서에 접근:

1. 백엔드 실행 후 http://localhost:3000/api 접속
2. "Authorize" 버튼 클릭
3. JWT 토큰 입력 (로그인 후 발급받은 토큰)
4. API 테스트 가능

---

## 6. 문제 해결

### 6.1 데이터베이스 연결 오류

**문제:** `PrismaClientInitializationError` 또는 연결 오류

**해결:**

```bash
# PostgreSQL이 실행 중인지 확인
# macOS
brew services list

# Linux
sudo systemctl status postgresql

# DATABASE_URL 확인
# 사용자명, 데이터베이스명이 올바른지 확인
```

### 6.2 포트 충돌

**문제:** `Port 3000 is already in use`

**해결:**

```bash
# 포트 사용 중인 프로세스 확인
# macOS/Linux
lsof -i :3000

# 프로세스 종료 또는 다른 포트 사용
# backend/.env에서 PORT=3001로 변경
```

### 6.3 Prisma Client 오류

**문제:** `PrismaClient` 타입 오류

**해결:**

```bash
cd backend
npm run db:generate
```

### 6.4 이메일 발송 실패

**문제:** 이메일이 발송되지 않음

**해결:**

- `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASSWORD` 확인
- Gmail 사용 시: 앱 비밀번호 사용 필요
- 네이버 사용 시: POP3/IMAP 설정 확인, 사용자명에 `@naver.com` 제외

**이메일 설정 없이 테스트:**

- 이메일 설정을 하지 않으면 콘솔에 이메일 내용이 출력됩니다
- 실제 이메일 발송 없이도 테스트 가능

### 6.5 Docker 컨테이너 오류

**문제:** 컨테이너가 시작되지 않음

**해결:**

```bash
# 컨테이너 로그 확인
docker-compose logs backend

# 컨테이너 재시작
docker-compose restart backend

# 완전히 재시작
docker-compose down
docker-compose up -d
```

### 6.6 마이그레이션 오류

**문제:** 마이그레이션 실행 실패

**해결:**

```bash
cd backend

# 마이그레이션 상태 확인
npx prisma migrate status

# 마이그레이션 리셋 (주의: 데이터 삭제됨)
npm run db:migrate:reset

# 또는 스키마 직접 푸시
npm run db:push
```

---

## 7. 개발 명령어

### 백엔드

```bash
cd backend

# 개발 서버 실행
npm run start:dev

# 프로덕션 빌드
npm run build
npm run start:prod

# 테스트
npm test
npm run test:e2e
npm run test:cov

# 데이터베이스 관리
npm run db:generate      # Prisma Client 생성
npm run db:migrate       # 마이그레이션 생성 및 적용
npm run db:migrate:deploy # 프로덕션 마이그레이션 적용
npm run db:push          # 스키마 직접 푸시
npm run db:studio        # Prisma Studio 실행
npm run seed             # 관리자 계정 생성
```

### 프론트엔드

```bash
cd frontend

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

# 린트
npm run lint
```

---

## 8. 프로젝트 구조

```
cs-system/
├── backend/              # NestJS 백엔드
│   ├── src/
│   │   ├── auth/        # 인증 모듈
│   │   ├── schedules/   # 스케줄 모듈
│   │   ├── reservations/# 예약 모듈
│   │   └── ...
│   ├── prisma/          # Prisma 스키마 및 마이그레이션
│   └── .env             # 환경 변수 (로컬 실행 시)
├── frontend/            # React 프론트엔드
│   └── src/
│       ├── pages/       # 페이지 컴포넌트
│       ├── components/  # 재사용 컴포넌트
│       ├── hooks/      # 커스텀 훅
│       └── services/   # API 서비스
├── docker-compose.yml   # Docker Compose 설정
└── README.md            # 프로젝트 개요
```

---

## 9. 다음 단계

1. 관리자 계정으로 로그인
2. 스케줄 생성
3. 예약 링크 생성 및 이메일 발송
4. 예약 신청 테스트
5. 상담 기록 작성

자세한 기능은 [PRD 문서](./prd.md)를 참고하세요.

---

## 10. 참고 문서

- [PRD (제품 요구사항)](./prd.md)
- [실행 계획](./IMPLEMENTATION_PLAN.md)
- [리팩토링 요약](./REFACTORING_SUMMARY.md)
