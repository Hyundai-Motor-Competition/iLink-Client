#!/usr/bin/env bash
# 창 배치: 왼쪽 차량(Pleos) · 가운데 부모(iOS Simulator) · 오른쪽 자녀(Android 폰).
# macOS '손쉬운 사용' 권한(터미널)이 필요하다. 없으면 직접 옮겨 주세요.
set -uo pipefail
read -r SW SH <<<"$(osascript -e 'tell application "Finder" to get bounds of window of desktop' | awk -F', ' '{print $3, $4}')"
TOP=40; H=$(( SH - TOP - 10 ))
LEFT_W=$(( SW * 52 / 100 ))
COL_W=$(( (SW - LEFT_W) / 2 ))
osascript <<OSA
tell application "System Events"
  set emus to (every process whose name contains "qemu")
  repeat with p in emus
    repeat with w in (windows of p)
      set t to name of w
      if t contains "ilink_pleos" then
        set position of w to {0, $TOP}
        set size of w to {$LEFT_W, $(( LEFT_W * 9 / 16 + 60 ))}
      else if t contains "$( . "$(dirname "$0")/env.sh"; echo "$PHONE_AVD")" then
        set position of w to {$(( LEFT_W + COL_W )), $TOP}
      end if
    end repeat
  end repeat
  tell process "Simulator"
    set position of window 1 to {$LEFT_W, $TOP}
  end tell
end tell
OSA
