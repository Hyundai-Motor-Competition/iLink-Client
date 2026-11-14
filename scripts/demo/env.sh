# 시연 스크립트 공통 값 (source 해서 쓴다). macOS 터미널 · Windows Git Bash 둘 다에서 쓴다.
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*) OS=windows ;;
  Darwin) OS=mac ;;
  *) OS=linux ;;
esac
if [ "$OS" = windows ]; then
  SDK="${ANDROID_HOME:-${LOCALAPPDATA:-$HOME/AppData/Local}/Android/Sdk}"
  SDK="$(cygpath -u "$SDK" 2>/dev/null || echo "$SDK")"
else
  SDK="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
fi
ADB="$SDK/platform-tools/adb"
EMU="$SDK/emulator/emulator"
MOBILE="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VEHICLE="${ILINK_VEHICLE:-$MOBILE/../ilink-vehicle}"
# 녹화 파일 · 자막 시각을 모으는 폴더 (git에 올리지 않는다)
REC="${DEMO_REC:-$MOBILE/demo-rec}"
# 차량(Pleos Connect) · 자녀(Android 폰) · 부모(iOS)
PLEOS_AVD=ilink_pleos
PLEOS=emulator-5554
PHONE_AVD="${PHONE_AVD:-mymemory_test}"
PHONE=emulator-5556
IOS_DEVICE="${IOS_DEVICE:-iPhone 17 Pro}"
VEHICLE_PKG=com.ilink.vehicle
MOBILE_PKG=com.ilink.mobile
# 앱 파일: 직접 빌드했으면 빌드 폴더, 아니면 demo-apk/ 에 받아 둔 파일
VEHICLE_APK="$VEHICLE/app/build/outputs/apk/debug/app-debug.apk"
[ -f "$VEHICLE_APK" ] || VEHICLE_APK="$MOBILE/demo-apk/ilink-vehicle.apk"
CHILD_APK="$MOBILE/android/app/build/outputs/apk/release/app-release.apk"
[ -f "$CHILD_APK" ] || CHILD_APK="$MOBILE/demo-apk/ilink-child.apk"
PY=$(command -v python3 || command -v python || echo python3)
pleos() { "$ADB" -s "$PLEOS" "$@"; }
# 차량 앱 시연 신호 (debug 빌드의 SimInput). 예: sim --es gear D --ez driving true
sim() { pleos shell am broadcast -p "$VEHICLE_PKG" -a com.ilink.vehicle.SIM "$@" > /dev/null; }
phone() { "$ADB" -s "$PHONE" "$@"; }
booted() { [ "$("$ADB" -s "$1" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = 1 ]; }
wait_boot() { "$ADB" -s "$1" wait-for-device; until booted "$1"; do sleep 2; done; }
has_dev() { "$ADB" devices 2>/dev/null | grep -q "^$1[[:space:]]*device"; }
ios_udid() { xcrun simctl list devices available | grep -F "$IOS_DEVICE (" | head -1 | grep -oE '[0-9A-F-]{36}'; }
has_ios() { command -v xcrun > /dev/null 2>&1; }
py() { "$PY" -c "$1" | tr -d '\r'; }
now() { py 'import time; print(f"{time.time():.2f}")'; }
# 에뮬레이터 · adb에 넘기는 경로 (Windows는 C:/... 형태)
native() { if [ "$OS" = windows ]; then cygpath -m "$1"; else echo "$1"; fi; }
