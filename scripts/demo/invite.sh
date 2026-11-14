#!/usr/bin/env bash
# 부모(iOS)에서 '편지지'를 눌러 복사한 초대 링크를 자녀(Android) 폰에서 연다.
# (실제로는 카카오톡 등으로 받은 링크를 누르는 단계)
set -euo pipefail
source "$(dirname "$0")/env.sh"
UDID=$(ios_udid)
LINK=$(xcrun simctl pbpaste "$UDID")
TOKEN=$(printf '%s' "$LINK" | grep -oE 'invite/[A-Za-z0-9_-]+' | head -1 | cut -d/ -f2)
if [ -z "$TOKEN" ]; then
  echo "부모 앱의 초대장 화면에서 편지지를 눌러 링크를 먼저 복사해 주세요. (지금 복사된 값: ${LINK:-없음})"
  exit 1
fi
phone shell am start -a android.intent.action.VIEW -d "pickup://invite/$TOKEN" "$MOBILE_PKG" > /dev/null
echo "자녀 폰에서 초대 화면을 열었어요."
