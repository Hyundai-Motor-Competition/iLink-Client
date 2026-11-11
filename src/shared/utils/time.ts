// 서버 송수신은 ISO 8601 UTC, 표시는 기기 현지 시간 (기획서 F2 입력·주기 정책).
export function formatClock(iso?: string | null): string {
  if (!iso) return '--:--';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--';
  return `${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`;
}

export function minutesLeft(seconds?: number | null): number | null {
  if (seconds === undefined || seconds === null) return null;
  return Math.max(0, Math.ceil(seconds / 60));
}

export function nowIso(): string {
  return new Date().toISOString();
}
