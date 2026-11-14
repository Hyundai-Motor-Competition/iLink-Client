#!/usr/bin/env bash
# 시연 단계 자막을 남기고 그 화면을 잠시 그대로 둔다 (설명할 시간). 자막은 compose.sh 가 영상 위에 넣는다.
#   scripts/demo/step.sh "차량 QR로 부모 앱과 연결해요"        자막을 남기고 6초 기다린다
#   HOLD=10 scripts/demo/step.sh "…"                           10초 기다린다
#   HOLD=0 scripts/demo/step.sh "…"                            자막만 남긴다
# 녹화하는 두 컴퓨터 어느 쪽에서 실행해도 된다 (시각으로 맞춘다. 두 컴퓨터 시계가 인터넷 시간과 맞아 있어야 한다).
set -euo pipefail
source "$(dirname "$0")/env.sh"
mkdir -p "$REC"
printf '%s\t%s\n' "$(now)" "$*" >> "$REC/marks.txt"
echo "▶ $*"
sleep "${HOLD:-6}"
