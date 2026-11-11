# Swagger API 점검 결과

서버: https://ilink-api-dev.chisanw.com  
실행: 2026-11-11 23:34 KST  
성공 87 / 호출 89 · API 60개 중 58개 정상 응답

| Swagger ID | 메서드 | 경로 | 상태 | 응답 요약 |
|---|---|---|---|---|
| AUTH-02 | POST | `/v1/vehicle-devices` | 201 | {"deviceId": 43, "vehicleId": 18, "deviceToken": "***"} |
| LINK-01 | POST | `/v1/vehicle-link-codes` | 201 | {"codeId": 19, "code": "NKU5IFIF", "qrPayload": "pickup://link?code=NKU5IFIF", "expiresAt": "2026-11-11T23:39:… |
| LINK-03 | GET | `/v1/vehicle-link-codes/by-code/NKU5IFIF` | 200 | {"status": "NEW", "vehicleModel": "PLEOS_CONNECT_TEST", "plateNumberMasked": null, "expiresAt": "2026-11-11T23… |
| LINK-02 | GET | `/v1/vehicle-link-codes/19/status` | 200 | {"status": "WAITING", "vehicleId": null, "familyId": null, "accessToken": null, "refreshToken": null, "pollAft… |
| LINK-04 | POST | `/v1/vehicle-links` | 201 | {"vehicleId": 18, "familyId": 15, "userId": 30, "accessToken": "***", "refreshToken": "***"} |
| LINK-02 | GET | `/v1/vehicle-link-codes/19/status` | 200 | {"status": "LINKED", "vehicleId": 18, "familyId": 15, "accessToken": "***", "refreshToken": "***", "pollAfterS… |
| AUTH-01 | POST | `/v1/auth/refresh` | 200 | {"accessToken": "***", "refreshToken": "***", "accessTokenExpiresAt": "***"} |
| AUTH-03 | PUT | `/v1/devices/me/push-token` | 204 |  |
| FAM-01 | GET | `/v1/families/me` | 200 | {"familyId": 15, "joinCallMode": "AUTO", "vehicle": {"vehicleId": 18, "model": "PLEOS_CONNECT_TEST", "plateNum… |
| FAM-02 | POST | `/v1/families/me/members` | 201 | {"userId": 31} |
| FAM-03 | PATCH | `/v1/families/me/members/31` | 200 | {"userId": 31, "role": "CHILD", "name": "테스트자녀2", "phone": "+821000000000", "deviceStatus": "NONE"} |
| FAM-04 | POST | `/v1/families/me/members/31/invites` | 201 | {"inviteUrl": "https://app.example/invite/nghGSKTL92N0CzWcwbjA1OrCVwFqsxmNCoczFVdp0d8", "expiresAt": "2026-11-… |
| FAM-05 | GET | `/v1/invites/{token}` | 200 | {"inviterName": "테스트보호자", "memberName": "테스트자녀2", "role": "CHILD", "requiredConsents": ["TERMS", "PRIVACY", "L… |
| FAM-06 | POST | `/v1/invites/{token}/acceptance` | 201 | {"userId": 31, "familyId": 15, "role": "CHILD", "accessToken": "***", "refreshToken": "***"} |
| SET-01 | GET | `/v1/places/academies` | 502 | {"type": "https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/er… |
| SET-02 | POST | `/v1/children/31/schedules` | 201 | {"scheduleId": 14, "academyId": 12, "status": "READY"} |
| SET-04 | GET | `/v1/children/31/schedules` | 200 | {"items": [{"scheduleId": 14, "academy": {"academyId": 12, "name": "테스트수학학원"}, "weekdays": ["MON", "TUE", "WED… |
| SET-03 | PUT | `/v1/schedules/14` | 200 | {"scheduleId": 14, "academyId": 12, "status": "READY"} |
| SET-06 | PUT | `/v1/families/me/call-mode` | 200 | {"joinCallMode": "AUTO", "settingsVersion": 1} |
| SPOT-02 | POST | `/v1/families/me/pickup-spots` | 201 | {"spotId": 25, "isDefault": true} |
| SPOT-02 | POST | `/v1/families/me/pickup-spots` | 201 | {"spotId": 26, "isDefault": false} |
| SPOT-01 | GET | `/v1/families/me/pickup-spots` | 200 | {"academies": [{"academyId": 12, "academyName": "테스트수학학원", "spots": [{"spotId": 25, "name": "테스트 정문 앞", "stopP… |
| SPOT-03 | PATCH | `/v1/pickup-spots/26` | 200 | {"spotId": 26, "name": "테스트 후문", "stopPoint": {"lat": 37.4993, "lng": 127.0602}, "meetingPoint": {"lat": 37.49… |
| SET-03 | PUT | `/v1/schedules/14` | 200 | {"scheduleId": 14, "academyId": 12, "status": "READY"} |
| SET-07 | GET | `/v1/children/31/setup-summary` | 200 | {"child": {"userId": 31, "name": "테스트자녀2", "deviceStatus": "CONNECTED"}, "schedules": [{"scheduleId": 14, "aca… |
| SET-08 | POST | `/v1/children/31/setup-completion` | 200 | {"syncedToVehicle": true} |
| OUT-04 | PUT | `/v1/guardians/me/data-settings` | 200 | {"learningConsent": false, "retentionDays": 90} |
| SET-09 | GET | `/v1/vehicles/me/weekly-pickups` | 200 | {"weekStart": "2026-11-09", "days": [{"date": "2026-11-09", "pickups": [{"scheduleId": 14, "childName": "테스트자녀… |
| SET-10 | GET | `/v1/vehicles/me/settings-summary` | 200 | {"guardianNameMasked": "테****자", "children": [{"userId": 31, "name": "테스트자녀2"}], "joinCallMode": "AUTO"} |
| SPOT-01 | GET | `/v1/families/me/pickup-spots` | 200 | {"academies": [{"academyId": 12, "academyName": "테스트수학학원", "spots": [{"spotId": 25, "name": "테스트 정문 앞", "stopP… |
| SES-02 | POST | `/v1/pickup-sessions` | 201 | {"sessionId": 17, "stateVersion": 0, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SES-01 | GET | `/v1/pickup-sessions/active` | 200 | {"sessionId": 17, "status": "ACTIVE", "stateVersion": 0} |
| SES-03 | GET | `/v1/pickup-sessions/17` | 200 | {"sessionId": 17, "stateVersion": 0, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SES-04 | PUT | `/v1/pickup-sessions/17/route` | 200 | {"sessionId": 17, "stateVersion": 1, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SES-08 | GET | `/v1/pickup-sessions/17/stream` | 200 | {"_contentType": "text/event-stream"} |
| SIG-01 | POST | `/v1/pickup-sessions/17/vehicle-telemetry` | 202 |  |
| SES-03 | GET | `/v1/pickup-sessions/17` | 200 | {"sessionId": 17, "stateVersion": 1, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| CALL-01 | PUT | `/v1/pickup-sessions/17/call-hold` | 200 | {"sessionId": 17, "stateVersion": 2, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| CALL-01 DEL | DELETE | `/v1/pickup-sessions/17/call-hold` | 200 | {"sessionId": 17, "stateVersion": 3, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SES-03 | GET | `/v1/pickup-sessions/17` | 200 | {"sessionId": 17, "stateVersion": 3, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SES-05 | POST | `/v1/pickup-sessions/17/spot-changes` | 200 | {"sessionId": 17, "stateVersion": 4, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SES-03 | GET | `/v1/pickup-sessions/17` | 200 | {"sessionId": 17, "stateVersion": 4, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SES-04 | PUT | `/v1/pickup-sessions/17/route` | 200 | {"sessionId": 17, "stateVersion": 5, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SET-06 | PUT | `/v1/families/me/call-mode` | 200 | {"joinCallMode": "GUARDIAN_CONFIRM", "settingsVersion": 2} |
| SIG-01 | POST | `/v1/pickup-sessions/17/vehicle-telemetry` | 202 |  |
| SES-03 | GET | `/v1/pickup-sessions/17` | 200 | {"sessionId": 17, "stateVersion": 5, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SET-06 | PUT | `/v1/families/me/call-mode` | 200 | {"joinCallMode": "GUARDIAN_CONFIRM", "settingsVersion": 3} |
| SES-03 | GET | `/v1/pickup-sessions/17` | 200 | {"sessionId": 17, "stateVersion": 5, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| CALL-02 | POST | `/v1/pickup-sessions/17/calls` | 201 | {"callId": 10, "status": "ACCEPTED"} |
| SES-03 | GET | `/v1/pickup-sessions/17` | 200 | {"sessionId": 17, "stateVersion": 5, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "ACCEPTED",… |
| CALL-04 | POST | `/v1/calls/10/acknowledgement` | 200 | {"callId": 10, "status": "ACKNOWLEDGED", "acknowledgedAt": "2026-11-11T23:34:46+09:00"} |
| SIG-04 | POST | `/v1/pickup-sessions/17/child-locations` | 202 |  |
| SES-03 | GET | `/v1/pickup-sessions/17` | 200 | {"sessionId": 17, "stateVersion": 6, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "ACKNOWLEDG… |
| SES-06 | PUT | `/v1/pickup-sessions/17/hold` | 200 | {"sessionId": 17, "stateVersion": 7, "status": {"session": "ON_HOLD", "vehicle": "ROUTING", "call": "ACKNOWLED… |
| SES-03 | GET | `/v1/pickup-sessions/17` | 200 | {"sessionId": 17, "stateVersion": 7, "status": {"session": "ON_HOLD", "vehicle": "ROUTING", "call": "ACKNOWLED… |
| SES-06 DEL | DELETE | `/v1/pickup-sessions/17/hold` | 200 | {"sessionId": 17, "stateVersion": 8, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "ACKNOWLEDG… |
| SIG-05 | POST | `/v1/pickup-sessions/17/help-requests` | 201 | {"nextAllowedAt": "2026-11-11T23:35:48+09:00"} |
| SIG-02 | POST | `/v1/pickup-sessions/17/vehicle-events` | 202 |  |
| SIG-02 | POST | `/v1/pickup-sessions/17/vehicle-events` | 202 |  |
| SES-03 | GET | `/v1/pickup-sessions/17` | 200 | {"sessionId": 17, "stateVersion": 10, "status": {"session": "ACTIVE", "vehicle": "STOPPED", "call": "ACKNOWLED… |
| SES-12 | POST | `/v1/pickup-sessions/17/boarding-rejection` | 200 | {"sessionId": 17, "stateVersion": 11, "status": {"session": "ACTIVE", "vehicle": "STOPPED", "call": "ACKNOWLED… |
| SES-03 | GET | `/v1/pickup-sessions/17` | 200 | {"sessionId": 17, "stateVersion": 11, "status": {"session": "ACTIVE", "vehicle": "STOPPED", "call": "ACKNOWLED… |
| SES-13 | PUT | `/v1/pickup-sessions/17/incident` | 200 | {"sessionId": 17, "stateVersion": 12, "status": {"session": "ON_HOLD", "vehicle": "STOPPED", "call": "ACKNOWLE… |
| SES-09 | GET | `/v1/pickup-sessions/17/events` | 200 | {"items": [{"eventId": 130, "seq": 1, "type": "SESSION_STARTED", "stateVersion": 0, "occurredAt": "2026-11-11T… |
| SES-10 | GET | `/v1/pickup-sessions/17/contacts` | 200 | {"items": [{"name": "테스트수학학원", "role": "ACADEMY", "phone": null}]} |
| NOTI-02 | GET | `/v1/pickup-sessions/17/notifications` | 200 | {"items": [{"notificationId": 68, "type": "SESSION_STARTED", "receiverName": "테스트보호자", "title": "픽업 시작", "sent… |
| NOTI-01 | POST | `/v1/notifications/68/delivery-receipt` | 204 |  |
| NOTI-03 | POST | `/v1/notifications/68/resend` | 429 | RESEND_TOO_SOON: 잠시 뒤에 다시 보내 주세요 |
| SES-03 | GET | `/v1/pickup-sessions/17` | 200 | {"sessionId": 17, "stateVersion": 12, "status": {"session": "ON_HOLD", "vehicle": "STOPPED", "call": "ACKNOWLE… |
| SES-11 | POST | `/v1/pickup-sessions/17/completion` | 200 | {"sessionId": 17, "stateVersion": 13, "status": {"session": "COMPLETED", "vehicle": "STOPPED", "call": "ACKNOW… |
| OUT-02 | GET | `/v1/pickup-sessions/17/outcome` | 200 | {"sessionId": 17, "completedAt": "2026-11-11T23:34:52+09:00", "spotName": "테스트 후문", "boardingMethod": "MANUAL"… |
| OUT-03 | PUT | `/v1/pickup-sessions/17/outcome/correction` | 200 | {"sessionId": 17, "completedAt": "2026-11-11T23:34:52+09:00", "spotName": "테스트 후문", "boardingMethod": "MANUAL"… |
| OUT-01 | GET | `/v1/children/31/pickup-history` | 200 | {"items": [{"date": "2026-11-11", "sessionId": 17, "status": "COMPLETED", "completedAt": "2026-11-11T23:34:52+… |
| SES-02 | POST | `/v1/pickup-sessions` | 201 | {"sessionId": 18, "stateVersion": 0, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SES-04 | PUT | `/v1/pickup-sessions/18/route` | 200 | {"sessionId": 18, "stateVersion": 1, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SIG-01 | POST | `/v1/pickup-sessions/18/vehicle-telemetry` | 202 |  |
| SES-03 | GET | `/v1/pickup-sessions/18` | 200 | {"sessionId": 18, "stateVersion": 1, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| CALL-02 | POST | `/v1/pickup-sessions/18/calls` | 201 | {"callId": 11, "status": "ACCEPTED"} |
| SES-03 | GET | `/v1/pickup-sessions/18` | 200 | {"sessionId": 18, "stateVersion": 1, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "ACCEPTED",… |
| CALL-03 | POST | `/v1/calls/11/revocation` | 200 | {"sessionId": 18, "stateVersion": 2, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "REVOKED", … |
| SES-07 | POST | `/v1/pickup-sessions/18/cancellation` | 200 | {"sessionId": 18, "stateVersion": 3, "status": {"session": "CANCELLED", "vehicle": "ROUTING", "call": "REVOKED… |
| SES-02 | POST | `/v1/pickup-sessions` | 201 | {"sessionId": 19, "stateVersion": 0, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SIG-03 | POST | `/v1/pickup-sessions/19/prep-time-extensions` | 200 | {"extraPrepMinutes": 5, "callNotBefore": "2026-11-11T23:39:56+09:00"} |
| SES-03 | GET | `/v1/pickup-sessions/19` | 200 | {"sessionId": 19, "stateVersion": 1, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SES-07 | POST | `/v1/pickup-sessions/19/cancellation` | 200 | {"sessionId": 19, "stateVersion": 2, "status": {"session": "CANCELLED", "vehicle": "ROUTING", "call": "NONE", … |
| SPOT-03 DEL | DELETE | `/v1/pickup-spots/26` | 204 |  |
| FAM-07 | DELETE | `/v1/families/me/members/31` | 204 |  |
| AUTH-04 | DELETE | `/v1/vehicle-devices/me/session` | 204 |  |
| LINK-05 | DELETE | `/v1/vehicle-links/18` | 204 |  |
