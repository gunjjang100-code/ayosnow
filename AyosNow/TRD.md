# PuntaGo TRD

## 1. 문서 목적

이 문서는 PuntaGo를 어떤 기술 구조로 만들고 배포하는지 정리한 기술 요구사항 문서입니다.

쉽게 말해 TRD는 "어떻게 만들 것인가"를 정리하는 문서입니다. PRD가 목적지라면, TRD는 목적지까지 가는 설계도입니다.

현재 기준일: 2026-06-30

현재 운영 기준:

- 브랜드명: PuntaGo
- 운영 도메인: `https://puntago.net`
- Cloudflare Worker: `puntago`
- 운영 DB: `puntago-db`
- 업로드 저장소: `puntago-uploads`
- OpenNext 캐시 저장소: `puntago-opennext-cache`

이전 AyosNow 이름의 Cloudflare 리소스는 정리 완료했습니다.

## 2. 현재 기술 스택

### 프론트엔드

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS

### 백엔드

- Next.js Route Handler
- Server Component 기반 페이지
- 서비스 레이어 구조: `src/lib/**`
- 입력 검증: Zod
- 인증: NextAuth

### 데이터베이스

- Cloudflare D1
- Prisma Client
- `@prisma/adapter-d1`
- 로컬 개발 DB와 원격 운영 DB를 분리

### 배포

- Cloudflare Workers
- OpenNext for Cloudflare
- Cloudflare R2 incremental cache
- 도메인: `puntago.net`, `www.puntago.net`

### 외부 연동

- Google OAuth
- Web Push
- PayMongo
- Resend Email
- Twilio SMS

현재 연결 상태:

- Google OAuth: 연결 완료, provider 응답 확인 완료
- Web Push: Secret 등록 완료, 구독 DB 저장 확인 완료
- PayMongo: 코드 구조는 있으나 운영 키/웹훅 연결은 출시 전 마지막 단계에서 진행
- Resend Email/Twilio SMS: provider 구조는 있으나 운영 키 연결은 선택 단계

## 3. 폴더 구조

```txt
PuntaGo/
  src/
    app/                 페이지와 API 라우트
    components/          화면에서 재사용하는 UI 컴포넌트
    lib/                 실제 비즈니스 로직
    types/               타입 확장
  prisma/
    schema.prisma        데이터 모델 정의
  migrations/            Cloudflare D1 SQL 마이그레이션
  public/                정적 파일과 서비스 워커
  tests/                 자동 테스트
  wrangler.jsonc         Cloudflare 배포 설정
  open-next.config.ts    OpenNext Cloudflare 설정
```

초보자용 설명:

- `src/app`은 가게 입구와 계산대입니다. 사용자가 보는 페이지와 API 주소가 있습니다.
- `src/components`는 반복해서 쓰는 화면 조각입니다.
- `src/lib`는 실제 일을 처리하는 직원입니다. 예약 생성, 결제 처리, 알림 생성 같은 핵심 로직이 있습니다.
- `prisma/schema.prisma`는 데이터베이스의 설계도입니다.
- `migrations`는 데이터베이스에 설계도를 실제로 적용하는 SQL 기록입니다.

## 4. 주요 런타임 명령어

```bash
npm run dev
```

Next.js 개발 서버를 실행합니다.

```bash
npm run lint
```

코드 스타일과 기본 오류를 검사합니다.

```bash
npm test
```

자동 테스트를 실행합니다.

```bash
npm run build:cloudflare
```

Cloudflare 배포용 빌드를 생성합니다.

```bash
npm run preview:cloudflare
```

Cloudflare Workers와 비슷한 환경으로 로컬 미리보기를 실행합니다.

```bash
npm run deploy:cloudflare
```

Cloudflare Workers에 배포합니다.

## 5. 환경변수와 Secrets

### 일반 변수

`wrangler.jsonc`에 들어가는 공개 운영 설정입니다.

- `APP_URL=https://puntago.net`
- `NEXTAUTH_URL=https://puntago.net`
- `WEB_PUSH_CONTACT_EMAIL=mailto:hello@puntago.net`
- `EMAIL_FROM=PuntaGo <hello@puntago.net>`

### Cloudflare Secrets로 넣어야 하는 값

이 값들은 비밀번호처럼 다뤄야 합니다. 코드에 직접 적으면 안 됩니다.

- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY`
- `WEB_PUSH_PRIVATE_KEY`
- `ENABLE_DEMO_AUTH`
- `ENABLE_DEMO_DATA`

출시 전 PayMongo를 켤 때 추가로 필요한 값:

- `PAYMONGO_SECRET_KEY`
- `PAYMONGO_PUBLIC_KEY`
- `PAYMONGO_WEBHOOK_SECRET`

이메일/SMS를 실제 발송할 때 추가로 필요한 값:

- `RESEND_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`

운영 권장값:

```txt
ENABLE_DEMO_AUTH=false
ENABLE_DEMO_DATA=false
```

## 6. 데이터 모델 요약

### 사용자

- `User`: 고객, 전문가, 관리자 공통 계정
- `TradesmanProfile`: 전문가 상세 프로필
- `TradesmanSkill`: 전문가가 가능한 카테고리
- `Certification`: 전문가 인증서
- `PortfolioItem`: 전문가 작업 사진

### 서비스/견적/예약

- `ServiceCategory`: 서비스 카테고리
- `Service`: 전문가가 등록한 서비스
- `QuoteRequest`: 고객 견적 요청
- `Quote`: 전문가 견적 제안
- `Booking`: 예약
- `Review`: 완료 예약 후기

### 채팅/알림

- `Conversation`: 고객과 전문가 대화방
- `Message`: 채팅 메시지
- `TypingIndicator`: 타이핑 표시
- `Notification`: 인앱/이메일/푸시/SMS 알림 기록
- `PushSubscription`: Web Push 구독 정보

### 지갑/결제

- `Wallet`: 사용자 지갑
- `CreditTransaction`: 크레딧 거래 기록
- `WalletTopupPayment`: PayMongo 또는 관리자 충전 기록

### 운영/관리

- `ReferralSetting`: 추천 보상 설정
- `ReferralReward`: 추천 보상 지급 기록
- `PlatformCommissionRule`: 수수료 규칙
- `AdminBanner`: 관리자 배너
- `AdminNotice`: 관리자 공지
- `Dispute`: 분쟁
- `OneOutCase`: 전문가 제재/신고 처리
- `TradesmanApprovalRequest`: 전문가 승인 요청

## 7. 핵심 API 설계

### 인증

- `POST /api/signup`
- `GET|POST /api/auth/[...nextauth]`
- `POST /api/account/role`

### 견적 요청

- `GET /api/quote-requests`
- `POST /api/quote-requests`

### 견적

- `GET /api/quotes`
- `POST /api/quotes`
- `POST /api/quotes/select`

### 예약

- `POST /api/bookings/instant`
- `POST /api/bookings/[id]/status`
- `POST /api/bookings/[id]/schedule`
- `POST /api/bookings/[id]/complete`
- `POST /api/bookings/[id]/review`

### 채팅

- `GET /api/conversations`
- `POST /api/conversations`
- `GET /api/conversations/[id]`
- `POST /api/conversations/[id]/messages`
- `POST /api/conversations/[id]/read`
- `POST /api/conversations/[id]/typing`
- `POST /api/conversations/from-booking`

### 알림

- `GET /api/notifications`
- `POST /api/notifications/read`
- `POST /api/notifications/read-all`
- `GET /api/notifications/unread-count`
- `POST /api/push-subscriptions`

### 지갑/결제

- `POST /api/wallet-topups`
- `POST /api/paymongo/webhook`
- `GET /api/admin/wallets/[userId]`
- `POST /api/admin/wallet-topups`

### 관리자

- `GET|POST /api/admin/categories`
- `GET|POST /api/admin/referral-settings`

## 8. 권한 설계

### 기본 원칙

- 화면에서 버튼을 숨기는 것만으로는 부족합니다.
- API 안에서 다시 권한을 검사해야 합니다.
- 사용자가 보낸 `userId`, `role`, `status` 값은 믿으면 안 됩니다.

### 권한 규칙

고객:

- 본인의 견적 요청만 생성/조회 가능
- 본인의 예약만 조회 가능
- 완료된 본인 예약에만 후기 작성 가능

전문가:

- 본인에게 관련된 요청/예약/채팅만 조회 가능
- 견적 제출 시 본인 지갑에서 크레딧 차감
- 본인 프로필과 서비스만 수정 가능

관리자:

- 관리자 전용 API 접근 가능
- 지갑 수동 충전 가능
- 카테고리/추천 보상/운영 설정 관리 가능

## 9. 입력 검증 설계

입력 검증은 `src/lib/validations/**`에 둡니다.

필수 검증:

- 이메일 형식
- 비밀번호 길이
- 견적 요청 제목/설명/주소
- 견적 금액
- 예약 상태 변경값
- 후기 별점 1~5점
- 후기 내용 10자 이상
- 알림/푸시 구독 값
- 관리자 입력값

초보자용 설명:

사용자 입력은 택배 상자와 같습니다. 겉으로 멀쩡해 보여도 안에 위험한 물건이 들어 있을 수 있으니, 서버에서 열어보고 허용된 것만 받아야 합니다.

## 10. 크레딧 차감 설계

### 규칙

- 전문가가 견적을 제출하면 40 PHP를 차감합니다.
- 같은 `quoteRequestId`와 같은 `tradesmanId` 조합은 한 번만 차감합니다.
- `CreditTransaction.referenceKey`로 중복 차감을 막습니다.
- 지갑 잔액이 부족하면 견적 제출을 실패 처리합니다.

### 기대 동작

1. 전문가가 견적 제출 버튼을 누릅니다.
2. 서버가 전문가 권한과 지갑 잔액을 확인합니다.
3. 중복 차감 기록이 있는지 확인합니다.
4. 없으면 40 PHP를 차감합니다.
5. 견적을 저장합니다.

## 11. 후기 작성 설계

### 규칙

- 예약 상태가 `COMPLETED`일 때만 작성 가능합니다.
- 예약의 고객만 작성 가능합니다.
- 같은 예약에 같은 고객은 1번만 작성 가능합니다.
- 저장 후 전문가 프로필의 평균 평점과 완료 작업 수를 다시 계산합니다.

### DB 보호

`Review` 모델에 아래 고유 조건이 있습니다.

```txt
@@unique([bookingId, authorId])
```

이 조건은 "같은 예약에 같은 사람이 후기를 두 번 쓰지 못하게 하는 잠금장치"입니다.

## 12. PayMongo 설계

### 결제 생성

- 사용자가 충전 금액을 선택합니다.
- 서버가 PayMongo checkout session을 만듭니다.
- 사용자는 PayMongo 결제 페이지로 이동합니다.
- 결제 기록은 `WalletTopupPayment`에 저장됩니다.

### 웹훅 처리

- PayMongo가 결제 완료 이벤트를 보냅니다.
- 서버는 `PAYMONGO_WEBHOOK_SECRET`으로 서명을 검증합니다.
- 서명이 맞으면 결제 상태를 `PAID`로 변경합니다.
- 지갑 잔액을 증가시킵니다.
- 같은 이벤트가 다시 와도 중복 처리하지 않습니다.

## 13. 알림 설계

### 알림 채널

- `IN_APP`
- `EMAIL`
- `PUSH`
- `SMS`

### 처리 방식

- 핵심 알림은 DB에 먼저 저장합니다.
- 이메일/푸시/SMS는 provider 구조로 분리합니다.
- 외부 키가 없으면 실제 발송은 실패할 수 있으므로 운영 전 키를 넣어야 합니다.

## 14. 채팅 설계

### 현재 구조

- 대화방은 고객과 전문가 사이에 생성됩니다.
- 메시지는 `Message`에 저장됩니다.
- 읽음 처리는 `readAt`으로 관리합니다.
- 타이핑 상태는 `TypingIndicator`로 관리합니다.
- 이미지/파일 메시지는 R2 업로드 후 파일 메타데이터만 DB에 저장합니다.

### 파일 저장 구조

- Cloudflare R2가 사용자 업로드 파일의 표준 저장소입니다.
- DB에는 Base64/Data URL 같은 큰 이미지 문자열을 저장하지 않습니다.
- DB에는 아래 정보만 저장합니다.
  - R2 object key
  - 파일 URL
  - 원본 파일명
  - 파일 크기
  - MIME 타입
  - 업로드한 사용자
  - 업로드 시간
- 모든 업로드 파일명은 UUID 기반으로 생성합니다.
- 업로드 전 파일 크기와 MIME 타입을 검증합니다.

R2 폴더 규칙:

- `chat/`
- `profile/`
- `portfolio/`
- `services/`
- `reviews/`
- `reports/`

초보자용 설명:

예전 방식은 사진 자체를 DB 안에 넣는 방식이었습니다. 지금 방식은 사진은 R2라는 창고에 보관하고, DB에는 "어느 선반에 있는지 적은 주소표"만 저장하는 방식입니다. 그래서 DB가 가벼워지고 운영 비용과 성능 관리가 쉬워집니다.

## 15. Cloudflare 배포 설계

### 사용 리소스

- Worker: `puntago`
- D1: `puntago-db`
- R2: `puntago-opennext-cache`, `puntago-uploads`
- Images binding: `IMAGES`
- Custom Domains:
  - `puntago.net`
  - `www.puntago.net`

### 최종 확인된 Cloudflare 상태

2026-06-30 기준 직접 확인한 내용:

- D1 목록에는 `puntago-db`만 남아 있습니다.
- R2 목록에는 `puntago-opennext-cache`, `puntago-uploads`만 남아 있습니다.
- 이전 `ayosnow-db`, `ayosnow-uploads`, `ayosnow-opennext-cache`는 삭제 완료했습니다.
- `https://puntago.net/api/auth/providers`에서 `google` provider가 표시됩니다.
- 배포된 `https://puntago.net` HTML에서 `AyosNow`, `ayosnow`, `AYOS` 문자열은 0개입니다.

### 배포 순서

1. 운영 Secrets 입력
2. D1 원격 마이그레이션 적용
3. Cloudflare build 실행
4. Worker 배포
5. 도메인 접속 확인
6. 실제 로그인/결제/푸시 테스트

### 주요 명령어

```bash
npx wrangler d1 migrations apply puntago-db --remote
```

원격 운영 D1에 DB 구조를 적용합니다.

```bash
npm run build:cloudflare
```

Cloudflare용 빌드가 되는지 확인합니다.

```bash
npm run deploy:cloudflare
```

Cloudflare Workers에 배포합니다.

## 16. 테스트 전략

### 자동 테스트

현재 테스트 대상:

- PayMongo 웹훅 서명 검증
- CSRF Origin 검사
- 견적 수수료 중복 방지 키
- 후기 입력 검증
- 기본 견적 수수료 40 PHP
- 충전 패키지 200/400/800 PHP

실행:

```bash
npm test
```

### 수동 QA

고객:

- 회원가입/로그인
- 견적 요청 생성
- 견적 선택
- 채팅
- 예약 확인
- 후기 작성

전문가:

- 전문가 프로필 작성
- 기술/서비스 등록
- 견적 제출
- 크레딧 차감 확인
- 채팅
- 예약 상태 변경

관리자:

- 카테고리 관리
- 지갑 수동 충전
- 추천 보상 설정
- 배너/공지 설정

운영:

- Google 로그인 실제 클릭 테스트
- Web Push 권한 허용과 실제 수신 테스트
- PayMongo 실제 결제
- PayMongo 웹훅
- `puntago.net` 도메인 접속

## 17. 보안 요구사항

- 모든 mutation API는 CSRF Origin 검사를 통과해야 합니다.
- 보호 API는 세션이 없으면 401을 반환해야 합니다.
- 관리자 API는 관리자 역할이 아니면 403을 반환해야 합니다.
- 결제 웹훅은 서명 검증 전에는 처리하면 안 됩니다.
- 운영 Secrets는 Git에 커밋하면 안 됩니다.
- 데모 로그인과 데모 데이터는 운영에서 꺼야 합니다.
- 사용자 입력은 Zod로 검증해야 합니다.

## 18. 운영 전 기술 체크리스트

### 완료

- `puntago` Worker 연결
- `puntago-db` 연결
- `puntago-uploads` 연결
- `puntago-opennext-cache` 연결
- 새 `NEXTAUTH_SECRET` 등록
- 새 Google OAuth Secret 등록
- 새 Web Push VAPID Secret 등록
- `ENABLE_DEMO_AUTH=false`
- `ENABLE_DEMO_DATA=false`
- Google provider 표시 확인
- Web Push 구독 DB 저장 확인
- 이전 AyosNow Cloudflare 리소스 삭제
- 배포 HTML에서 AyosNow 문자열 0개 확인

### 출시 전 다시 확인

- `npm run lint` 통과
- `npm test` 통과
- `npm run build:cloudflare` 통과
- Google 로그인 실제 클릭 테스트
- Web Push 실제 알림 수신 테스트
- 고객/전문가/관리자 핵심 흐름 수동 QA

### PayMongo 연결 시 진행

- PayMongo 운영 키 등록
- PayMongo Webhook URL 등록
- 실제 결제 1회 테스트
- 웹훅으로 지갑 충전 반영 확인

## 19. 알려진 주의사항

- Next.js 16에서 `middleware` 파일 convention deprecation 경고가 나올 수 있습니다. 현재는 빌드 실패 원인은 아니지만 추후 `proxy` 구조로 변경하는 것이 좋습니다.
- OpenNext 번들에서 `getElementsByTagName` 중복 경고가 나올 수 있습니다. 현재는 경고이며 빌드 실패는 아닙니다.
- Cloudflare D1 `list` 명령의 `num_tables` 표시가 실제 내부 조회와 다르게 보일 수 있습니다. 최종 확인은 `sqlite_master` 직접 조회를 기준으로 합니다.
- 로컬 `.env`의 `NEXTAUTH_URL`이 운영 도메인으로 되어 있으면 로컬 로그인 후 운영 도메인으로 이동할 수 있습니다.
- R2 버킷은 안에 파일이 있으면 바로 삭제되지 않습니다. 삭제하려면 먼저 객체를 비워야 합니다.
- PayMongo는 아직 운영 연결 전입니다. 결제 기능을 출시하려면 키와 웹훅 등록 후 실제 결제 테스트가 필요합니다.

## 20. 출시 가능 조건

아래 조건을 모두 만족하면 운영 배포가 가능합니다.

- 원격 D1에 모든 테이블과 인덱스가 존재합니다.
- 운영 도메인에서 앱이 열립니다.
- 고객/전문가/관리자 로그인 흐름이 정상입니다.
- 실제 PayMongo 결제와 웹훅이 성공합니다.
- Web Push 구독과 수신이 성공합니다.
- 견적 제출 시 40 PHP가 차감되고 중복 차감되지 않습니다.
- 완료 예약에 후기가 1번만 작성됩니다.
- 데모 데이터가 운영 화면에 노출되지 않습니다.

현재 판단:

- 브랜드/Cloudflare 리소스 정리는 운영 가능 수준입니다.
- PayMongo를 쓰지 않는 MVP라면 결제 제외 상태로 제한 출시가 가능합니다.
- PayMongo 결제를 포함한 정식 출시는 PayMongo 실제 결제와 웹훅 테스트까지 끝난 뒤 가능합니다.
