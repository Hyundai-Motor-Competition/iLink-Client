# 시연 영상 찍는 방법

차량 · 자녀 · 부모 세 앱이 **실제 개발 서버**로 주고받는 모습을 처음(차량 연결)부터 끝(탑승 완료)까지 한 번 돌려 찍는다.
세 화면은 기기마다 따로 녹화하고, 마지막에 한 영상으로 합친다.

```
┌───────────── 단계 자막 (주황 띠) ─────────────┐
│                                   ┌──────┐ ┌──────┐ │
│   ┌─────────────────────────┐     │ 자녀 │ │ 부모 │ │
│   │   차량 디스플레이        │     │      │ │      │ │
│   │   (Pleos Connect)       │     │Android│ │ iOS  │ │
│   └─────────────────────────┘     └──────┘ └──────┘ │
└──────────────────────────────── 1920x1080 ─────────┘
```

- 화면마다 `step.sh "자막"`을 실행하면 자막이 남고 **6초** 동안 그 화면을 그대로 둔다 (설명할 시간). 더 길게: `HOLD=10 scripts/demo/step.sh "…"`
- 결과: `scripts/demo/compose.sh` → 바탕화면의 `iLink-demo-MMDD-HHMM.mp4` (자막 · 기기 이름표 포함)

## 컴퓨터 나누기

에뮬레이터 2개 + 시뮬레이터 1개를 노트북 한 대에서 돌리면 무겁다. iOS 시뮬레이터는 Mac에서만 돌아가므로 이렇게 나눈다.

| 컴퓨터 | 기기 | 녹화 파일 |
|---|---|---|
| **Mac** | 부모 · iOS 시뮬레이터 (iPhone 17 Pro) | `demo-rec/parent.mov` |
| **Windows PC** | 차량 · Pleos Connect 에뮬레이터, 자녀 · Android 폰 에뮬레이터 | `demo-rec/car-000.webm`, `demo-rec/child-000.webm` |

세 앱은 같은 개발 서버로 주고받으므로 기기가 서로 다른 컴퓨터에 있어도 연동은 같다.
컴퓨터를 오가는 단계는 두 곳뿐이다: 차량 QR(Windows → Mac), 자녀 초대 링크(Mac → Windows). 각각 명령 한 줄을 옮겨 실행한다.

> Mac 한 대로 모두 찍을 때는 맨 아래 「Mac 한 대로 찍기」를 본다.

명령은 모두 `ilink-mobile` 폴더에서 실행한다. Windows는 **Git Bash**에서 실행한다 (PowerShell 아님).

## 준비 (한 번)

### Mac

1. Xcode, Homebrew. `brew install ffmpeg`
2. 부모 iOS 앱 빌드 (10분 안팎):
   ```bash
   scripts/demo/up.sh --ios --build
   ```
3. Windows로 보낼 Android 앱 두 개 모으기 → `demo-apk/` 폴더를 통째로 Windows로 옮긴다 (USB · 클라우드 드라이브 등):
   ```bash
   scripts/demo/pack-apk.sh
   ```
   (`ilink-vehicle`도 같은 폴더에 받아 `./gradlew assembleDebug`, `ilink-mobile/android`에서 `./gradlew assembleRelease`를 해 둔 상태여야 한다)

### Windows PC

1. 설치
   - [Git for Windows](https://git-scm.com/download/win) (Git Bash 포함)
   - Android Studio (Android SDK · Android Emulator 35 이상 · Platform-Tools). BIOS 가상화와 Windows 기능 'Windows 하이퍼바이저 플랫폼'을 켠다.
     화면 녹화는 에뮬레이터 자체 기능을 쓰므로 따로 설치할 것이 없다.
   - Python 3 ([python.org](https://www.python.org/downloads/), 설치할 때 'Add python.exe to PATH' 체크)
2. 저장소 받기 — `ilink-mobile`을 받고, Mac에서 만든 `demo-apk/` 폴더를 `ilink-mobile/demo-apk/`에 넣는다.
   ```bash
   git clone https://github.com/Hyundai-Motor-Competition/iLink-Client.git ilink-mobile
   ```
3. Pleos Connect 이미지 (x86_64): Android Studio > Settings > Languages & Frameworks > Android SDK > **SDK Update Sites**에
   `https://nexus-playground.pleos.ai/repository/raw-releases/connect-avd/2.x/crp-sys-img.xml` 를 추가하고,
   SDK Platforms 탭의 'Show Package Details'에서 **Pleos Connect System Image (API 34)** 를 설치한다.
   AVD(`ilink_pleos`, RAM 4GB)는 `up.sh`가 만든다.
4. Android 폰 AVD: Android Studio > Device Manager > **+** > Pixel 7 > **API 34 'Google APIs' x86_64** 이미지로 만든다
   (Google APIs 이미지여야 FCM 푸시가 온다). 만든 AVD 이름을 확인한다 (예: `Pixel_7_API_34`):
   ```bash
   "$LOCALAPPDATA/Android/Sdk/emulator/emulator" -list-avds
   ```
5. 시계 맞추기: 설정 > 시간 및 언어 > 날짜 및 시간 > **지금 동기화**. Mac도 '날짜와 시간 자동 설정'이 켜져 있어야 한다.
   (두 컴퓨터의 녹화를 시각으로 맞춘다)

## 찍기

### 0. 기기 켜기

Mac:
```bash
scripts/demo/up.sh --ios
```
Windows (AVD 이름은 위 4에서 확인한 것):
```bash
PHONE_AVD=Pixel_7_API_34 scripts/demo/up.sh --android
```
- 앱 데이터를 지우고 첫 화면에서 시작한다 (새 차량 · 새 가족). 처음 부팅은 몇 분 걸린다.
- Windows에서 같은 셸을 계속 쓸 거면 `export PHONE_AVD=Pixel_7_API_34` 를 먼저 해 두면 편하다.
- 화면 조작: 부모는 Mac의 Simulator 창을 마우스로, 차량 · 자녀는 Windows의 에뮬레이터 창을 마우스로 누른다.
- 한글 입력: 시뮬레이터 · 에뮬레이터에 맥 · PC 키보드로 직접 입력한다.

### 1. 녹화 시작 (두 컴퓨터 모두)

```bash
scripts/demo/rec.sh start
```
Mac은 `parent`, Windows는 `car` · `child` 녹화가 시작된다. 두 컴퓨터에서 몇 초 차이로 시작해도 된다 (나중에 시각으로 맞춘다).

### 2. 장면별 진행

`step.sh`는 **어느 컴퓨터에서 실행해도 된다**. 자막을 남기고 6초 기다린다. 자막을 실행한 뒤 그 화면을 설명하고, 다음 조작으로 넘어간다.
`[Mac]` · `[Win]` 은 명령을 실행할 컴퓨터, `[부모]` · `[차량]` · `[자녀]` 는 누를 화면이다.

| # | 조작 | 자막 (`scripts/demo/step.sh "…"`) |
|---|---|---|
| 1 | (세 화면 첫 화면) | `HOLD=8` "iLink — 차량 · 자녀 · 부모 앱이 실제 서버로 함께 움직여요" |
| 2 | [차량] 연결 QR 화면 | "차량 화면에 연결용 QR 코드가 떠요" |
| 3 | [부모] 시작하기 → 부모 → 차량 연결하기 → QR 코드로 등록할래요 | "부모 앱에서 차량 QR을 찍어 연결해요" |
| 4 | [Win] `scripts/demo/link.sh` → 나온 줄을 [Mac]에서 실행: `scripts/demo/link.sh 'pickup://link?code=…'` | "QR을 찍으면 차량 정보가 바로 떠요" |
| 5 | [부모] 맞아요 → 약관 동의 | "약관에 동의하고 가족 프로필을 만들어요" |
| 6 | [부모] 보호자 이름(엄마) → 자녀 이름(민지) → 초대장 화면 | "보호자와 자녀 프로필을 등록해요" |
| 7 | [차량] 보호자 이름으로 바뀐 대기 화면 | "차량 화면도 연결된 가족으로 바뀌어요" |
| 8 | [부모] 초대장(편지지)을 **눌러** 링크 복사 → [Mac] `scripts/demo/invite.sh` → 나온 줄을 [Win]에서 실행: `scripts/demo/invite.sh 토큰` | "자녀에게 초대장을 보내요" |
| 9 | [자녀] 초대 화면 | "자녀 폰에 초대장이 도착해요" |
| 10 | [자녀] 연결하기 → '연결이 완료되었어요!' | "연결하기 한 번으로 가족과 연결돼요" |
| 11 | [자녀] 확인 · [부모] 편지지를 **길게 눌러** '초대장을 전송했어요' | "자녀는 건물 안 대기 화면으로 바뀌어요" |
| 12 | [부모] 픽업 일정 등록하기 → 학원 검색(예: 여의도) → 맞아요 → 만날 곳 | "학원과 만날 곳을 고르면 픽업 일정이 만들어져요" |
| 13 | [부모] 시간(**지금부터 1~2시간 뒤**) · **오늘 요일 포함** → 이대로 등록 | "픽업 요일과 시간을 정해 등록해요" |
| 14 | (기다림: 자녀는 20초, 차량은 30초 안에 반영) | `HOLD=30` "등록한 일정이 자녀 · 차량 화면에 나타나요" |
| 15 | [차량] 픽업 시작하기 | "차량에서 오늘 픽업을 시작해요" |
| 16 | [차량] 여기로 출발하기 (한 번만 누른다) | `HOLD=8` "출발하면 자녀에게 푸시, 부모에게 알림이 가요" |
| 17 | [부모] '실시간 현황 허용'이 뜨면 허용 · [자녀] '…님이 출발했어요' · 도착 예정 시간 | "자녀 화면에 출발 소식과 도착 예정 시간이 보여요" |
| 18 | [Win] `DRIVE_SECONDS=50 scripts/demo/drive.sh --to-stop &` (차가 50초 동안 만나는 곳으로 이동) | `HOLD=10` "차가 만나는 곳으로 가는 중이에요" |
| 19 | (주행 중) 곧 도착 알림 | `HOLD=10` "도착이 가까워지면 자녀에게 나갈 준비 알림이 가요" |
| 20 | (주행 중) [자녀] 준비 시간이 더 필요해요 → 5분 추가하기 (선택) | "자녀가 준비 시간을 늘리면 차량 · 부모에 반영돼요" |
| 21 | 정차 (drive.sh가 기어 P로 바꾼다) | `HOLD=8` "도착해 정차하면 서버가 자녀에게 합류 안내를 보내요" |
| 22 | [자녀] 지도 화면(차 위치 · 내 위치 · 만나는 곳) | `HOLD=8` "자녀 화면: 지도로 차가 있는 곳까지 안내해요" |
| 23 | [부모] 알림 배너: 도착 · 합류 안내 · 합류 안내 확인 | "부모에게도 단계마다 알림이 와요" |
| 24 | [부모] 잠금 (Simulator 메뉴 Device > Lock, ⌘L) → 잠금화면 실시간 현황 → 다시 열기 | `HOLD=8` "부모 잠금화면에서 실시간으로 픽업 상황을 봐요" |
| 25 | [Win] `BOARD_WAIT=1 scripts/demo/board.sh` (뒷문 열고 닫기) | `HOLD=8` "아이가 뒷문을 열고 타면 차가 탑승을 인식해요" |
| 26 | 10초쯤 뒤 탑승 완료 — [차량] 탑승 완료 · [자녀] 안전하게 탑승했어요! · [부모] 탑승 완료 알림 | `HOLD=8` "탑승 완료: 세 화면이 함께 완료로 바뀌어요" |
| 27 | (자녀 · 차량은 8초 뒤 대기 화면으로 돌아간다) | "iLink 시연을 마칩니다" |

- 20번은 빼도 된다. 넣을 거면 정차 전에 한다.
- 16번 '여기로 출발하기'는 한 번만 누른다 (출발 직후 1.5초 동안은 '합류 안내 보류' 버튼이 눌리지 않게 막아 두었다).
- 어긋나면 그 장면만 다시 하지 말고, 녹화를 끝내고 0번부터 다시 한다 (서버 상태가 이어져 있어서).

### 3. 녹화 끝 (두 컴퓨터 모두)

```bash
scripts/demo/rec.sh stop
```

### 4. 합치기 (Mac)

Windows의 `ilink-mobile/demo-rec/` 에서 이 파일들을 Mac의 `ilink-mobile/demo-rec/` 로 옮긴다.
`car-*.webm`, `car-*.webm.start`, `car-*.webm.end`, `child-*` 같은 이름의 파일 모두, `marks.txt` (→ Mac 쪽 `marks.txt`와 겹치므로 **`marks-win.txt`** 로 이름을 바꿔 넣는다).

```bash
scripts/demo/compose.sh
```
→ 바탕화면에 `iLink-demo-MMDD-HHMM.mp4` (1920x1080, 30fps). 파일 이름을 주면 그 이름으로 저장한다: `scripts/demo/compose.sh ~/Desktop/iLink.mp4`

### 5. 끄기

```bash
scripts/demo/down.sh
```
(두 컴퓨터에서 각각. 개발 서버에 남은 테스트 가족은 다음 시연에 영향이 없다: `up.sh`가 새 차량 · 새 가족으로 시작한다)

## Mac 한 대로 찍기

메모리 16GB 이상, 다른 앱을 닫고 한다.

```bash
scripts/demo/up.sh            # 세 기기 모두 (앱 빌드까지: --build)
scripts/demo/rec.sh start
```
진행은 위 표와 같고, 4번과 8번만 인자 없이 한 번에 된다: `scripts/demo/link.sh`, `scripts/demo/invite.sh`.
끝나면 `scripts/demo/rec.sh stop` → `scripts/demo/compose.sh`.

## 스크립트

| 스크립트 | 하는 일 |
|---|---|
| `up.sh [--android\|--ios] [--build]` | 기기를 켜고 앱을 새로 설치해 첫 화면에 둔다 |
| `rec.sh start\|stop` | 이 컴퓨터에 켜진 기기를 따로 녹화 (Android: 에뮬레이터 자체 녹화, iOS: simctl). 시각을 함께 적는다 |
| `step.sh "자막"` | 자막 시각을 남기고 `HOLD`초(기본 6) 기다린다 |
| `link.sh [QR]` | 차량 QR 내용을 부모 iPhone에서 연다 (카메라 대신) |
| `invite.sh [토큰]` | 부모가 복사한 초대 링크를 자녀 폰에서 연다 |
| `drive.sh [--to-stop]` | 차를 만나는 곳까지 움직이고 정차(P), 이어서 탑승(board.sh) |
| `board.sh` | 뒷문 열고 닫기 → 탑승 인식 |
| `compose.sh [결과.mp4]` | 세 녹화 + 자막 → 한 영상 (Mac) |
| `pack-apk.sh` | Windows로 보낼 Android 앱 두 개를 `demo-apk/`에 모은다 (Mac) |
| `down.sh` | 기기 끄기 |

## 참고

- 차량 에뮬레이터에는 실제 주행이 없고 Pleos 에뮬레이터는 차량 신호(VHAL) 주입을 막아 두어서, 차량 앱 debug 빌드는
  시연 신호 입력(`SimInput`)으로 위치 · 기어 · 주행 여부 · 문 신호를 받는다. 길안내도 Pleos 내비 대신 흉내 낸다.
  그 뒤는 실제 차와 같다: 앱이 서버로 텔레메트리 · 정차 · 문 이벤트를 보내고, 합류 안내 · 탑승 판정은 서버가 한다.
- iOS 원격 푸시는 Firebase iOS 설정(`GoogleService-Info.plist`)과 APNs 키를 받은 뒤 켠다. 그 전까지 부모 iPhone 알림은
  앱이 세션 진행 이벤트를 3초마다 확인해 띄운다. 자녀(Android)는 FCM 푸시가 바로 온다.

## 문제 해결

| 증상 | 해결 |
|---|---|
| `up.sh --android`: Pleos 이미지가 없다 | 준비 3을 다시. SDK 폴더에 `system-images/android-34/pleos_car_emulator/x86_64/`가 있어야 한다 |
| 에뮬레이터가 안 켜지거나 아주 느리다 (Windows) | 'Windows 하이퍼바이저 플랫폼' 켜고 재부팅. Android Studio > SDK Tools의 'Android Emulator hypervisor driver' 설치 |
| 합칠 때 '녹화가 …초에서 끊겼어요' | 에뮬레이터가 오래된 버전이라 3분에서 녹화를 끊었다. Android Studio > SDK Tools에서 Android Emulator를 최신으로 올린다 (또는 `REC_SEG=170 scripts/demo/rec.sh start`로 3분 조각으로 녹화. 조각 사이 2~3초는 멈춘 화면이 된다) |
| `python` 실행 시 Microsoft Store가 열린다 | 설정 > 앱 > 고급 앱 설정 > 앱 실행 별칭에서 python 별칭을 끄고, python.org 버전을 설치 |
| 차량이 '인터넷 연결을 확인'이라고 한다 | 에뮬레이터를 끄고(`down.sh`) `up.sh`로 다시 켠다 (DNS 옵션을 붙여 켠다) |
| 자녀 폰에 푸시가 안 온다 | 폰 AVD가 'Google APIs' 이미지인지 확인. 화면 전환은 푸시 없이도 된다 |
| 합친 영상에서 두 컴퓨터 화면이 몇 초 어긋난다 | 두 컴퓨터 시계를 인터넷 시간과 다시 맞춘다 |
