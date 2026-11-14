#!/usr/bin/env bash
# 부모 휴대폰으로 차량 QR을 찍는 단계. 시뮬레이터에는 카메라가 없어서 차량 화면의 QR 내용(pickup://link?code=)을
# 부모 iPhone에서 연다 → 부모 앱이 코드를 확인하고 '차량 정보 확인'으로 넘어간다.
set -euo pipefail
source "$(dirname "$0")/env.sh"
QR=$(pleos logcat -d -s iLinkQr:I | grep -oE 'pickup://link\?code=[A-Za-z0-9]+' | tail -1)
if [ -z "$QR" ]; then echo "차량 화면에 QR이 아직 없어요. 차량 앱의 '새 코드 받기'를 눌러 주세요."; exit 1; fi
xcrun simctl openurl "$(ios_udid)" "$QR"
echo "부모 iPhone에서 차량 QR을 열었어요: $QR"
