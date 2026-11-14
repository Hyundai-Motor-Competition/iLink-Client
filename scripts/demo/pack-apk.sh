#!/usr/bin/env bash
# (Mac) 시연용 Android 앱 두 개를 demo-apk/ 에 모은다. 이 폴더를 Windows PC의 ilink-mobile/demo-apk/ 로 옮기면
# Windows에서 빌드 없이 up.sh --android 로 설치할 수 있다. (두 앱 모두 x86_64 를 포함한다)
set -euo pipefail
source "$(dirname "$0")/env.sh"
mkdir -p "$MOBILE/demo-apk"
cp "$VEHICLE/app/build/outputs/apk/debug/app-debug.apk" "$MOBILE/demo-apk/ilink-vehicle.apk"
cp "$MOBILE/android/app/build/outputs/apk/release/app-release.apk" "$MOBILE/demo-apk/ilink-child.apk"
ls -la "$MOBILE/demo-apk"
