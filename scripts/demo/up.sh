#!/usr/bin/env bash
# 시연 준비: 차량(Pleos) · 부모(iOS) · 자녀(Android) 세 화면을 띄우고 앱을 새로 설치해 첫 화면에 둔다.
#   scripts/demo/up.sh            빌드부터 (처음 · 코드가 바뀌었을 때)
#   scripts/demo/up.sh --no-build 이미 빌드한 앱으로 바로
# 실제 개발 서버(ilink-api-dev)에 연결된다. 테스트 데이터는 시연 후 앱의 '연결 해제'로 정리한다.
set -euo pipefail
source "$(dirname "$0")/env.sh"
BUILD=yes; [ "${1:-}" = --no-build ] && BUILD=no

echo "1) 에뮬레이터 켜기 (창으로)"
if ! booted "$PLEOS"; then
  "$EMU" -avd "$PLEOS_AVD" -port 5554 -no-audio -no-boot-anim -timezone Asia/Seoul -dns-server 8.8.8.8,1.1.1.1 > /tmp/ilink-demo-pleos.log 2>&1 &
fi
if ! booted "$PHONE"; then
  "$EMU" -avd "$PHONE_AVD" -port 5556 -no-audio -no-boot-anim -no-snapshot-save -timezone Asia/Seoul -dns-server 8.8.8.8,1.1.1.1 > /tmp/ilink-demo-phone.log 2>&1 &
fi
UDID=$(ios_udid)
xcrun simctl boot "$UDID" 2>/dev/null || true
open -a Simulator --args -CurrentDeviceUDID "$UDID"

if [ "$BUILD" = yes ]; then
  echo "2) 빌드 (차량 실제 빌드 · 자녀 Android Release · 부모 iOS Release)"
  (cd "$VEHICLE" && ./gradlew -q assembleDebug)
  (cd "$MOBILE/android" && ./gradlew -q assembleRelease)
  (cd "$MOBILE" && xcodebuild -workspace ios/ILinkMobile.xcworkspace -scheme ILinkMobile -configuration Release \
     -sdk iphonesimulator -derivedDataPath ios/build/dd CODE_SIGNING_ALLOWED=NO ARCHS=arm64 ONLY_ACTIVE_ARCH=YES -quiet build)
fi

echo "3) 설치"
wait_boot "$PLEOS"; wait_boot "$PHONE"
pleos install -r "$VEHICLE/app/build/outputs/apk/debug/app-debug.apk" > /dev/null
phone install -r "$MOBILE/android/app/build/outputs/apk/release/app-release.apk" > /dev/null
xcrun simctl bootstatus "$UDID" -b > /dev/null
xcrun simctl install "$UDID" "$MOBILE/ios/build/dd/Build/Products/Release-iphonesimulator/ILinkMobile.app"

echo "4) 처음 상태로 (앱 데이터 지우기 · 권한 · 위치)"
pleos shell pm clear --user current "$VEHICLE_PKG" > /dev/null || true
for p in ACCESS_FINE_LOCATION ACCESS_COARSE_LOCATION; do pleos shell pm grant --user current "$VEHICLE_PKG" android.permission.$p || true; done
phone shell pm clear "$MOBILE_PKG" > /dev/null || true
for p in POST_NOTIFICATIONS ACCESS_FINE_LOCATION ACCESS_COARSE_LOCATION; do phone shell pm grant "$MOBILE_PKG" android.permission.$p || true; done
xcrun simctl privacy "$UDID" grant notifications "$MOBILE_PKG" 2>/dev/null || true
xcrun simctl status_bar "$UDID" override --time 9:41 --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3 || true

echo "5) 앱 실행"
pleos shell pm uninstall com.ilink.vehicle.demo > /dev/null 2>&1 || true   # 예전 데모 빌드가 있으면 지운다
pleos shell am start --user current -n "$VEHICLE_PKG/com.ilink.vehicle.MainActivity" > /dev/null
sleep 3
sim --es gear P --ez driving false   # 차는 주차(P) · 정지 상태로 시작
phone shell am start -n "$MOBILE_PKG/.MainActivity" > /dev/null
xcrun simctl terminate "$UDID" "$MOBILE_PKG" 2>/dev/null || true
xcrun simctl launch "$UDID" "$MOBILE_PKG" > /dev/null

"$(dirname "$0")/arrange.sh" || echo "   창 배치는 직접 해 주세요 (왼쪽 차량 · 가운데 부모 · 오른쪽 자녀)"
cat <<MSG

준비됐어요. 시연 순서는 docs/demo.md 를 보세요.
  초대 링크를 자녀 폰에서 열기:  scripts/demo/invite.sh
  차 움직이기(출발→도착→문 열고 닫기): scripts/demo/drive.sh
  녹화: scripts/demo/record.sh   끄기: scripts/demo/down.sh
MSG
