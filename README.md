# iLink - 모바일 앱

보호자·자녀용 휴대전화 앱입니다. 차량 앱은 [ilink-vehicle](../ilink-vehicle)에 있습니다.

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

iOS는 `cd ios && bundle install && bundle exec pod install` 후 `npm run ios`.

## 스크립트

| 명령 | 내용 |
|---|---|
| `npm test` | 단위 테스트 |
| `npm run lint` | ESLint |
| `npm run typecheck` | 타입 검사 |
| `npm run api:types` | Swagger에서 `src/api/schema.d.ts` 다시 생성 |
| `python3 scripts/swagger-smoke.py --out docs/api-smoke-result.md` | Swagger API 60개를 개발 서버에 차례로 불러 보고 결과 표 저장 (테스트 계정을 만들고 끝에 정리) |

API 서버 주소는 `src/config/env.ts`에 있습니다.

## 문서

- [docs/design.md](docs/design.md) 구조와 흐름
- [docs/api-gap.md](docs/api-gap.md) 기획서와 서버 API 차이, 실제 호출로 확인한 차이
- [docs/api-smoke-result.md](docs/api-smoke-result.md) Swagger API 점검 결과
