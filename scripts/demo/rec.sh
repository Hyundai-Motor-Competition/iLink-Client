#!/usr/bin/env bash
# 이 컴퓨터에 켜진 기기 화면을 따로 녹화한다. 영상은 demo-rec/ 에 모이고, compose.sh 가 한 화면으로 합친다.
#   scripts/demo/rec.sh start     녹화 시작 (차량 car · 자녀 child · 부모 parent 중 이 컴퓨터에 켜진 것만)
#   scripts/demo/rec.sh stop      녹화 끝
# Android: 에뮬레이터 자체 녹화(컴퓨터 시계 기준, Android Emulator 35 이상). 25분마다 새 조각(car-000.webm …)으로 이어 간다.
# iOS: simctl 녹화(parent.mov). 조각마다 시작 · 끝 시각(*.start · *.end)을 적어 두어 compose.sh 가 시각으로 맞춘다.
set -euo pipefail
source "$(dirname "$0")/env.sh"
mkdir -p "$REC"
SEG=${REC_SEG:-1500}

# 녹화 크기: 차량은 화면의 절반, 폰은 2/3 (영상에서 쓰는 크기보다 조금 크게, 에뮬레이터 부담은 줄이게)
rec_size() { # 기기 분모 분자
  local wh; wh=$("$ADB" -s "$1" shell wm size | tr -d '\r' | grep -oE '[0-9]+x[0-9]+' | tail -1)
  py "w,h=map(int,'$wh'.split('x')); print(f'{w*$3//$2//2*2}x{h*$3//$2//2*2}')"
}

android_loop() { # 이름 기기 크기
  local name=$1 dev=$2 size=$3 n=0 f t
  while [ ! -f "$REC/$name.stopflag" ]; do
    f="$REC/$name-$(printf %03d $n).webm"
    "$ADB" -s "$dev" emu screenrecord start --size "$size" --fps 24 --time-limit $((SEG + 60)) "$(native "$f")" > /dev/null
    now > "$f.start"
    t=0
    while [ $t -lt $SEG ] && [ ! -f "$REC/$name.stopflag" ]; do sleep 1; t=$((t + 1)); done
    "$ADB" -s "$dev" emu screenrecord stop > /dev/null
    now > "$f.end"
    n=$((n + 1))
    sleep 1   # 파일을 마무리할 시간
  done
  rm -f "$REC/$name.stopflag" "$REC/$name.pid"
}

start_android() { # 이름 기기 분모 분자
  local name=$1 dev=$2
  has_dev "$dev" || return 0
  rm -f "$REC/$name"-*.webm "$REC/$name"-*.webm.start "$REC/$name"-*.webm.end "$REC/$name.stopflag"
  local size; size=$(rec_size "$dev" "$3" "$4")
  android_loop "$name" "$dev" "$size" > "$REC/$name.log" 2>&1 &
  echo $! > "$REC/$name.pid"
  echo "녹화 중: $name ($dev, $size)"
}

start_ios() {
  has_ios || return 0
  local udid; udid=$(ios_udid)
  xcrun simctl list devices booted | grep -q "$udid" || return 0
  rm -f "$REC/parent.mov"
  # 백그라운드 작업도 SIGINT를 받게 job control을 켠다 (recordVideo는 SIGINT로 저장을 마친다)
  set -m
  xcrun simctl io "$udid" recordVideo --codec h264 --force "$REC/parent.mov" > "$REC/parent.log" 2>&1 &
  echo $! > "$REC/parent.pid"
  set +m
  for _ in $(seq 1 30); do grep -qi 'recording started' "$REC/parent.log" 2>/dev/null && break; sleep 0.5; done
  now > "$REC/parent.mov.start"
  echo "녹화 중: parent (iOS)"
}

stop_android() {
  local name=$1
  [ -f "$REC/$name.pid" ] || return 0
  touch "$REC/$name.stopflag"
  for _ in $(seq 1 20); do [ -f "$REC/$name.pid" ] || break; sleep 0.5; done
  echo "녹화 끝: $name ($(ls "$REC/$name"-*.webm 2>/dev/null | wc -l | tr -d ' ')조각)"
}

stop_ios() {
  [ -f "$REC/parent.pid" ] || return 0
  now > "$REC/parent.mov.end"
  local pid; pid=$(cat "$REC/parent.pid")
  kill -INT "$pid" 2>/dev/null || true
  for _ in $(seq 1 20); do kill -0 "$pid" 2>/dev/null || break; sleep 0.5; done
  rm -f "$REC/parent.pid"
  echo "녹화 끝: parent"
}

case "${1:-}" in
  start)
    [ -f "$REC/marks.txt" ] && mv "$REC/marks.txt" "$REC/marks.$(date +%H%M%S).bak"
    start_android car "$PLEOS" 2 1
    start_android child "$PHONE" 3 2
    start_ios
    ;;
  stop)
    stop_android car; stop_android child; stop_ios
    ls -la "$REC" | grep -E 'webm$|mov$' || true
    ;;
  *) echo "사용법: scripts/demo/rec.sh start|stop"; exit 1 ;;
esac
