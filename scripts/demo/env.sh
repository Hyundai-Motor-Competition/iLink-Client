# 시연 스크립트 공통 값 (source 해서 쓴다)
SDK="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
ADB="$SDK/platform-tools/adb"
EMU="$SDK/emulator/emulator"
MOBILE="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VEHICLE="${ILINK_VEHICLE:-$MOBILE/../ilink-vehicle}"
# 왼쪽: 차량(Pleos Connect) · 가운데: 부모(iOS) · 오른쪽: 자녀(Android 폰)
PLEOS_AVD=ilink_pleos
PLEOS=emulator-5554
PHONE_AVD="${PHONE_AVD:-mymemory_test}"
PHONE=emulator-5556
IOS_DEVICE="${IOS_DEVICE:-iPhone 17 Pro}"
VEHICLE_PKG=com.ilink.vehicle
MOBILE_PKG=com.ilink.mobile
pleos() { "$ADB" -s "$PLEOS" "$@"; }
# 차량 앱 시연 신호 (debug 빌드의 SimInput). 예: sim --es gear D --ez driving true
sim() { pleos shell am broadcast -p "$VEHICLE_PKG" -a com.ilink.vehicle.SIM "$@" > /dev/null; }
phone() { "$ADB" -s "$PHONE" "$@"; }
booted() { [ "$("$ADB" -s "$1" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = 1 ]; }
wait_boot() { "$ADB" -s "$1" wait-for-device; until booted "$1"; do sleep 2; done; }
ios_udid() { xcrun simctl list devices available | grep -F "$IOS_DEVICE (" | head -1 | grep -oE '[0-9A-F-]{36}'; }
