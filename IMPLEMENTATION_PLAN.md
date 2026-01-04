# 상담예약 시스템 실행계획 (Implementation Plan)

> 본 문서는 PRD를 바탕으로 한 단계별 개발 실행계획입니다.

---

## 목차

1. [프로젝트 설정 및 인프라 구축](#1-프로젝트-설정-및-인프라-구축)
2. [데이터베이스 설계 및 구현](#2-데이터베이스-설계-및-구현)
3. [Backend API 개발](#3-backend-api-개발)
4. [Frontend 개발](#4-frontend-개발)
5. [통합 및 테스트](#5-통합-및-테스트)
6. [배포 준비](#6-배포-준비)

---

## 1. 프로젝트 설정 및 인프라 구축

### 1.1 프로젝트 구조 생성

- [ ] 프로젝트 루트 디렉토리 구조 설정
  ```
  cs-system/
  ├── backend/          # NestJS 백엔드
  ├── frontend/         # React 프론트엔드
  ├── docker-compose.yml
  └── README.md
  ```

### 1.2 Backend 프로젝트 초기화

- [ ] NestJS 프로젝트 생성 (`nest new backend`)
- [ ] 필수 패키지 설치
  - `@nestjs/typeorm` 또는 `@prisma/client`
  - `@nestjs/jwt` (인증)
  - `@nestjs/passport`
  - `passport-jwt`
  - `pg` (PostgreSQL 드라이버)
  - `class-validator`, `class-transformer`
  - `@nestjs/config` (환경 변수 관리)
  - `nodemailer` (이메일 발송)
- [ ] ESLint, Prettier 설정
- [ ] 환경 변수 파일 설정 (`.env.example`, `.env`)

### 1.3 Frontend 프로젝트 초기화

- [ ] React 프로젝트 생성 (`create-react-app` 또는 `Vite`)
- [ ] 필수 패키지 설치
  - `react-router-dom` (라우팅)
  - `axios` (API 통신)
  - `react-query` 또는 `swr` (데이터 페칭)
  - `zustand` 또는 `redux` (상태 관리, 선택적)
  - `date-fns` (날짜 처리)
- [ ] ESLint, Prettier 설정
- [ ] 환경 변수 파일 설정

### 1.4 Docker 환경 구축

- [ ] `docker-compose.yml` 작성
  - PostgreSQL 컨테이너
  - Backend 컨테이너 (개발 모드)
  - Frontend 컨테이너 (개발 모드)
- [ ] Docker 네트워크 설정
- [ ] 볼륨 마운트 설정 (코드 핫 리로드)
- [ ] 환경 변수 관리

### 1.5 데이터베이스 초기 설정

- [ ] PostgreSQL 컨테이너 실행
- [ ] 데이터베이스 생성
- [ ] 연결 테스트

**예상 소요 시간: 1-2일**

---

## 2. 데이터베이스 설계 및 구현

### 2.1 ERD 설계

- [ ] 엔티티 관계도 작성
  - User (Admin)
  - Schedule
  - Reservation
  - ConsultationRecord
  - AccessToken

### 2.2 엔티티 모델 정의

#### 2.2.1 User 엔티티

- [ ] 필드 정의
  - `id` (PK, UUID 또는 Auto Increment)
  - `email` (Unique)
  - `password` (Hashed)
  - `name`
  - `role` (Admin)
  - `createdAt`, `updatedAt`
- [ ] TypeORM/Prisma 모델 생성

#### 2.2.2 Schedule 엔티티

- [ ] 필드 정의
  - `id` (PK)
  - `userId` (FK → User)
  - `startTime` (DateTime)
  - `endTime` (DateTime)
  - `maxReservations` (기본값: 3)
  - `createdAt`, `updatedAt`
- [ ] TypeORM/Prisma 모델 생성
- [ ] 인덱스 설정 (startTime, userId)

#### 2.2.3 Reservation 엔티티

- [ ] 필드 정의
  - `id` (PK)
  - `scheduleId` (FK → Schedule)
  - `applicantName` (신청자 이름)
  - `applicantEmail` (신청자 이메일)
  - `status` (예약 상태)
  - `createdAt`, `updatedAt`
- [ ] TypeORM/Prisma 모델 생성
- [ ] 인덱스 설정 (scheduleId)

#### 2.2.4 ConsultationRecord 엔티티

- [ ] 필드 정의
  - `id` (PK)
  - `reservationId` (FK → Reservation, Unique)
  - `content` (상담 기록 내용)
  - `createdAt`, `updatedAt`
- [ ] TypeORM/Prisma 모델 생성

#### 2.2.5 AccessToken 엔티티

- [ ] 필드 정의
  - `id` (PK)
  - `token` (Unique, UUID)
  - `scheduleId` (FK → Schedule)
  - `expiresAt` (만료 시간)
  - `used` (사용 여부, 기본값: false)
  - `createdAt`
- [ ] TypeORM/Prisma 모델 생성
- [ ] 인덱스 설정 (token)

### 2.3 관계 설정

- [ ] User(1) : Schedule(N) 관계 설정
- [ ] Schedule(1) : Reservation(N) 관계 설정
- [ ] Reservation(1) : ConsultationRecord(1) 관계 설정
- [ ] Schedule(1) : AccessToken(N) 관계 설정

### 2.4 마이그레이션 생성 및 실행

- [ ] 초기 마이그레이션 파일 생성
- [ ] 마이그레이션 실행
- [ ] 데이터베이스 스키마 검증

### 2.5 시드 데이터 생성 (선택적)

- [ ] 테스트용 Admin 계정 생성
- [ ] 샘플 스케줄 데이터 생성

**예상 소요 시간: 2-3일**

---

## 3. Backend API 개발

### 3.1 인증 모듈 구현

#### 3.1.1 JWT 전략 설정

- [ ] Passport JWT Strategy 구현
- [ ] JWT 토큰 생성/검증 로직
- [ ] 환경 변수에 JWT Secret 설정

#### 3.1.2 Auth Controller & Service

- [ ] `POST /auth/login` - 관리자 로그인
  - 이메일/비밀번호 검증
  - JWT 토큰 발급
- [ ] `POST /auth/logout` - 로그아웃 (선택적)
- [ ] `GET /auth/me` - 현재 사용자 정보 조회
- [ ] Guard 구현 (JwtAuthGuard, AdminGuard)

### 3.2 스케줄 관리 API

#### 3.2.1 Schedule Controller & Service

- [ ] `GET /admin/schedules` - 스케줄 목록 조회
  - 페이지네이션
  - 날짜 필터링
- [ ] `POST /admin/schedules` - 스케줄 생성
  - 30분 단위 검증
  - 중복 시간 검증
  - 최대 예약 인원 설정 (기본값: 3)
- [ ] `PATCH /admin/schedules/:id` - 스케줄 수정
  - 예약이 있는 경우 제한
- [ ] `DELETE /admin/schedules/:id` - 스케줄 삭제
  - 예약이 있는 경우 제한 또는 연쇄 삭제 정책 결정

#### 3.2.2 비즈니스 로직

- [ ] 30분 단위 시간 슬롯 생성 로직
- [ ] 시간 중복 검증 로직
- [ ] 예약 가능 여부 확인 로직

### 3.3 상담 신청 링크 API

#### 3.3.1 AccessToken 생성 및 이메일 발송

- [ ] `POST /admin/schedules/:id/generate-link` - 신청 링크 생성
  - AccessToken 생성 (UUID)
  - 만료 시간 설정 (예: 7일)
  - DB 저장
- [ ] 이메일 발송 기능
  - Nodemailer 설정
  - 이메일 템플릿 작성
  - 링크 URL 생성 (예: `/booking?token={token}`)
  - 상담사 이메일로 발송

### 3.4 예약 API (Public)

#### 3.4.1 Public Reservation Controller & Service

- [ ] `GET /public/schedules` - 예약 가능한 스케줄 조회
  - AccessToken 검증
  - 예약 가능한 슬롯만 필터링 (현재 예약 수 < 최대 정원)
  - 날짜별 그룹화
- [ ] `POST /public/reservations` - 예약 신청
  - AccessToken 검증
  - 스케줄 ID, 신청자 정보 (이름, 이메일) 받기
  - **동시성 제어: Pessimistic Lock 적용**
    - 트랜잭션 시작
    - Schedule 엔티티에 Row Lock
    - 현재 예약 수 확인
    - 정원 초과 검증
    - Reservation 생성
    - 트랜잭션 커밋
  - 정원 초과 시 에러 응답

#### 3.4.2 동시성 제어 구현

- [ ] TypeORM/Prisma Pessimistic Lock 설정
- [ ] 트랜잭션 격리 수준 설정 (READ COMMITTED 이상)
- [ ] 동시성 테스트 케이스 작성

### 3.5 관리자 예약 관리 API

#### 3.5.1 Reservation Controller & Service

- [ ] `GET /admin/schedules/:id/reservations` - 스케줄별 예약 목록
  - 스케줄 ID로 예약 조회
  - 정렬 (생성일 기준)
- [ ] `GET /admin/reservations/:id` - 예약 상세 조회

### 3.6 상담 기록 API

#### 3.6.1 ConsultationRecord Controller & Service

- [ ] `POST /admin/reservations/:id/consultation-record` - 상담 기록 작성
  - Reservation ID 검증
  - ConsultationRecord 생성 또는 업데이트
- [ ] `GET /admin/reservations/:id/consultation-record` - 상담 기록 조회
- [ ] `PATCH /admin/consultation-records/:id` - 상담 기록 수정

### 3.7 유효성 검증 및 에러 처리

- [ ] DTO 클래스 생성 (class-validator 사용)
  - LoginDto
  - CreateScheduleDto
  - CreateReservationDto
  - CreateConsultationRecordDto
- [ ] Global Exception Filter 구현
- [ ] 커스텀 에러 응답 포맷 정의

### 3.8 API 문서화

- [ ] Swagger/OpenAPI 설정
- [ ] 각 엔드포인트 문서화
- [ ] 요청/응답 예시 작성

**예상 소요 시간: 5-7일**

---

## 4. Frontend 개발

### 4.1 공통 컴포넌트 및 유틸리티

#### 4.1.1 프로젝트 구조 설정

- [ ] 디렉토리 구조 생성
  ```
  frontend/
  ├── src/
  │   ├── components/     # 공통 컴포넌트
  │   ├── pages/          # 페이지 컴포넌트
  │   ├── services/       # API 서비스
  │   ├── hooks/          # 커스텀 훅
  │   ├── utils/          # 유틸리티
  │   └── styles/         # 스타일
  ```

#### 4.1.2 API 클라이언트 설정

- [ ] Axios 인스턴스 생성
- [ ] 요청 인터셉터 (JWT 토큰 추가)
- [ ] 응답 인터셉터 (에러 처리)
- [ ] API 서비스 함수 작성
  - `authService`
  - `scheduleService`
  - `reservationService`
  - `consultationRecordService`

#### 4.1.3 공통 컴포넌트

- [ ] Button 컴포넌트
- [ ] Input 컴포넌트
- [ ] Modal 컴포넌트
- [ ] Loading 컴포넌트
- [ ] DatePicker 컴포넌트 (또는 라이브러리 사용)

### 4.2 관리자 앱 (Admin App)

#### 4.2.1 인증 페이지

- [ ] 로그인 페이지 (`/admin/login`)
  - 이메일/비밀번호 입력 폼
  - 로그인 API 호출
  - JWT 토큰 로컬 스토리지 저장
  - 로그인 성공 시 대시보드로 리다이렉트

#### 4.2.2 대시보드 레이아웃

- [ ] Admin Layout 컴포넌트
  - 사이드바/네비게이션
  - 헤더 (로그아웃 버튼)
  - Protected Route 구현

#### 4.2.3 스케줄 관리 페이지

- [ ] 스케줄 목록 페이지 (`/admin/schedules`)
  - 스케줄 목록 표시 (테이블 또는 캘린더)
  - 날짜 필터
  - 스케줄 생성 버튼
- [ ] 스케줄 생성 모달/페이지
  - 날짜 선택
  - 시간 선택 (30분 단위)
  - 최대 예약 인원 설정
  - 생성 API 호출
- [ ] 스케줄 수정/삭제 기능
  - 수정 모달
  - 삭제 확인 다이얼로그

#### 4.2.4 상담 신청 링크 생성

- [ ] 스케줄 상세 페이지 또는 모달
  - "신청 링크 생성" 버튼
  - 링크 생성 API 호출
  - 생성된 링크 표시 (복사 기능)
  - 이메일 발송 확인 메시지

#### 4.2.5 예약 관리 페이지

- [ ] 스케줄별 예약 목록 (`/admin/schedules/:id/reservations`)
  - 예약 목록 테이블
  - 신청자 정보 표시
  - 예약 상태 표시
- [ ] 예약 상세 페이지

#### 4.2.6 상담 기록 작성

- [ ] 상담 기록 작성 페이지 (`/admin/reservations/:id/record`)
  - 텍스트 에디터 또는 텍스트 영역
  - 저장 버튼
  - 상담 기록 조회/수정 기능

### 4.3 신청자 앱 (User App)

#### 4.3.1 예약 페이지

- [ ] 예약 페이지 (`/booking?token={token}`)
  - URL에서 토큰 추출
  - 토큰 검증 API 호출
  - 예약 가능한 스케줄 목록 조회
  - 날짜별 그룹화 표시
  - 시간 슬롯 카드/버튼
    - 예약 가능: 클릭 가능
    - 정원 초과: 비활성화 표시

#### 4.3.2 예약 신청 폼

- [ ] 예약 신청 모달/폼
  - 신청자 이름 입력
  - 신청자 이메일 입력
  - 선택한 시간 슬롯 표시
  - 예약 신청 API 호출
  - 로딩 상태 처리
  - 성공/실패 메시지 표시

#### 4.3.3 예약 완료 페이지

- [ ] 예약 완료 메시지 표시
  - 예약 정보 요약
  - 확인 메시지

### 4.4 스타일링

- [ ] CSS 프레임워크 선택 (Tailwind CSS, Material-UI, 또는 순수 CSS)
- [ ] 반응형 디자인 적용
- [ ] 다크 모드 지원 (선택적)

**예상 소요 시간: 6-8일**

---

## 5. 통합 및 테스트

### 5.1 단위 테스트

- [x] Backend 서비스 로직 단위 테스트
  - Schedule Service 테스트 ✅
  - Reservation Service 테스트 (동시성 포함) ✅
  - Auth Service 테스트 ✅
- [ ] Frontend 컴포넌트 테스트 (선택적)
  - React Testing Library 사용

### 5.2 통합 테스트

- [x] API 엔드포인트 통합 테스트
  - 인증 플로우 ✅
  - 스케줄 생성/수정/삭제 플로우 ✅
  - 예약 신청 플로우 ✅
  - 상담 기록 작성 플로우 (기본 구현 완료)
- [x] 동시성 테스트
  - 동일 시간대 다수 예약 요청 시뮬레이션 ✅
  - 정원 초과 방지 검증 ✅

### 5.3 E2E 테스트 (선택적)

- [x] 전체 사용자 플로우 테스트
  - 관리자 로그인 → 스케줄 생성 → 링크 생성 ✅
  - 신청자 링크 접근 → 예약 신청 → 완료 ✅

### 5.4 성능 테스트

- [ ] 동시 예약 요청 부하 테스트 (기본 동시성 테스트 완료)
- [ ] 데이터베이스 쿼리 성능 최적화
- [ ] 인덱스 효과 검증

### 5.5 보안 테스트

- [x] JWT 토큰 검증 테스트 ✅
- [x] 권한 검증 테스트 ✅
- [x] SQL Injection 방어 테스트 (Prisma 사용으로 자동 방어) ✅
- [x] 입력값 검증 테스트 (class-validator 사용) ✅

**예상 소요 시간: 3-4일**

---

## 6. 배포 준비

### 6.1 프로덕션 환경 설정

- [ ] 환경 변수 프로덕션 값 설정
- [ ] 데이터베이스 마이그레이션 스크립트 준비
- [ ] 로깅 설정 (Winston 등)

### 6.2 Docker 프로덕션 이미지

- [ ] Backend 프로덕션 Dockerfile 작성
- [ ] Frontend 빌드 및 프로덕션 Dockerfile 작성
- [ ] docker-compose.prod.yml 작성

### 6.3 배포 스크립트

- [ ] 배포 자동화 스크립트 작성
- [ ] 데이터베이스 백업 스크립트

### 6.4 문서화

- [ ] API 문서 최종 정리
- [ ] 배포 가이드 작성
- [ ] 운영 매뉴얼 작성

**예상 소요 시간: 2-3일**

---

## 전체 일정 요약

| 단계                            | 예상 소요 시간 | 누적 시간 |
| ------------------------------- | -------------- | --------- |
| 1. 프로젝트 설정 및 인프라 구축 | 1-2일          | 1-2일     |
| 2. 데이터베이스 설계 및 구현    | 2-3일          | 3-5일     |
| 3. Backend API 개발             | 5-7일          | 8-12일    |
| 4. Frontend 개발                | 6-8일          | 14-20일   |
| 5. 통합 및 테스트               | 3-4일          | 17-24일   |
| 6. 배포 준비                    | 2-3일          | 19-27일   |

**총 예상 소요 시간: 약 3-4주 (1인 기준)**

---

## 우선순위 및 마일스톤

### Phase 1: 핵심 기능 (MVP)

- 인증 시스템
- 스케줄 생성/조회
- 예약 신청 (동시성 제어 포함)
- 기본 UI

### Phase 2: 관리 기능

- 예약 관리
- 상담 기록 작성
- 이메일 링크 생성 및 발송

### Phase 3: 완성도 향상

- 테스트 작성
- UI/UX 개선
- 성능 최적화
- 배포 준비

---

## 주요 기술적 고려사항

### 동시성 제어

- **Pessimistic Lock** 사용 (TypeORM `findOne({ lock: { mode: 'pessimistic_write' } })` 또는 Prisma `$transaction` with `SELECT FOR UPDATE`)
- 트랜잭션 격리 수준: `READ COMMITTED` 이상
- 예약 생성 시 Schedule 엔티티에 Lock 적용 후 현재 예약 수 확인

### 에러 처리

- 일관된 에러 응답 포맷
- 클라이언트 친화적인 에러 메시지
- 로깅 및 모니터링 (선택적)

### 보안

- 비밀번호 해싱 (bcrypt)
- JWT 토큰 만료 시간 설정
- AccessToken 만료 처리
- 입력값 검증 (DTO + class-validator)

---

## 참고사항

- 각 단계는 병렬 작업이 가능한 부분이 있으나, 의존성이 있는 작업은 순차적으로 진행
- 개발 중 요구사항 변경 시 PRD와 본 실행계획을 함께 업데이트
- 코드 리뷰 및 리팩토링은 각 단계 완료 후 진행 권장
