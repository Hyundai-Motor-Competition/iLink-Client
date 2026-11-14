#!/usr/bin/env bash
# 부모 휴대폰으로 차량 QR을 찍는 단계. 시뮬레이터에는 카메라가 없어서 차량 화면의 QR 내용(pickup://link?code=)을
# 부모 iPhone에서 연다 → 부모 앱이 코드를 확인하고 '차량 정보 확인'으로 넘어간다.
#   scripts/demo/link.sh                차량 · iOS가 같은 컴퓨터일 때
#   scripts/demo/link.sh                (차량 쪽 컴퓨터) QR 내용을 보여 준다
#   scripts/demo/link.sh 'pickup://…'   (Mac) 그 QR 내용을 부모 iPhone에서 연다
set -euo pipefail
source "$(dirname "$0")/env.sh"
QR="${1:-}"
if [ -z "$QR" ]; then
  if ! has_dev "$PLEOS"; then echo "차량 에뮬레이터가 이 컴퓨터에 없어요. 차량 쪽에서 link.sh 를 실행해 QR 내용을 받아 주세요."; exit 1; fi
  QR=$(pleos logcat -d -s iLinkQr:I | grep -oE 'pickup://link\?code=[A-Za-z0-9]+' | tail -1)
  if [ -z "$QR" ]; then echo "차량 화면에 QR이 아직 없어요. 차량 앱의 '새 코드 받기'를 눌러 주세요."; exit 1; fi
fi
if has_ios; then
  xcrun simctl openurl "$(ios_udid)" "$QR"
  echo "부모 iPhone에서 차량 QR을 열었어요: $QR"
else
  echo "차량 QR 내용: $QR"
  echo "Mac에서 실행:  scripts/demo/link.sh '$QR'"
  printf '%s' "$QR" > "${TMPDIR:-/tmp}/ilink-qr.txt"
fi
