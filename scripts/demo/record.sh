#!/usr/bin/env bash
# 화면 전체를 녹화한다 (세 기기 창이 보이게 배치한 상태에서). Ctrl+C로 끝.
#   scripts/demo/record.sh [파일이름.mov]
# 처음 한 번은 macOS가 '화면 기록' 권한을 묻는다 (시스템 설정 → 개인정보 보호 및 보안 → 화면 기록).
set -euo pipefail
OUT="${1:-$HOME/Desktop/iLink-demo-$(date +%m%d-%H%M).mov}"
echo "녹화 중: $OUT  (끝내려면 Ctrl+C)"
screencapture -v -k "$OUT"
