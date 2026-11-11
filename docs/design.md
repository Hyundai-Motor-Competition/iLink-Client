# 모바일 앱 1차 설계

## 범위

보호자 화면 P00-1 ~ P09, 자녀 화면 C00 ~ C05. 앱은 하나이고, 로그인 토큰의 역할(role)로 보호자 / 자녀 화면을 나눈다.

- 보호자(GUARDIAN · CO_GUARDIAN · DELEGATE · TEACHER): 차량 QR로 연결 승인(LINK-04)하면서 계정이 생긴다. 공동 보호자·대리 보호자는 초대 링크로 들어온다
- 자녀(CHILD): 보호자가 보낸 초대 링크(FAM-04) → C00에서 수락(FAM-06)

## 스택

- React Native 0.88 (CLI), TypeScript
- 네비게이션: React Navigation (native-stack)
- 서버 상태: TanStack Query / 앱 상태: zustand
- 토큰: react-native-keychain
- API 타입: Swagger에서 생성 (`npm run api:types` → `src/api/schema.d.ts`)

## 폴더

```
src/
├─ api/            fetch 클라이언트(401 시 refresh 1회, Idempotency-Key), 오류 타입, 엔드포인트, 생성 타입
├─ app/            App 루트, 네비게이션(역할별 스택), 딥링크
├─ domain/         세션 병합 규칙, 자녀 화면 결정, 오류 코드 문구
├─ features/       link(P00) · family(P01) · schedule(P02) · spot(P03) · setup(P06)
│                  session(P07·P08) · outcome(P09) · invite(C00) · child(C01~C05)
├─ services/       secureStore, push(인터페이스), location(인터페이스)
├─ stores/         authStore
└─ shared/         theme, ui, utils
```

## 화면 ↔ API

| 화면 | API (Swagger ID) |
|---|---|
| P00-1 QR 스캔·코드 확인 | LINK-03 (인증 없음) |
| P00-2 연결 승인 | LINK-04 → 보호자 토큰 |
| P01 가족 프로필 | FAM-01 · 02 · 03 · 04 · 07 |
| P02 학원·일정 | SET-01 · 02 · 03 · 04 |
| P03 픽업 장소 | SPOT-01 · 02 · 03 |
| P06 설정 완료 | SET-07 · 08, SET-06(합류 안내 방식) |
| P07 진행 현황 | SES-01 · 03, NOTI-02 · 03 |
| P08 예외·권한 | SES-05 · 06 · 07 · 10, CALL-01 · 03 |
| P09 결과 | OUT-01 · 02 · 03 · 04 |
| C00 가족 연결 | FAM-05 · 06 |
| C01~C05 | SES-01 · 03 · 09, CALL-04, SIG-03 · 04 · 05 |

## 상태 동기화

SSE(SES-08)는 차량 토큰 전용이라 모바일은 폴링으로 맞춘다.

- 진행 중 세션: 5초마다 SES-03, 종료되면 멈춤. 푸시를 받으면 바로 재조회
- 모든 응답은 `mergeSessionView`를 거친다. 낮은 `stateVersion`은 버리고, COMPLETED/CANCELLED 이후 응답은 무시 (F4-04, F4-07)
- 푸시로 화면을 열 때 `isStalePush`로 지난 `spotVersion`·`stateVersion`이면 열지 않는다 (QA-21)
- 명령 API는 `Idempotency-Key`를 붙이고, 같은 사용자 동작을 다시 보낼 때는 같은 키를 쓴다 (P00-2 중복 탭)

## 자녀 화면 결정 (`resolveChildScreen`)

서버 상태 기준이다. 자녀가 단계를 직접 넘기지 않는다.

| 조건 | 화면 |
|---|---|
| COMPLETED (탑승) | C05 |
| COMPLETED인데 NOT_BOARDED, CANCELLED, ON_HOLD, incident, 호출 REVOKED, 장소 INVALIDATED | C04 |
| childPhase CALLED · MEETING | C03 |
| 준비 알림 받음 (이벤트 DEPARTURE_NOTICE_SENT) | C02 |
| 그 외 | C01 |

## 남은 일

- [ ] Figma 기준 화면 구현 (P01~P03, P06, P08, P09는 자리표시만 있음)
- [ ] P00-1 카메라 QR 스캔 (react-native-vision-camera), 권한 거절 처리
- [ ] FCM 푸시 (google-services.json 필요), 수신 확인(NOTI-01)
- [ ] 자녀 위치 공유(SIG-04): 세션 ACTIVE 동안만, 종료 즉시 중단
- [ ] P03 지도 (지도 SDK 선정)
- [ ] 초대 링크 형식 확정 후 딥링크 수정
- [ ] iOS 빌드 확인 (pod install)
