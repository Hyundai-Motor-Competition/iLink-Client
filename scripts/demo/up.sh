#!/usr/bin/env bash
# 시연 준비: 기기를 켜고 앱을 새로 설치해 첫 화면에 둔다. 실제 개발 서버(ilink-api-dev)에 연결된다.
#   scripts/demo/up.sh                 이 컴퓨터에서 세 기기 모두 (Mac)
#   scripts/demo/up.sh --android       차량(Pleos) · 자녀(Android 폰)만 (Windows PC, 또는 Mac)
#   scripts/demo/up.sh --ios           부모(iOS 시뮬레이터)만 (Mac)
#   --build 를 붙이면 앱을 새로 빌드한 뒤 설치한다 (기본은 이미 있는 앱 파일)
set -euo pipefail
source "$(dirname "$0")/env.sh"
BUILD=no; ANDROID=yes; IOS=yes
[ "$OS" = mac ] || IOS=no
for a in "$@"; do
  case "$a" in
    --build) BUILD=yes ;;
    --no-build) BUILD=no ;;
    --android) IOS=no ;;
    --ios) ANDROID=no ;;
  esac
done

# Pleos AVD가 없으면 만든다 (Apple Silicon arm64, Windows · Intel x86_64 이미지)
make_pleos_avd() {
  local abi; abi=$( [ "$(uname -m)" = arm64 ] && echo arm64-v8a || echo x86_64 )
  local image="system-images/android-34/pleos_car_emulator/$abi/"
  local home="${ANDROID_AVD_HOME:-$HOME/.android/avd}"
  [ -f "$home/$PLEOS_AVD.ini" ] && return 0
  if [ ! -d "$SDK/$image" ]; then
    echo "Pleos Connect 이미지($abi)가 없어요. docs/demo.md 의 '준비'대로 SDK Manager에서 설치하세요."; exit 1
  fi
  mkdir -p "$home/$PLEOS_AVD.avd"
  printf 'avd.ini.encoding=UTF-8\npath=%s\npath.rel=avd/%s.avd\ntarget=android-34\n' "$(native "$home/$PLEOS_AVD.avd")" "$PLEOS_AVD" > "$home/$PLEOS_AVD.ini"
  cat > "$home/$PLEOS_AVD.avd/config.ini" <<CFG
avd.ini.encoding=UTF-8
AvdId=$PLEOS_AVD
avd.ini.displayname=Pleos Connect (iLink)
abi.type=$abi
hw.cpu.arch=$( [ "$abi" = x86_64 ] && echo x86_64 || echo arm64 )
hw.cpu.ncore=4
image.sysdir.1=$image
tag.id=android-automotive
hw.device.name=Pleos_Connect_v2_0
hw.device.manufacturer=42dot
hw.lcd.width=2560
hw.lcd.height=1440
hw.lcd.density=160
hw.ramSize=4096
vm.heapSize=512
disk.dataPartition.size=6G
hw.keyboard=yes
hw.gpu.enabled=yes
hw.gpu.mode=host
hw.audioInput=no
hw.audioOutput=no
CFG
  echo "   AVD $PLEOS_AVD 를 만들었어요 (RAM 4GB)."
}

echo "1) 기기 켜기"
LOG="${TMPDIR:-/tmp}"
if [ "$ANDROID" = yes ]; then
  make_pleos_avd
  if ! has_dev "$PLEOS"; then
    "$EMU" -avd "$PLEOS_AVD" -port 5554 -no-audio -no-boot-anim -timezone Asia/Seoul -dns-server 8.8.8.8,1.1.1.1 > "$LOG/ilink-demo-pleos.log" 2>&1 &
  fi
  if ! has_dev "$PHONE"; then
    if ! "$EMU" -list-avds | tr -d '\r' | grep -qx "$PHONE_AVD"; then
      echo "Android 폰 AVD '$PHONE_AVD' 가 없어요. 'PHONE_AVD=이름 scripts/demo/up.sh --android' 처럼 AVD 이름을 알려 주세요."
      echo "   지금 있는 AVD: $("$EMU" -list-avds | tr '\r\n' '  ')"; exit 1
    fi
    "$EMU" -avd "$PHONE_AVD" -port 5556 -no-audio -no-boot-anim -no-snapshot-save -timezone Asia/Seoul -dns-server 8.8.8.8,1.1.1.1 > "$LOG/ilink-demo-phone.log" 2>&1 &
  fi
fi
if [ "$IOS" = yes ]; then
  UDID=$(ios_udid)
  xcrun simctl boot "$UDID" 2>/dev/null || true
  open -a Simulator --args -CurrentDeviceUDID "$UDID"
fi

if [ "$BUILD" = yes ]; then
  echo "2) 빌드"
  if [ "$ANDROID" = yes ]; then
    (cd "$VEHICLE" && ./gradlew -q assembleDebug)
    (cd "$MOBILE/android" && ./gradlew -q assembleRelease)
    VEHICLE_APK="$VEHICLE/app/build/outputs/apk/debug/app-debug.apk"
    CHILD_APK="$MOBILE/android/app/build/outputs/apk/release/app-release.apk"
  fi
  if [ "$IOS" = yes ]; then
    (cd "$MOBILE" && xcodebuild -workspace ios/ILinkMobile.xcworkspace -scheme ILinkMobile -configuration Release \
       -sdk iphonesimulator -derivedDataPath ios/build/dd CODE_SIGNING_ALLOWED=NO ARCHS=arm64 ONLY_ACTIVE_ARCH=YES -quiet build)
  fi
fi

echo "3) 설치 · 처음 상태로 (앱 데이터 지우기 · 권한)"
if [ "$ANDROID" = yes ]; then
  for f in "$VEHICLE_APK" "$CHILD_APK"; do
    [ -f "$f" ] || { echo "앱 파일이 없어요: $f  (docs/demo.md '준비' 참고)"; exit 1; }
  done
  echo "   기기 부팅을 기다리는 중... (처음은 몇 분 걸려요)"
  wait_boot "$PLEOS"; wait_boot "$PHONE"
  pleos install -r "$(native "$VEHICLE_APK")" > /dev/null
  phone install -r "$(native "$CHILD_APK")" > /dev/null
  pleos shell pm uninstall com.ilink.vehicle.demo > /dev/null 2>&1 || true   # 예전 데모 빌드가 있으면 지운다
  pleos shell pm clear --user current "$VEHICLE_PKG" > /dev/null || true
  for p in ACCESS_FINE_LOCATION ACCESS_COARSE_LOCATION; do pleos shell pm grant --user current "$VEHICLE_PKG" android.permission.$p || true; done
  phone shell pm clear "$MOBILE_PKG" > /dev/null || true
  for p in POST_NOTIFICATIONS ACCESS_FINE_LOCATION ACCESS_COARSE_LOCATION; do phone shell pm grant "$MOBILE_PKG" android.permission.$p || true; done
  # 상태 표시줄 시각을 9:41로 고정 (시연 화면 정리)
  phone shell settings put global sysui_demo_allowed 1 > /dev/null 2>&1 || true
  phone shell am broadcast -a com.android.systemui.demo -e command enter > /dev/null 2>&1 || true
  phone shell am broadcast -a com.android.systemui.demo -e command clock -e hhmm 0941 > /dev/null 2>&1 || true
fi
if [ "$IOS" = yes ]; then
  xcrun simctl bootstatus "$UDID" -b > /dev/null
  # 이전 시연의 로그인 · 가족 정보를 지우고 처음 화면에서 시작한다
  xcrun simctl uninstall "$UDID" "$MOBILE_PKG" 2>/dev/null || true
  xcrun simctl keychain "$UDID" reset 2>/dev/null || true
  xcrun simctl install "$UDID" "$MOBILE/ios/build/dd/Build/Products/Release-iphonesimulator/ILinkMobile.app"
  xcrun simctl privacy "$UDID" grant notifications "$MOBILE_PKG" 2>/dev/null || true
  xcrun simctl status_bar "$UDID" override --time 9:41 --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3 || true
fi

echo "4) 앱 실행"
if [ "$ANDROID" = yes ]; then
  pleos shell am start --user current -n "$VEHICLE_PKG/com.ilink.vehicle.MainActivity" > /dev/null
  sleep 3
  sim --es gear P --ez driving false   # 차는 주차(P) · 정지 상태로 시작
  phone shell am start -n "$MOBILE_PKG/.MainActivity" > /dev/null
fi
if [ "$IOS" = yes ]; then
  xcrun simctl terminate "$UDID" "$MOBILE_PKG" 2>/dev/null || true
  xcrun simctl launch "$UDID" "$MOBILE_PKG" > /dev/null
fi
if [ "$OS" = mac ] && [ "$ANDROID" = yes ] && [ "$IOS" = yes ]; then
  "$(dirname "$0")/arrange.sh" || echo "   창 배치는 직접 해 주세요"
fi
echo
echo "준비됐어요. 시연 순서는 docs/demo.md 를 보세요."
