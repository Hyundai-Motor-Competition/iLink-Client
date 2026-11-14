#!/usr/bin/env bash
# 아이가 타는 장면: 합류 안내 후 잠시 기다렸다가 뒷좌석 오른쪽 문을 열고 닫는다(DOOR_CYCLE → 탑승 인식).
set -euo pipefail
source "$(dirname "$0")/env.sh"
WAIT="${BOARD_WAIT:-20}"
echo "${WAIT}초 뒤 뒷문을 열고 닫아요 (아이가 걸어오는 시간)"
sleep "$WAIT"
sim --es door REAR_RIGHT --ez open true
sleep 3
sim --es door REAR_RIGHT --ez open false
echo "문을 열고 닫았어요. 탑승 인식 → 취소 가능 시간이 지나면 탑승 완료."
