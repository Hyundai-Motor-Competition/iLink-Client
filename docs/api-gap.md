# 기획서 ↔ Swagger 차이 (서버 확인 필요)

기준: 기획서 v0.5 (2026.11.06), Swagger `Pickup Service API v1` (2026.11.10 조회)

기획서의 API 번호(API-01~25)와 Swagger의 ID(SES-, SIG-, CALL- 등)가 다르다. 클라이언트 코드는 Swagger ID를 주석으로 단다.

## 기획서에는 있는데 Swagger에 없는 것

| 기획서 | 내용 | 지금 클라이언트 처리 | 확인할 것 |
|---|---|---|---|
| API-04 recommend-spot | SG-01~12 통과 후보 중 비용순 추천 | SPOT-01 장소 목록에서 기본 장소(isDefault)를 먼저 보여줌 | 추천 결과(추천 이유, 대안, 정차 예상)를 줄 API가 생기는지 |
| API-07 prediction | 최신 시간 예측 | SES-03 `eta` 사용 | P10/P90 같은 분포값을 줄 계획인지 |
| API-24 call-eligibility | 가드 G1~G5 · 발송 예정 | SES-03 `call.guard`, `call.scheduledAt` 사용 | `guard.unmet` 값 목록 (G1~G5 코드?) |
| API-08 child-events (READY) | 자녀 준비 완료 (EVT-06) | 없음. C02 "준비 완료" 버튼 동작 보류 | 준비 완료 신호를 보낼 API |
| F0-01 보호자 로그인 | 로그인·동의 | LINK-04 승인 응답 토큰을 로그인으로 사용 | 앱 재설치·폰 교체 시 보호자 재로그인 방법 (차량 RELINK만 가능?) |
| P03 후보 승인 | 검증된 후보 목록에서 승인 | SPOT-02로 정차·만남 좌표를 직접 추가 | 서버가 검증 후보를 내려주는지, 아니면 보호자가 직접 찍는 구조로 확정인지 |
| spotRecommendMode | 자동 추천 / 기본 장소 고정 | 필드 없음 | 저장 위치 |

## 값 정의가 다른 것

- `childPhase`: 기획서 WAITING/PREPARING/READY/CALLED/MEETING ↔ Swagger WAITING/CALLED/MEETING/NOT_BOARDED. 모바일은 세션 이벤트 `DEPARTURE_NOTICE_SENT`가 있으면 C02(준비)로 본다.
- `callStatus`: Swagger `SessionStatusResponse.call`이 enum 없는 string. 값 목록 필요 (NONE/ACCEPTED/SENT/DELIVERED/ACKNOWLEDGED/REVOKED로 가정).
- `sessionId`: 기획서 UUID ↔ Swagger int64. Swagger를 따른다.
- 오류 코드: 서버 `error.code`는 문자열(`LINK_CODE_INVALID` 등). 기획서 ERR-01~17 이름과 같은지 전체 목록 필요.

## 정해지지 않은 것

- 성공 응답 본문: 기획서는 `data, version, error` 공통 구조라고 했지만, Swagger 스키마는 본문을 바로 준다. 클라이언트는 Swagger를 따랐다. 오류는 `{ "error": { code, message, retryAfterSeconds } }`를 실제 응답으로 확인했다.
- SSE(SES-08)는 차량 토큰만 쓸 수 있다. 모바일은 폴링(5초) + 푸시 수신 시 재조회로 맞춘다. 이벤트 `data` 형식(전체 세션인지, 변경분인지) 필요.
- 푸시 payload: 만료 푸시를 거르려면(QA-21) `sessionId`, `stateVersion`, `spotVersion`이 들어 있어야 한다.
- 초대 링크(FAM-04 `inviteUrl`) 형식. 딥링크 스킴은 지금 `pickup://invite/{token}`으로 가정.
- `help-requests.type`, `incident.type`, `cancellation.reason` 값 목록.
- LINK-03 응답: 만료(410) · 없음(404) · 이미 연결(409)을 HTTP 코드로 주는지. 404는 실제로 확인했다.
- 텔레메트리 단위: Pleos 내비 `DrivingState.duration` / `distance` 단위를 초 · m로 가정. 에뮬레이터에서 확인 후 변환 필요.

## 실제 호출로 확인한 것 (2026.11.11 · 11.13 다시 확인, `scripts/swagger-smoke.py`)

2026.11.13 기준 Swagger API 62개(SPOT-04 · SET-11 추가)를 모두 불러 61개 정상 응답. 나머지 1개는 아래 표대로다. (11.11에 502였던 SET-01 학원 검색은 지금 정상) 전체 결과는 [api-smoke-result.md](api-smoke-result.md).

| API | 결과 | 확인할 것 |
|---|---|---|
| NOTI-03 알림 다시 보내기 | 429 RESEND_TOO_SOON | 규칙대로 거절 (마지막 발송 뒤 1분). 성공 경로는 1분 뒤에 다시 확인해야 함 |

Swagger와 실제 서버가 다른 점 (클라이언트에 반영 필요):

- **Idempotency-Key**: LINK-04(연결 승인)는 Swagger에 헤더가 없지만 서버는 요구한다 (없으면 422). 변경 요청에는 항상 넣는 게 안전하다
- **VIN**: AUTH-02 `vin`은 17자 영대문자·숫자, I·O·Q 불가 (Swagger에는 형식 없음)
- **전화번호**: FAM-02 `phone`은 국제 형식(+8210…)만 받는다
- **학원 입구 좌표**: SET-02/03 `academy.entrance`가 없으면 일정이 DRAFT로 남아 설정 완료(SET-08)와 세션 시작(SES-02)이 SETUP_INCOMPLETE로 막힌다. Swagger에는 선택 항목
- **준비 시간 연장**: SIG-03 `minutes`는 5 · 10 · 15만. 연장하면 그 시간 동안 합류 안내 가드가 막히고(CALL_GUARD_UNMET), 안내를 보낸 뒤에는 CALL_ALREADY_SENT로 거절
- **자녀 위치**: SIG-04는 합류 안내를 받은 뒤에만 (CHILD_NOT_CALLED)
- **결과 정정**: OUT-03 `reasonCode`는 WRONG_STOP_TIME · OTHER만
- **CALL-02 합류 안내 직접 보내기**는 보호자가 아니라 **차량 토큰** (보호자 토큰은 403)
- **SES-13 예외 열기**도 차량 토큰 (보호자 토큰은 403)
- **LINK-02** 연결 상태는 `pollAfterSeconds`보다 빨리 부르면 429
- **탑승 인식**: DOOR_CYCLE은 자녀가 합류 안내를 받은(MEETING) 뒤에만 탑승으로 잡힌다. 그 뒤 10초 안에만 SES-12 탑승 취소 가능
- **Cloudflare**: 기본 User-Agent가 없는 HTTP 클라이언트(파이썬 urllib 등)는 403(1010)으로 막힌다. 앱(OkHttp · RN fetch)은 해당 없음

2026.11.13 서버 변경 (클라이언트 영향 큼):

- **가드 G6 (정차)**: 합류 안내는 차량이 정차(SIG-02 STOPPED)한 뒤에만 나간다. 자동 발송 · CALL-02 모두 적용. 도착 3분 전(또는 700m)에는 대신 자녀에게 **실내 준비 알림**(PREPARE)을 보낸다. 차량 앱의 「도착 3분 전 합류 안내」 문구 · 흐름을 바꿔야 한다
- **SET-11 자녀 위치 사용** `PUT /v1/families/me/child-location {enabled}`: 기본 꺼짐. 꺼져 있으면 SIG-04가 403 LOCATION_CONSENT_REQUIRED. 보호자 설정 화면에 스위치가 필요하다
- **LINK-04** `platform`이 필수 (ANDROID · IOS)
- **SPOT-04 장소 추천** `GET /v1/pickup-spot-recommendations?academyId&origin=위도,경도[&arriveAt]`: 학원 근처 길가 정차(CURB_STOP) · 공영주차장 후보를 순위대로. 결과에 spotId가 없어서, 보호자가 고르면 SPOT-02로 저장해야 차량이 길안내 · 확정(SES-04)할 수 있다. `cautions`: ENFORCEMENT_CAMERA_NEAR(단속 카메라 근처), LINE_DATA_2021(데이터 기준 안내)
