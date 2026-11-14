#!/usr/bin/env bash
# 따로 녹화한 세 화면을 한 영상(1920x1080)으로 합친다. Mac에서 실행 (ffmpeg · swift 필요).
#   왼쪽: 차량 디스플레이 · 오른쪽: 자녀(Android) · 부모(iOS) · 위: step.sh 로 남긴 단계 자막
#   scripts/demo/compose.sh [결과.mp4]
#   CUTS="120-150,300-330" scripts/demo/compose.sh   합친 영상에서 그 구간(초)을 잘라 낸다 (기다리는 시간 줄이기)
# demo-rec/ 에 car-*.webm · child-*.webm · parent.mov 와 각 *.start · *.end, marks*.txt 가 있어야 한다.
# 다른 컴퓨터(Windows)에서 녹화한 파일은 그 컴퓨터의 demo-rec/ 내용을 그대로 이 Mac의 demo-rec/ 로 복사한다
# (marks.txt 가 양쪽에 있으면 marks.txt · marks-win.txt 처럼 이름만 바꿔 둘 다 넣는다).
set -euo pipefail
source "$(dirname "$0")/env.sh"
OUT="${1:-$HOME/Desktop/iLink-demo-$(date +%m%d-%H%M).mp4}"
TMP="$REC/.compose"; rm -rf "$TMP"; mkdir -p "$TMP"
CAP="$(dirname "$0")/caption.swift"
command -v ffmpeg > /dev/null || { echo "ffmpeg가 없어요: brew install ffmpeg"; exit 1; }

# 화면 배치 (1920x1080): 위 기기 · 그 아래 이름표 · 맨 아래 자막(높이 CAP_H)
W=1920; H=1080; TOP=34; PH=840; GAP=40; CAP_H=96
# 시작 · 끝 시각 → 공통 시간축 (모든 조각 중 가장 이른 시작 ~ 가장 늦은 끝)
read -r T0 T1 <<<"$(py "
import glob
s=[float(open(f).read()) for f in glob.glob('$REC/*.start')]
e=[float(open(f).read()) for f in glob.glob('$REC/*.end')]
print(min(s), max(e))")"
TOTAL=$(py "print(round($T1-$T0,2))")
echo "길이 ${TOTAL}초"

# 크기: 폰 두 대는 화면 높이 PH + 테두리(베젤 B, 옆 버튼 4px), 차량은 남은 폭
B=12; SIDE=4; PH=$((PH - 2 * B))
# 폰 화면 비율은 녹화 파일에서 읽는다 (없으면 Pixel · iPhone 17 Pro 기본값)
aspect() { # 파일 기본값
  local f; f=$(ls $1 2>/dev/null | head -1)
  if [ -n "$f" ]; then ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$f" | head -1; else echo "$2"; fi
}
CHILD_WH=$(aspect "$REC/child-*.webm" 1080x2400); PARENT_WH=$(aspect "$REC/parent.mov" 1206x2622)
CHILD_W=$(py "w,h=map(int,'$CHILD_WH'.split('x')); print(int($PH*w/h)//2*2)")
PARENT_W=$(py "w,h=map(int,'$PARENT_WH'.split('x')); print(int($PH*w/h)//2*2)")
CHILD_OW=$((CHILD_W + 2 * B + 2 * SIDE)); PARENT_OW=$((PARENT_W + 2 * B + 2 * SIDE))
PARENT_X=$((W - GAP - PARENT_OW)); CHILD_X=$((PARENT_X - GAP - CHILD_OW))
CAR_W=$(( (CHILD_X - 2*GAP) / 2 * 2 )); CAR_H=$(( CAR_W * 9 / 16 / 2 * 2 )); CAR_X=$GAP
CAR_Y=$(( TOP + (PH + 2 * B - CAR_H) / 2 ))
LABEL_Y=$((TOP + PH + 2 * B + 12))
swift "$CAP" base "$TMP/base.png" $W $H \
  "$((CAR_X + CAR_W / 2)),$((CAR_Y + CAR_H + 16)),차량 디스플레이 · Pleos Connect" \
  "$((CHILD_X + CHILD_OW / 2)),$LABEL_Y,자녀 · Android" \
  "$((PARENT_X + PARENT_OW / 2)),$LABEL_Y,부모 · iOS"
swift "$CAP" phone "$TMP/frame_child.png" $CHILD_OW $((PH + 2 * B)) android $CHILD_W $PH $B
swift "$CAP" phone "$TMP/frame_parent.png" $PARENT_OW $((PH + 2 * B)) ios $PARENT_W $PH $B

# 자막 (모든 marks*.txt 를 시각순으로)
cat "$REC"/marks*.txt 2>/dev/null | sort -n > "$TMP/marks.txt" || true
INPUTS=(-loop 1 -framerate 30 -t "$TOTAL" -i "$TMP/base.png")
FILTER=""; LAST="0:v"; idx=1
place() { # 이름 폭 높이 x y   (이름-*.webm 조각들 또는 parent.mov)
  local n=$1 w=$2 h=$3 x=$4 y=$5 segs=() f k=0 parts=""
  for f in "$REC/$n".mov "$REC/$n"-*.webm; do [ -f "$f" ] && [ -f "$f.start" ] && segs+=("$f"); done
  if [ ${#segs[@]} -eq 0 ]; then echo "  (없음: $n — 빈 칸으로 둔다)"; return; fi
  local first; first=$(cat "${segs[0]}.start")
  for k in "${!segs[@]}"; do
    f=${segs[$k]}
    local st en d
    st=$(cat "$f.start"); en=$(cat "$f.end" 2>/dev/null || echo "$T1")
    [ $((k + 1)) -lt ${#segs[@]} ] && en=$(cat "${segs[$((k + 1))]}.start")
    d=$(py "print(round(max(0.1,$en-$st),3))")
    local real; real=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f" | tr -d '\r')
    py "import sys; sys.exit(0 if $real > $d - 15 else 1)" || echo "  주의: $(basename "$f") 녹화가 ${real}초에서 끊겼어요 (녹화 시간 ${d}초). 그 뒤는 마지막 화면으로 채워요."
    INPUTS+=(-i "$f")
    FILTER+="[$idx:v]setpts=PTS-STARTPTS,fps=30,scale=$w:$h:flags=lanczos,setsar=1,tpad=stop_mode=clone:stop_duration=600,trim=duration=$d,setpts=PTS-STARTPTS[s$idx];"
    parts+="[s$idx]"; idx=$((idx + 1))
  done
  local off; off=$(py "print(round(max(0,$first-$T0),3))")
  FILTER+="${parts}concat=n=${#segs[@]}:v=1:a=0,tpad=start_duration=$off:start_mode=clone[t$n];"
  FILTER+="[$LAST][t$n]overlay=$x:$y:eof_action=repeat[o$n];"
  LAST="o$n"
}
frame() { # 폰 테두리를 화면 위에 덮는다 (화면 자리는 투명, 모서리는 테두리가 가린다)
  INPUTS+=(-i "$1"); FILTER+="[$LAST][$idx:v]overlay=$2:$3[f$idx];"; LAST="f$idx"; idx=$((idx + 1))
}
place car $CAR_W $CAR_H $CAR_X $CAR_Y
place child $CHILD_W $PH $((CHILD_X + SIDE + B)) $((TOP + B))
frame "$TMP/frame_child.png" $CHILD_X $TOP
place parent $PARENT_W $PH $((PARENT_X + SIDE + B)) $((TOP + B))
frame "$TMP/frame_parent.png" $PARENT_X $TOP

i=0
MARKS=()
while IFS= read -r line; do [ -n "$line" ] && MARKS+=("$line"); done < "$TMP/marks.txt"
for k in "${!MARKS[@]}"; do
  t=$(cut -f1 <<<"${MARKS[$k]}"); text=$(cut -f2- <<<"${MARKS[$k]}")
  next=$T1; [ $((k + 1)) -lt ${#MARKS[@]} ] && next=$(cut -f1 <<<"${MARKS[$((k + 1))]}")
  a=$(py "print(round(max(0,$t-$T0),2))"); b=$(py "print(round($next-$T0,2))")
  swift "$CAP" text "$TMP/cap$i.png" $W $CAP_H "$text"
  INPUTS+=(-i "$TMP/cap$i.png")
  FILTER+="[$LAST][$idx:v]overlay=0:$((H - CAP_H - 6)):enable='between(t,$a,$b)'[c$i];"
  LAST="c$i"; idx=$((idx + 1)); i=$((i + 1))
done
FILTER+="[$LAST]trim=duration=$TOTAL,format=yuv420p[out]"
echo "자막 ${i}개 · 합치는 중..."
FULL="$OUT"; [ -n "${CUTS:-}" ] && FULL="$TMP/full.mp4"
ffmpeg -hide_banner -loglevel error -y "${INPUTS[@]}" -filter_complex "$FILTER" -map "[out]" \
  -c:v libx264 -preset medium -crf 20 -r 30 -movflags +faststart "$FULL"
if [ -n "${CUTS:-}" ]; then
  # 잘라 낼 구간을 뺀 나머지 프레임만 남기고 시간을 이어 붙인다
  EXPR=$(py "print('+'.join(f'between(t,{a},{b})' for a,b in (r.split('-') for r in '$CUTS'.split(','))))")
  echo "구간 잘라 내기: $CUTS"
  ffmpeg -hide_banner -loglevel error -y -i "$FULL" -vf "select='not($EXPR)',setpts=N/FRAME_RATE/TB" \
    -c:v libx264 -preset medium -crf 20 -r 30 -movflags +faststart "$OUT"
fi
echo "완성: $OUT"
