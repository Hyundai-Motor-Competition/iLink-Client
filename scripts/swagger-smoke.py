#!/usr/bin/env python3
"""
Swagger(Pickup Service API v1)에 적힌 API를 개발 서버에 실제로 한 번씩 불러 보는 점검 스크립트.

흐름: 차량 기기 등록 → 연결 코드 → 보호자 승인 → 자녀 등록·초대 → 일정·장소 설정
      → 픽업 세션 시작부터 완료·결과까지 → 마지막에 차량 로그아웃·연결 해제로 정리.
테스트용 이름(테스트보호자, 테스트자녀)과 가짜 VIN을 쓴다. 표준 라이브러리만 사용.

  python3 scripts/swagger-smoke.py                      # 기본: 개발 서버
  python3 scripts/swagger-smoke.py --base https://...   # 다른 서버
  python3 scripts/swagger-smoke.py --out result.md      # 결과 표를 파일로
"""
import argparse
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from datetime import datetime, timedelta, timezone

KST = timezone(timedelta(hours=9))


class Api:
    def __init__(self, base):
        self.base = base.rstrip("/")
        self.rows = []  # (Swagger ID, 메서드, 경로, 상태, 결과)

    def call(self, sid, method, path, token=None, body=None, query=None, idem=False, headers=None, stream=False, expect=None):
        """expect: 일부러 오류를 확인하는 호출이면 기대 상태 코드. 그 코드가 오면 성공으로 센다"""
        url = self.base + path
        if query:
            url += "?" + urllib.parse.urlencode({k: v for k, v in query.items() if v is not None})
        # Cloudflare가 파이썬 기본 User-Agent(Python-urllib)를 막으므로 이 스크립트임을 밝히는 값을 쓴다
        h = {"Accept": "text/event-stream" if stream else "application/json", "User-Agent": "iLink-swagger-smoke/1.0"}
        if token:
            h["Authorization"] = "Bearer " + token
        # 서버는 Swagger에 적히지 않은 곳(예: LINK-04)에서도 Idempotency-Key를 요구해서, 변경 요청에는 항상 넣는다
        if idem or method in ("POST", "PUT", "PATCH", "DELETE"):
            h["Idempotency-Key"] = str(uuid.uuid4())
        if headers:
            h.update(headers)
        data = None
        if body is not None:
            data = json.dumps(body).encode()
            h["Content-Type"] = "application/json"
        req = urllib.request.Request(url, data=data, method=method, headers=h)
        status, payload = 0, None
        try:
            with urllib.request.urlopen(req, timeout=15 if stream else 20) as r:
                status = r.status
                if stream:
                    # SSE는 연결이 열리면(200, text/event-stream) 성공으로 본다. 이벤트는 기다리지 않는다
                    payload = {"_contentType": r.headers.get("Content-Type")}
                    raw = b""
                else:
                    raw = r.read()
                if not stream and raw:
                    payload = json.loads(raw)
        except urllib.error.HTTPError as e:
            status = e.code
            raw = e.read()
            try:
                payload = json.loads(raw) if raw else None
            except ValueError:
                payload = {"_raw": raw.decode("utf-8", "replace")[:120]}
        except Exception as e:  # 시간 초과 등 (SSE는 열린 채 시간 초과가 정상일 수 있음)
            status = -1
            payload = {"_exception": type(e).__name__ + ": " + str(e)[:100]}
        shown = path.replace(path.split("/invites/")[-1].split("/")[0], "{token}") if "/invites/" in path and "/members/" not in path else path
        ok = (status == expect) if expect else 200 <= status < 300
        label = f"{sid} (기대 {expect})" if expect else sid
        self.rows.append((label, method, shown, status, summarize(status, payload), ok))
        mark = "OK " if ok else "ERR"
        print(f"{mark} {status:>4} {sid:<16} {method:<6} {path}  {self.rows[-1][4]}")
        return status, payload


def mask(p):
    """결과 표에 토큰이 남지 않게 *Token 값은 가린다"""
    if isinstance(p, dict):
        return {k: ("***" if "token" in k.lower() and isinstance(v, str) else mask(v)) for k, v in p.items()}
    if isinstance(p, list):
        return [mask(x) for x in p]
    return p


def summarize(status, p):
    if p is None:
        return ""
    if isinstance(p, dict) and "error" in p and isinstance(p["error"], dict):
        e = p["error"]
        fields = "; ".join(f"{f.get('field')}={f.get('reason')}" for f in (e.get("fields") or []))
        return f"{e.get('code')}: {e.get('message')}" + (f" ({fields})" if fields else "")
    if isinstance(p, dict) and "_exception" in p:
        return p["_exception"]
    s = json.dumps(mask(p), ensure_ascii=False)
    return s[:110] + ("…" if len(s) > 110 else "")


def test_vin():
    """17자 영대문자·숫자, I·O·Q 없음 (서버 규칙). 'TST'로 시작해 테스트임을 알 수 있게"""
    import random
    chars = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789"
    return "TST" + "".join(random.choice(chars) for _ in range(14))


def now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="https://ilink-api-dev.chisanw.com")
    ap.add_argument("--out")
    a = ap.parse_args()
    api = Api(a.base)
    run = uuid.uuid4().hex[:6]
    today = datetime.now(KST).date()
    WEEK = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]

    # ── 1. 차량 기기 · 연결 ──
    _, dev = api.call("AUTH-02", "POST", "/v1/vehicle-devices", body={"model": "PLEOS_CONNECT_TEST", "vin": test_vin()}, idem=True)
    dtok = (dev or {}).get("deviceToken")
    _, code = api.call("LINK-01", "POST", "/v1/vehicle-link-codes", token=dtok)
    code = code or {}
    api.call("LINK-03", "GET", f"/v1/vehicle-link-codes/by-code/{code.get('code')}")
    api.call("LINK-02", "GET", f"/v1/vehicle-link-codes/{code.get('codeId')}/status", token=dtok)

    consents = [{"type": t, "agreed": True} for t in ["TERMS", "PRIVACY", "LOCATION", "PUSH"]]
    _, g = api.call("LINK-04", "POST", "/v1/vehicle-links", body={
        "code": code.get("code"), "mode": "NEW", "consents": consents, "platform": "ANDROID",  # platform 필수 (2026.11.13~)
        "pushToken": f"test-push-{run}", "name": "테스트보호자",
    })
    g = g or {}
    time.sleep(((code or {}).get("pollAfterSeconds") or 3) + 1)  # LINK-02는 pollAfterSeconds보다 빨리 부르면 429
    gtok, grefresh, vehicle_id = g.get("accessToken"), g.get("refreshToken"), g.get("vehicleId")
    _, st = api.call("LINK-02", "GET", f"/v1/vehicle-link-codes/{code.get('codeId')}/status", token=dtok)
    vtok = (st or {}).get("accessToken")
    vehicle_id = vehicle_id or (st or {}).get("vehicleId")

    _, r = api.call("AUTH-01", "POST", "/v1/auth/refresh", body={"refreshToken": grefresh})
    if r and r.get("accessToken"):
        gtok = r["accessToken"]
    api.call("AUTH-03", "PUT", "/v1/devices/me/push-token", token=gtok, body={"platform": "ANDROID", "pushToken": f"test-push2-{run}"})

    # ── 2. 가족 · 자녀 ──
    api.call("FAM-01", "GET", "/v1/families/me", token=gtok)
    _, m = api.call("FAM-02", "POST", "/v1/families/me/members", token=gtok, body={"role": "CHILD", "name": "테스트자녀", "phone": "+821000000000"}, idem=True)
    child_id = (m or {}).get("userId")
    api.call("FAM-03", "PATCH", f"/v1/families/me/members/{child_id}", token=gtok, body={"name": "테스트자녀2"})
    _, inv = api.call("FAM-04", "POST", f"/v1/families/me/members/{child_id}/invites", token=gtok, body={"replaceDevice": False})
    invite_token = ((inv or {}).get("inviteUrl") or "").rstrip("/").split("/")[-1].split("token=")[-1]
    api.call("FAM-05", "GET", f"/v1/invites/{invite_token}")
    _, ch = api.call("FAM-06", "POST", f"/v1/invites/{invite_token}/acceptance", body={"consents": consents, "platform": "ANDROID", "pushToken": f"test-child-{run}"})
    ctok = (ch or {}).get("accessToken")

    # ── 3. 일정 · 장소 · 설정 ──
    _, acad = api.call("SET-01", "GET", "/v1/places/academies", token=gtok, query={"query": "수학학원"})
    cand = ((acad or {}).get("items") or [{}])[0]
    academy = {
        "externalPlaceId": cand.get("externalPlaceId") or f"test-{run}",
        "name": cand.get("name") or "테스트수학학원",
        "address": cand.get("address") or "서울 강남구 테스트로 1",
        "location": cand.get("location") or {"lat": 37.4995, "lng": 127.0602},
    }
    # 서버는 입구 좌표가 있어야 일정을 READY로 만든다 (Swagger에는 선택 항목). 없으면 DRAFT라 세션을 시작할 수 없다
    academy["entrance"] = cand.get("entrance") or {"lat": academy["location"]["lat"] + 0.0001, "lng": academy["location"]["lng"]}
    sched_body = {"academy": academy, "weekdays": WEEK, "classEndTime": "18:00", "targetPickup": 10}
    _, sc = api.call("SET-02", "POST", f"/v1/children/{child_id}/schedules", token=gtok, body=sched_body)
    sched_id, academy_id = (sc or {}).get("scheduleId"), (sc or {}).get("academyId")
    api.call("SET-04", "GET", f"/v1/children/{child_id}/schedules", token=gtok)
    api.call("SET-03", "PUT", f"/v1/schedules/{sched_id}", token=gtok, body={**sched_body, "classEndTime": "18:10"})
    api.call("SET-06", "PUT", "/v1/families/me/call-mode", token=gtok, body={"joinCallMode": "AUTO"})
    # SET-11 자녀 위치 사용 (기본 꺼짐). 켜야 SIG-04 자녀 위치를 받는다
    api.call("SET-11", "PUT", "/v1/families/me/child-location", token=gtok, body={"enabled": True})

    loc = academy["location"]
    spot = lambda name, d: {"academyId": academy_id, "name": name, "stopPoint": {"lat": loc["lat"] + d, "lng": loc["lng"]},
                            "meetingPoint": {"lat": loc["lat"] + d, "lng": loc["lng"] + 0.0001}}
    _, s1 = api.call("SPOT-02", "POST", "/v1/families/me/pickup-spots", token=gtok, body={**spot("테스트 정문 앞", 0.0002), "isDefault": True}, idem=True)
    _, s2 = api.call("SPOT-02", "POST", "/v1/families/me/pickup-spots", token=gtok, body=spot("테스트 후문", -0.0002), idem=True)
    spot1, spot2 = (s1 or {}).get("spotId"), (s2 or {}).get("spotId")
    api.call("SPOT-01", "GET", "/v1/families/me/pickup-spots", token=gtok, query={"academyId": academy_id})
    api.call("SPOT-03", "PATCH", f"/v1/pickup-spots/{spot2}", token=gtok, body={"memo": "테스트 메모"})
    # 장소가 생긴 뒤 일정을 다시 저장해야 DRAFT → READY가 되는지 확인
    _, sc2 = api.call("SET-03", "PUT", f"/v1/schedules/{sched_id}", token=gtok, body={**sched_body, "classEndTime": "18:10"})
    print("    장소 등록 후 일정 상태:", (sc2 or {}).get("status"))

    _, ss = api.call("SET-07", "GET", f"/v1/children/{child_id}/setup-summary", token=gtok)
    print("    설정 누락:", (ss or {}).get("missing"), "· 일정 상태:", [x.get("status") for x in (ss or {}).get("schedules") or []])
    api.call("SET-08", "POST", f"/v1/children/{child_id}/setup-completion", token=gtok, body={"settingsVersion": (ss or {}).get("settingsVersion", 1)})
    api.call("OUT-04", "PUT", "/v1/guardians/me/data-settings", token=gtok, body={"learningConsent": False})

    # ── 4. 차량에서 오늘 일정 → 픽업 세션 ──
    api.call("SET-09", "GET", "/v1/vehicles/me/weekly-pickups", token=vtok)
    api.call("SET-10", "GET", "/v1/vehicles/me/settings-summary", token=vtok)
    api.call("SPOT-01", "GET", "/v1/families/me/pickup-spots", token=vtok)
    # SPOT-04 장소 추천 (차량 · 보호자 둘 다). origin은 '위도,경도' 필수
    origin = f"{loc['lat'] - 0.008},{loc['lng'] + 0.003}"
    api.call("SPOT-04", "GET", "/v1/pickup-spot-recommendations", token=vtok, query={"academyId": academy_id, "origin": origin})
    api.call("SPOT-04", "GET", "/v1/pickup-spot-recommendations", token=gtok, query={"academyId": academy_id, "origin": origin})
    # SPOT-05 학원 기준 근처 추천 (출발 위치 없이). 응답은 배열이 아니라 { supported, items[] } (2026.11.14~)
    _, nb = api.call("SPOT-05", "GET", "/v1/pickup-spot-recommendations/nearby", token=vtok, query={"academyId": academy_id})
    print("    nearby 응답 모양:", type(nb).__name__, "· items", len((nb or {}).get("items") or []) if isinstance(nb, dict) else "-")
    api.call("SPOT-05", "GET", "/v1/pickup-spot-recommendations/nearby", token=gtok, query={"academyId": academy_id})
    # SET-13 오늘의 픽업(보호자) · SET-12 다음 픽업(자녀)
    _, tp = api.call("SET-13", "GET", "/v1/families/me/today-pickups", token=gtok)
    print("    today-pickups 첫 항목 키:", sorted(((tp or {}).get("items") or [{}])[0].keys()) if isinstance(tp, dict) else tp)
    api.call("SET-12", "GET", "/v1/children/me/next-pickup", token=ctok)
    _, sv = api.call("SES-02", "POST", "/v1/pickup-sessions", token=vtok, body={"scheduleIds": [sched_id], "date": today.isoformat()}, idem=True)
    sid = (sv or {}).get("sessionId")
    ver = {"v": (sv or {}).get("stateVersion", 0), "spot": 0}

    def track(p):
        if isinstance(p, dict) and p.get("stateVersion") is not None:
            ver["v"] = p["stateVersion"]
            ver["spot"] = (p.get("spot") or {}).get("spotVersion", ver["spot"])
        return p

    def refresh():
        _, p = api.call("SES-03", "GET", f"/v1/pickup-sessions/{sid}", token=vtok)
        return track(p) or {}

    api.call("SES-01", "GET", "/v1/pickup-sessions/active", token=vtok)
    refresh()
    track(api.call("SES-04", "PUT", f"/v1/pickup-sessions/{sid}/route", token=vtok, body={"spotId": spot1, "stateVersion": ver["v"]}, idem=True)[1])
    # SES-08: 서버는 첫 이벤트가 생길 때 응답 헤더를 보낸다. 기다리는 동안 다음 신호를 보내도록 따로 연다
    import threading
    sse = threading.Thread(target=api.call, args=("SES-08", "GET", f"/v1/pickup-sessions/{sid}/stream"), kwargs={"token": vtok, "stream": True})
    sse.start()
    api.call("SIG-01", "POST", f"/v1/pickup-sessions/{sid}/vehicle-telemetry", token=vtok, body={
        "observedAt": now_iso(), "navEtaSeconds": 600, "remainingMeters": 3000, "location": {"lat": 37.49, "lng": 127.05}, "gear": "D"})
    sse.join()
    refresh()
    track(api.call("CALL-01", "PUT", f"/v1/pickup-sessions/{sid}/call-hold", token=vtok, body={"stateVersion": ver["v"]}, idem=True)[1])
    track(api.call("CALL-01 DEL", "DELETE", f"/v1/pickup-sessions/{sid}/call-hold", token=vtok, query={"stateVersion": ver["v"]}, idem=True)[1])
    refresh()
    track(api.call("SES-05", "POST", f"/v1/pickup-sessions/{sid}/spot-changes", token=gtok, body={"spotId": spot2, "stateVersion": ver["v"], "spotVersion": ver["spot"]}, idem=True)[1])
    refresh()
    track(api.call("SES-04", "PUT", f"/v1/pickup-sessions/{sid}/route", token=vtok, body={"spotId": spot2, "stateVersion": ver["v"]}, idem=True)[1])
    # 보호자 확인형으로 바꾼 뒤 3분 이내로 다가가서, 보호자가 직접 보내는 CALL-02까지 확인
    api.call("SET-06", "PUT", "/v1/families/me/call-mode", token=gtok, body={"joinCallMode": "GUARDIAN_CONFIRM"})
    api.call("SIG-01", "POST", f"/v1/pickup-sessions/{sid}/vehicle-telemetry", token=vtok, body={
        "observedAt": now_iso(), "navEtaSeconds": 150, "remainingMeters": 600, "location": {"lat": loc["lat"] - 0.003, "lng": loc["lng"]}, "gear": "D"})
    # 가드 G6(2026.11.13~): 합류 안내는 차가 정차(STOPPED)한 뒤에만 나간다 (자동 · CALL-02 모두)
    api.call("SIG-02", "POST", f"/v1/pickup-sessions/{sid}/vehicle-events", token=vtok, body={
        "eventId": str(uuid.uuid4()), "type": "STOPPED", "occurredAt": now_iso(), "location": spot("", -0.0002)["stopPoint"]})
    time.sleep(2)
    s = refresh()
    print("    합류 안내 가드:", (s.get("call") or {}).get("guard"), "· ETA:", (s.get("eta") or {}).get("remainingSeconds"))
    call_id = (s.get("call") or {}).get("callId")
    if not call_id:
        # 자동 발송이 안 됐으면 보호자 확인형 직접 보내기(CALL-02)로 만든다
        api.call("SET-06", "PUT", "/v1/families/me/call-mode", token=gtok, body={"joinCallMode": "GUARDIAN_CONFIRM"})
        refresh()
        _, c = api.call("CALL-02", "POST", f"/v1/pickup-sessions/{sid}/calls", token=vtok, body={"stateVersion": ver["v"]}, idem=True)
        call_id = (c or {}).get("callId")
        s = refresh()
        call_id = call_id or (s.get("call") or {}).get("callId")
    else:
        api.call("CALL-02", "POST", f"/v1/pickup-sessions/{sid}/calls", token=vtok, body={"stateVersion": ver["v"]}, idem=True)
    api.call("CALL-04", "POST", f"/v1/calls/{call_id}/acknowledgement", token=ctok, idem=True)
    api.call("SIG-04", "POST", f"/v1/pickup-sessions/{sid}/child-locations", token=ctok, body={"at": now_iso(), "lat": loc["lat"], "lng": loc["lng"], "accuracyM": 10})
    refresh()
    track(api.call("SES-06", "PUT", f"/v1/pickup-sessions/{sid}/hold", token=gtok, body={"stateVersion": ver["v"], "reason": "TEST"}, idem=True)[1])
    refresh()
    track(api.call("SES-06 DEL", "DELETE", f"/v1/pickup-sessions/{sid}/hold", token=gtok, query={"stateVersion": ver["v"]}, idem=True)[1])
    api.call("SIG-05", "POST", f"/v1/pickup-sessions/{sid}/help-requests", token=ctok, body={"type": "CANT_FIND_CAR"}, idem=True)

    # (정차는 위에서) 뒷문 열림·닫힘(탑승 인식) → 10초 안에 탑승 취소 → 예외 → 완료
    api.call("SIG-02", "POST", f"/v1/pickup-sessions/{sid}/vehicle-events", token=vtok, body={
        "eventId": str(uuid.uuid4()), "type": "DOOR_CYCLE", "occurredAt": now_iso(), "door": "REAR_RIGHT"})
    b = refresh()
    print("    문 열림 뒤 탑승 인식:", b.get("boarding"), "· 자녀:", [(c.get("phase"), c.get("boardedAt")) for c in b.get("children") or []])
    track(api.call("SES-12", "POST", f"/v1/pickup-sessions/{sid}/boarding-rejection", token=vtok, body={"childUserId": child_id, "stateVersion": ver["v"]}, idem=True)[1])
    refresh()
    track(api.call("SES-13", "PUT", f"/v1/pickup-sessions/{sid}/incident", token=vtok, body={"type": "CHILD_NOT_ON_BOARD", "childUserId": child_id, "stateVersion": ver["v"]}, idem=True)[1])
    api.call("SES-09", "GET", f"/v1/pickup-sessions/{sid}/events", token=vtok, query={"afterSeq": 0, "limit": 50})
    api.call("SES-10", "GET", f"/v1/pickup-sessions/{sid}/contacts", token=vtok)
    _, nl = api.call("NOTI-02", "GET", f"/v1/pickup-sessions/{sid}/notifications", token=gtok)
    items = (nl or {}).get("items") if isinstance(nl, dict) else nl
    noti_id = (items or [{}])[0].get("notificationId") if items else None
    api.call("NOTI-01", "POST", f"/v1/notifications/{noti_id}/delivery-receipt", token=gtok, body={"receivedAt": now_iso()})
    # 마지막 발송 뒤 1분 안이면 429(RESEND_TOO_SOON)가 규칙이다
    api.call("NOTI-03", "POST", f"/v1/notifications/{noti_id}/resend", token=gtok, expect=429)
    refresh()
    track(api.call("SES-11", "POST", f"/v1/pickup-sessions/{sid}/completion", token=vtok, body={"mode": "MANUAL", "stateVersion": ver["v"]}, idem=True)[1])
    api.call("OUT-02", "GET", f"/v1/pickup-sessions/{sid}/outcome", token=gtok)
    api.call("OUT-03", "PUT", f"/v1/pickup-sessions/{sid}/outcome/correction", token=gtok, body={"correctedStopAt": now_iso(), "reasonCode": "OTHER", "note": "점검"})
    api.call("OUT-01", "GET", f"/v1/children/{child_id}/pickup-history", token=gtok, query={"month": today.strftime("%Y-%m")})

    def new_session():
        _, v = api.call("SES-02", "POST", "/v1/pickup-sessions", token=vtok, body={"scheduleIds": [sched_id], "date": today.isoformat()}, idem=True)
        return (v or {}).get("sessionId"), (v or {}).get("stateVersion", 0)

    # 두 번째 세션: 합류 안내 철회(CALL-03) → 취소(SES-07)
    sid2, v2 = new_session()
    _, p = api.call("SES-04", "PUT", f"/v1/pickup-sessions/{sid2}/route", token=vtok, body={"spotId": spot1, "stateVersion": v2}, idem=True)
    api.call("SIG-01", "POST", f"/v1/pickup-sessions/{sid2}/vehicle-telemetry", token=vtok, body={
        "observedAt": now_iso(), "navEtaSeconds": 150, "remainingMeters": 600, "gear": "D"})
    api.call("SIG-02", "POST", f"/v1/pickup-sessions/{sid2}/vehicle-events", token=vtok, body={
        "eventId": str(uuid.uuid4()), "type": "STOPPED", "occurredAt": now_iso(), "location": spot("", 0.0002)["stopPoint"]})
    _, p = api.call("SES-03", "GET", f"/v1/pickup-sessions/{sid2}", token=vtok)
    _, c = api.call("CALL-02", "POST", f"/v1/pickup-sessions/{sid2}/calls", token=vtok, body={"stateVersion": (p or {}).get("stateVersion", 0)}, idem=True)
    _, p = api.call("SES-03", "GET", f"/v1/pickup-sessions/{sid2}", token=vtok)
    cid2 = (c or {}).get("callId") or ((p or {}).get("call") or {}).get("callId")
    _, p = api.call("CALL-03", "POST", f"/v1/calls/{cid2}/revocation", token=gtok, body={"stateVersion": (p or {}).get("stateVersion", 0), "reason": "TEST"}, idem=True)
    api.call("SES-07", "POST", f"/v1/pickup-sessions/{sid2}/cancellation", token=vtok, body={"stateVersion": (p or {}).get("stateVersion", 0), "reason": "TEST"}, idem=True)

    # 세 번째 세션: 준비 시간 연장(SIG-03)은 합류 안내 전에만 → 취소
    sid3, v3 = new_session()
    api.call("SIG-03", "POST", f"/v1/pickup-sessions/{sid3}/prep-time-extensions", token=ctok, body={"minutes": 5}, idem=True)
    _, p = api.call("SES-03", "GET", f"/v1/pickup-sessions/{sid3}", token=vtok)
    api.call("SES-07", "POST", f"/v1/pickup-sessions/{sid3}/cancellation", token=vtok, body={"stateVersion": (p or {}).get("stateVersion", v3), "reason": "TEST"}, idem=True)

    # ── 5. 정리 ──
    api.call("SPOT-03 DEL", "DELETE", f"/v1/pickup-spots/{spot2}", token=gtok, idem=True)
    # 해제된 멤버 · 자녀 (2026.11.14~): 해제 전에 안 쓴 초대를 하나 만들어 두고, 해제 뒤 오류를 확인한다
    _, inv2 = api.call("FAM-04", "POST", f"/v1/families/me/members/{child_id}/invites", token=gtok, body={"replaceDevice": True})
    unused = ((inv2 or {}).get("inviteUrl") or "").rstrip("/").split("/")[-1]
    api.call("FAM-07", "DELETE", f"/v1/families/me/members/{child_id}", token=gtok, idem=True)
    expect = []
    expect.append(("FAM-04 해제 후", 404, api.call("FAM-04", "POST", f"/v1/families/me/members/{child_id}/invites", token=gtok, body={"replaceDevice": False}, expect=404)[0]))
    expect.append(("FAM-05 폐기된 초대", 410, api.call("FAM-05", "GET", f"/v1/invites/{unused}", expect=410)[0]))
    expect.append(("FAM-06 폐기된 초대", 410, api.call("FAM-06", "POST", f"/v1/invites/{unused}/acceptance", body={"consents": consents, "platform": "ANDROID", "pushToken": "x"}, expect=410)[0]))
    expect.append(("SET-02 해제된 자녀", 404, api.call("SET-02", "POST", f"/v1/children/{child_id}/schedules", token=gtok, body=sched_body, expect=404)[0]))
    expect.append(("SET-03 해제된 자녀 일정", 404, api.call("SET-03", "PUT", f"/v1/schedules/{sched_id}", token=gtok, body=sched_body, expect=404)[0]))
    expect.append(("SET-04 해제된 자녀", 404, api.call("SET-04", "GET", f"/v1/children/{child_id}/schedules", token=gtok, expect=404)[0]))
    print("    해제 후 기대 오류:", [(n, f"{got}{'✓' if got == want else ' ≠ ' + str(want)}") for n, want, got in expect])
    api.call("AUTH-04", "DELETE", "/v1/vehicle-devices/me/session", token=vtok)
    api.call("LINK-05", "DELETE", f"/v1/vehicle-links/{vehicle_id}", token=gtok, idem=True)

    ok = sum(1 for r in api.rows if r[5])
    ids = {(r[1], r[0].split()[0]) for r in api.rows}
    passed = {(r[1], r[0].split()[0]) for r in api.rows if r[5]}
    print(f"\n성공 {ok} / 호출 {len(api.rows)} · API {len(ids)}개 중 {len(passed)}개 정상 응답")
    if a.out:
        with open(a.out, "w") as f:
            f.write(f"# Swagger API 점검 결과\n\n서버: {a.base}  \n실행: {datetime.now(KST):%Y-%m-%d %H:%M} KST  \n성공 {ok} / 호출 {len(api.rows)} · API {len(ids)}개 중 {len(passed)}개 정상 응답\n\n")
            f.write("| Swagger ID | 메서드 | 경로 | 상태 | 응답 요약 |\n|---|---|---|---|---|\n")
            for sid_, m, p, s, msg, _ok in api.rows:
                f.write(f"| {sid_} | {m} | `{p}` | {s} | {msg.replace('|', '/')} |\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
