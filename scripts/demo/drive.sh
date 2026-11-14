#!/usr/bin/env bash
# 차량 에뮬레이터의 차를 움직인다: 출발(D) → 목적지까지 이동(GPS) → 정차(P) → 뒷문 열고 닫기(탑승).
# 차량 앱에서 '여기로 출발하기'를 누른 뒤 실행한다. 목적지는 차량 앱 로그(iLinkRoute)에서 읽는다.
#   scripts/demo/drive.sh            전체
#   scripts/demo/drive.sh --to-stop  정차까지만 (탑승은 board.sh)
# 자녀 폰 위치는 목적지(만나는 곳) 바로 옆으로 둔다.
set -euo pipefail
source "$(dirname "$0")/env.sh"
SECONDS_TOTAL="${DRIVE_SECONDS:-60}"

DEST=$(pleos logcat -d -s iLinkRoute:I | grep -oE 'dest=[-0-9.]+,[-0-9.]+' | tail -1 | cut -d= -f2)
if [ -z "$DEST" ]; then echo "차량 앱에서 먼저 '여기로 출발하기'를 눌러 주세요."; exit 1; fi
LAT=${DEST%,*}; LNG=${DEST#*,}
echo "목적지 $LAT, $LNG"

# 차 위치: 차량 앱 시연 신호 + 에뮬레이터 GPS 둘 다 (geo fix 는 경도 위도 순서)
geo() { sim --es lat "$1" --es lng "$2"; pleos emu geo fix "$2" "$1" > /dev/null 2>&1 || true; }

# 자녀는 학원 건물 앞(목적지에서 북동쪽으로 약 150m)에서 걸어온다
phone emu geo fix "$(python3 -c "print($LNG+0.0009)")" "$(python3 -c "print($LAT+0.0011)")" > /dev/null

# 출발점: 목적지에서 남서쪽 약 1.2km
read -r SLAT SLNG <<<"$(python3 -c "print($LAT-0.0080, $LNG-0.0085)")"
geo "$SLAT" "$SLNG"
sim --es gear D --ez driving true   # 출발: 기어 D, 주행 중 화면
# Pleos 내비가 길안내를 시작하면 내비 화면이 앞으로 나온다. 시연에서는 iLink 화면을 다시 앞으로
sleep 2; pleos shell am start --user current -n "$VEHICLE_PKG/com.ilink.vehicle.MainActivity" > /dev/null
STEPS=$(( SECONDS_TOTAL / 2 ))
for i in $(seq 1 "$STEPS"); do
  read -r CLAT CLNG <<<"$(python3 -c "t=$i/$STEPS; print($SLAT+($LAT-$SLAT)*t, $SLNG+($LNG-$SLNG)*t)")"
  geo "$CLAT" "$CLNG"
  sleep 2
done
geo "$LAT" "$LNG"
sim --ez driving false
sleep 1
sim --es gear P            # 기어 P → 정차(STOPPED)
echo "정차했어요. 서버가 자녀에게 합류 안내를 보냅니다."
[ "${1:-}" = --to-stop ] && exit 0
"$(dirname "$0")/board.sh"
