#!/usr/bin/env bash
# 시연 끝: 에뮬레이터 · 시뮬레이터를 끈다.
source "$(dirname "$0")/env.sh"
"$ADB" -s "$PLEOS" emu kill 2>/dev/null || true
"$ADB" -s "$PHONE" emu kill 2>/dev/null || true
xcrun simctl shutdown "$(ios_udid)" 2>/dev/null || true
osascript -e 'quit app "Simulator"' 2>/dev/null || true
echo "모두 껐어요."
