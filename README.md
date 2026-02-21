# 2026_TRIPLES_TEAM_7_BE

## 🧩 PIEC Backend

### 📌 Overview

PIEC는 파편화된 채용 정보를 하나의 공간에 통합하고,
공고 기준으로 사용자의 역량을 재정렬하여 감이 아닌 **데이터 기반 선택**을 돕는 시스템입니다.
본 레포지토리는 PIEC의 Backend API 서버입니다.

---

### 🛠 Tech Stack

* Node.js
* Express
* JavaScript
* MySQL (AWS RDS)
* AWS EC2
* Docker
* Firebase Authentication (JWT)

---

### ⚙ Core Features (Backend)

**Authentication**
* Firebase Google OAuth 기반 로그인
* JWT 검증 미들웨어 인증 처리
* Soft Delete 기반 회원 탈퇴

**Job Card System**
* 채용 공고 URL 입력
* AI 기반 공고 핵심 정보 추출 후 카드 생성
* 카드 좌표 저장 (Drag & Drop)
* 카테고리 분류 및 최대 20개 카드 관리
* 카드 상세 조회 및 삭제

**Match & GAP Analysis**
* 이력서 / 공고 텍스트 마이닝 기반 매치율 계산
* 매치율 % 저장 및 재계산 지원
* Strength / Gap / Risk 자동 분류
* Gap 항목별 3단계 실행 체크리스트 생성
* 체크리스트 완료 상태 및 읽음 처리 관리

**Interview Simulation**
* 카드 상태 전환 (면접 모드)
* AI 면접 질문 3개 자동 생성
* 질문 재생성 시 기존 데이터 교체

**My Page**
* 사용자 정보 조회
* PDF 이력서 업로드
* 체크리스트 관리
* 로그아웃

