# iLink - 모바일 앱

보호자·자녀용 휴대전화 앱입니다. 차량 앱은 [iLink-Vehicle](https://github.com/Hyundai-Motor-Competition/iLink-Vehicle)에 있습니다.

| 스플래시 | 메인 | 잠금화면 Live Activity | 다이나믹 아일랜드 |
|---|---|---|---|
| ![스플래시](docs/images/splash.png) | ![메인](docs/images/main.png) | ![잠금화면](docs/images/live_activity.png) | ![다이나믹 아일랜드](docs/images/dynamic_island.png) |

> iOS 시뮬레이터(iPhone 17 Pro)에서 찍은 화면입니다.

## 주요 기능

- **스플래시**: 어두운 바탕 · iLink 로고 · 문구 아래로 차가 달려와 깃발 앞에 서는 Lottie 애니메이션(`src/assets/lottie/ilink_splash.json`, 약 2.8초). 그동안 로그인 정보를 복원합니다
- **보호자**: 가족 프로필 등록(차량 QR · 인증 번호 → 연결 승인), 자녀 초대, 픽업 일정 등록, 메인(진행 중인 픽업 · 오늘의 픽업 타임라인), 현황, 기록
- **자녀**: 초대 수락, 픽업 진행 화면. 보호자가 출발하면 **iOS 잠금화면 · 다이나믹 아일랜드(Live Activity)** 에 남은 시간 · 도착 예정 · 진행 단계(차량 출발 → 곧 도착 → 탑승하기)를 보여 줍니다
- **푸시**: FCM(Android). 로그인하면 토큰을 서버에 등록(AUTH-03)하고, 푸시가 오면 최신 상태를 다시 받습니다
- 글꼴은 Pretendard(OFL)입니다

## 실행 방법

Node 22.11 이상이 필요합니다.

```bash
npm install
```

```bash
npm start
```

다른 터미널에서 실행합니다.

```bash
npm run android
```

iOS는 `cd ios && pod install` 후 `npm run ios`. (`LANG=en_US.UTF-8`이 필요합니다)

- iOS Live Activity는 위젯 확장 타깃 `ILinkLiveActivity`(iOS 16.2+)에 있습니다. 앱은 `ios/ILinkMobile/LiveActivityModule.swift`로 시작 · 갱신 · 종료합니다
- 서버 없이 Live Activity만 보려면 시뮬레이터에서 `xcrun simctl launch booted com.ilink.mobile -demoLiveActivity YES`
- iOS FCM은 `GoogleService-Info.plist`를 받은 뒤 켭니다. 지금은 `react-native.config.js`에서 iOS Firebase 모듈을 빼 두었습니다

## 스크립트

| 명령 | 내용 |
|---|---|
| `npm test` | 단위 테스트 |
| `npm run lint` | ESLint |
| `npm run typecheck` | 타입 검사 |
| `npm run api:types` | Swagger에서 `src/api/schema.d.ts` 다시 생성 |
| `python3 scripts/swagger-smoke.py --out docs/api-smoke-result.md` | Swagger API 65개를 개발 서버에 실제 흐름대로 불러 보고 결과 표 저장 (해제된 멤버 · 자녀 오류처럼 일부러 내는 오류도 확인, 테스트 계정은 끝에 정리) |

API 서버 주소는 `src/config/env.ts`에 있습니다.

## 문서

- [docs/design.md](docs/design.md) 구조와 흐름
- [docs/api-gap.md](docs/api-gap.md) 기획서와 서버 API 차이, 실제 호출로 확인한 차이
- [docs/api-smoke-result.md](docs/api-smoke-result.md) Swagger API 점검 결과
