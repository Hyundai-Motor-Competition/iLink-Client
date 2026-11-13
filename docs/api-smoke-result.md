# Swagger API 점검 결과

서버: https://ilink-api-dev.chisanw.com  
실행: 2026-11-13 21:56 KST  
성공 92 / 호출 93 · API 62개 중 61개 정상 응답

| Swagger ID | 메서드 | 경로 | 상태 | 응답 요약 |
|---|---|---|---|---|
| AUTH-02 | POST | `/v1/vehicle-devices` | 201 | {"deviceId": 60, "vehicleId": 25, "deviceToken": "***"} |
| LINK-01 | POST | `/v1/vehicle-link-codes` | 201 | {"codeId": 26, "code": "D6GVAP8Q", "qrPayload": "pickup://link?code=D6GVAP8Q", "expiresAt": "2026-11-13T22:00:… |
| LINK-03 | GET | `/v1/vehicle-link-codes/by-code/D6GVAP8Q` | 200 | {"status": "NEW", "vehicleModel": "PLEOS_CONNECT_TEST", "plateNumberMasked": null, "expiresAt": "2026-11-13T22… |
| LINK-02 | GET | `/v1/vehicle-link-codes/26/status` | 200 | {"status": "WAITING", "vehicleId": null, "familyId": null, "accessToken": null, "refreshToken": null, "pollAft… |
| LINK-04 | POST | `/v1/vehicle-links` | 201 | {"vehicleId": 25, "familyId": 21, "userId": 42, "accessToken": "***", "refreshToken": "***"} |
| LINK-02 | GET | `/v1/vehicle-link-codes/26/status` | 200 | {"status": "LINKED", "vehicleId": 25, "familyId": 21, "accessToken": "***", "refreshToken": "***", "pollAfterS… |
| AUTH-01 | POST | `/v1/auth/refresh` | 200 | {"accessToken": "***", "refreshToken": "***", "accessTokenExpiresAt": "***"} |
| AUTH-03 | PUT | `/v1/devices/me/push-token` | 204 |  |
| FAM-01 | GET | `/v1/families/me` | 200 | {"familyId": 21, "joinCallMode": "AUTO", "vehicle": {"vehicleId": 25, "model": "PLEOS_CONNECT_TEST", "plateNum… |
| FAM-02 | POST | `/v1/families/me/members` | 201 | {"userId": 43} |
| FAM-03 | PATCH | `/v1/families/me/members/43` | 200 | {"userId": 43, "role": "CHILD", "name": "테스트자녀2", "phone": "+821000000000", "deviceStatus": "NONE"} |
| FAM-04 | POST | `/v1/families/me/members/43/invites` | 201 | {"inviteUrl": "https://app.example/invite/isTkjyVs-R1MamK9PS8im5_U6zZOtCXlNa3BwnWGKIc", "expiresAt": "2026-11-… |
| FAM-05 | GET | `/v1/invites/{token}` | 200 | {"inviterName": "테스트보호자", "memberName": "테스트자녀2", "role": "CHILD", "requiredConsents": ["TERMS", "PRIVACY", "L… |
| FAM-06 | POST | `/v1/invites/{token}/acceptance` | 201 | {"userId": 43, "familyId": 21, "role": "CHILD", "accessToken": "***", "refreshToken": "***"} |
| SET-01 | GET | `/v1/places/academies` | 200 | {"items": [{"externalPlaceId": "kakao:297826918", "name": "돌파수학학원", "address": "서울 강남구 역삼로 416", "location": {… |
| SET-02 | POST | `/v1/children/43/schedules` | 201 | {"scheduleId": 20, "academyId": 14, "status": "READY"} |
| SET-04 | GET | `/v1/children/43/schedules` | 200 | {"items": [{"scheduleId": 20, "academy": {"academyId": 14, "name": "돌파수학학원"}, "weekdays": ["MON", "TUE", "WED"… |
| SET-03 | PUT | `/v1/schedules/20` | 200 | {"scheduleId": 20, "academyId": 14, "status": "READY"} |
| SET-06 | PUT | `/v1/families/me/call-mode` | 200 | {"joinCallMode": "AUTO", "settingsVersion": 1} |
| SET-11 | PUT | `/v1/families/me/child-location` | 200 | {"childLocationEnabled": true, "settingsVersion": 2} |
| SPOT-02 | POST | `/v1/families/me/pickup-spots` | 201 | {"spotId": 33, "isDefault": true} |
| SPOT-02 | POST | `/v1/families/me/pickup-spots` | 201 | {"spotId": 34, "isDefault": false} |
| SPOT-01 | GET | `/v1/families/me/pickup-spots` | 200 | {"academies": [{"academyId": 14, "academyName": "돌파수학학원", "spots": [{"spotId": 33, "name": "테스트 정문 앞", "stopPo… |
| SPOT-03 | PATCH | `/v1/pickup-spots/34` | 200 | {"spotId": 34, "name": "테스트 후문", "stopPoint": {"lat": 37.500763865044256, "lng": 127.05260544255009}, "meeting… |
| SET-03 | PUT | `/v1/schedules/20` | 200 | {"scheduleId": 20, "academyId": 14, "status": "READY"} |
| SET-07 | GET | `/v1/children/43/setup-summary` | 200 | {"child": {"userId": 43, "name": "테스트자녀2", "deviceStatus": "CONNECTED"}, "schedules": [{"scheduleId": 20, "aca… |
| SET-08 | POST | `/v1/children/43/setup-completion` | 200 | {"syncedToVehicle": true} |
| OUT-04 | PUT | `/v1/guardians/me/data-settings` | 200 | {"learningConsent": false, "retentionDays": 90} |
| SET-09 | GET | `/v1/vehicles/me/weekly-pickups` | 200 | {"weekStart": "2026-11-09", "days": [{"date": "2026-11-09", "pickups": [{"scheduleId": 20, "childName": "테스트자녀… |
| SET-10 | GET | `/v1/vehicles/me/settings-summary` | 200 | {"guardianNameMasked": "테****자", "children": [{"userId": 43, "name": "테스트자녀2"}], "joinCallMode": "AUTO"} |
| SPOT-01 | GET | `/v1/families/me/pickup-spots` | 200 | {"academies": [{"academyId": 14, "academyName": "돌파수학학원", "spots": [{"spotId": 33, "name": "테스트 정문 앞", "stopPo… |
| SPOT-04 | GET | `/v1/pickup-spot-recommendations` | 200 | {"supported": true, "items": [{"rank": 1, "kind": "CURB_STOP", "name": "선릉로76길", "location": {"lat": 37.501879… |
| SPOT-04 | GET | `/v1/pickup-spot-recommendations` | 200 | {"supported": true, "items": [{"rank": 1, "kind": "CURB_STOP", "name": "선릉로76길", "location": {"lat": 37.501879… |
| SES-02 | POST | `/v1/pickup-sessions` | 201 | {"sessionId": 27, "stateVersion": 0, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SES-01 | GET | `/v1/pickup-sessions/active` | 200 | {"sessionId": 27, "status": "ACTIVE", "stateVersion": 0} |
| SES-03 | GET | `/v1/pickup-sessions/27` | 200 | {"sessionId": 27, "stateVersion": 0, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SES-04 | PUT | `/v1/pickup-sessions/27/route` | 200 | {"sessionId": 27, "stateVersion": 1, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SES-08 | GET | `/v1/pickup-sessions/27/stream` | 200 | {"_contentType": "text/event-stream"} |
| SIG-01 | POST | `/v1/pickup-sessions/27/vehicle-telemetry` | 202 |  |
| SES-03 | GET | `/v1/pickup-sessions/27` | 200 | {"sessionId": 27, "stateVersion": 1, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| CALL-01 | PUT | `/v1/pickup-sessions/27/call-hold` | 200 | {"sessionId": 27, "stateVersion": 2, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| CALL-01 DEL | DELETE | `/v1/pickup-sessions/27/call-hold` | 200 | {"sessionId": 27, "stateVersion": 3, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SES-03 | GET | `/v1/pickup-sessions/27` | 200 | {"sessionId": 27, "stateVersion": 3, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SES-05 | POST | `/v1/pickup-sessions/27/spot-changes` | 200 | {"sessionId": 27, "stateVersion": 4, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SES-03 | GET | `/v1/pickup-sessions/27` | 200 | {"sessionId": 27, "stateVersion": 4, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SES-04 | PUT | `/v1/pickup-sessions/27/route` | 200 | {"sessionId": 27, "stateVersion": 5, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SET-06 | PUT | `/v1/families/me/call-mode` | 200 | {"joinCallMode": "GUARDIAN_CONFIRM", "settingsVersion": 3} |
| SIG-01 | POST | `/v1/pickup-sessions/27/vehicle-telemetry` | 202 |  |
| SIG-02 | POST | `/v1/pickup-sessions/27/vehicle-events` | 202 |  |
| SES-03 | GET | `/v1/pickup-sessions/27` | 200 | {"sessionId": 27, "stateVersion": 7, "status": {"session": "ACTIVE", "vehicle": "STOPPED", "call": "NONE", "sp… |
| SET-06 | PUT | `/v1/families/me/call-mode` | 200 | {"joinCallMode": "GUARDIAN_CONFIRM", "settingsVersion": 4} |
| SES-03 | GET | `/v1/pickup-sessions/27` | 200 | {"sessionId": 27, "stateVersion": 7, "status": {"session": "ACTIVE", "vehicle": "STOPPED", "call": "NONE", "sp… |
| CALL-02 | POST | `/v1/pickup-sessions/27/calls` | 201 | {"callId": 14, "status": "ACCEPTED"} |
| SES-03 | GET | `/v1/pickup-sessions/27` | 200 | {"sessionId": 27, "stateVersion": 7, "status": {"session": "ACTIVE", "vehicle": "STOPPED", "call": "ACCEPTED",… |
| CALL-04 | POST | `/v1/calls/14/acknowledgement` | 200 | {"callId": 14, "status": "ACKNOWLEDGED", "acknowledgedAt": "2026-11-13T21:55:57+09:00"} |
| SIG-04 | POST | `/v1/pickup-sessions/27/child-locations` | 202 |  |
| SES-03 | GET | `/v1/pickup-sessions/27` | 200 | {"sessionId": 27, "stateVersion": 8, "status": {"session": "ACTIVE", "vehicle": "STOPPED", "call": "ACKNOWLEDG… |
| SES-06 | PUT | `/v1/pickup-sessions/27/hold` | 200 | {"sessionId": 27, "stateVersion": 9, "status": {"session": "ON_HOLD", "vehicle": "STOPPED", "call": "ACKNOWLED… |
| SES-03 | GET | `/v1/pickup-sessions/27` | 200 | {"sessionId": 27, "stateVersion": 9, "status": {"session": "ON_HOLD", "vehicle": "STOPPED", "call": "ACKNOWLED… |
| SES-06 DEL | DELETE | `/v1/pickup-sessions/27/hold` | 200 | {"sessionId": 27, "stateVersion": 10, "status": {"session": "ACTIVE", "vehicle": "STOPPED", "call": "ACKNOWLED… |
| SIG-05 | POST | `/v1/pickup-sessions/27/help-requests` | 201 | {"nextAllowedAt": "2026-11-13T21:56:59+09:00"} |
| SIG-02 | POST | `/v1/pickup-sessions/27/vehicle-events` | 202 |  |
| SES-03 | GET | `/v1/pickup-sessions/27` | 200 | {"sessionId": 27, "stateVersion": 11, "status": {"session": "ACTIVE", "vehicle": "STOPPED", "call": "ACKNOWLED… |
| SES-12 | POST | `/v1/pickup-sessions/27/boarding-rejection` | 200 | {"sessionId": 27, "stateVersion": 12, "status": {"session": "ACTIVE", "vehicle": "STOPPED", "call": "ACKNOWLED… |
| SES-03 | GET | `/v1/pickup-sessions/27` | 200 | {"sessionId": 27, "stateVersion": 12, "status": {"session": "ACTIVE", "vehicle": "STOPPED", "call": "ACKNOWLED… |
| SES-13 | PUT | `/v1/pickup-sessions/27/incident` | 200 | {"sessionId": 27, "stateVersion": 13, "status": {"session": "ON_HOLD", "vehicle": "STOPPED", "call": "ACKNOWLE… |
| SES-09 | GET | `/v1/pickup-sessions/27/events` | 200 | {"items": [{"eventId": 221, "seq": 1, "type": "SESSION_STARTED", "stateVersion": 0, "occurredAt": "2026-11-13T… |
| SES-10 | GET | `/v1/pickup-sessions/27/contacts` | 200 | {"items": [{"name": "돌파수학학원", "role": "ACADEMY", "phone": null}]} |
| NOTI-02 | GET | `/v1/pickup-sessions/27/notifications` | 200 | {"items": [{"notificationId": 114, "type": "SESSION_STARTED", "receiverName": "테스트보호자", "title": "픽업 시작", "sen… |
| NOTI-01 | POST | `/v1/notifications/114/delivery-receipt` | 204 |  |
| NOTI-03 | POST | `/v1/notifications/114/resend` | 429 | RESEND_TOO_SOON: 잠시 뒤에 다시 보내 주세요 |
| SES-03 | GET | `/v1/pickup-sessions/27` | 200 | {"sessionId": 27, "stateVersion": 13, "status": {"session": "ON_HOLD", "vehicle": "STOPPED", "call": "ACKNOWLE… |
| SES-11 | POST | `/v1/pickup-sessions/27/completion` | 200 | {"sessionId": 27, "stateVersion": 14, "status": {"session": "COMPLETED", "vehicle": "STOPPED", "call": "ACKNOW… |
| OUT-02 | GET | `/v1/pickup-sessions/27/outcome` | 200 | {"sessionId": 27, "completedAt": "2026-11-13T21:56:03+09:00", "spotName": "테스트 후문", "boardingMethod": "MANUAL"… |
| OUT-03 | PUT | `/v1/pickup-sessions/27/outcome/correction` | 200 | {"sessionId": 27, "completedAt": "2026-11-13T21:56:03+09:00", "spotName": "테스트 후문", "boardingMethod": "MANUAL"… |
| OUT-01 | GET | `/v1/children/43/pickup-history` | 200 | {"items": [{"date": "2026-11-13", "sessionId": 27, "status": "COMPLETED", "completedAt": "2026-11-13T21:56:03+… |
| SES-02 | POST | `/v1/pickup-sessions` | 201 | {"sessionId": 28, "stateVersion": 0, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SES-04 | PUT | `/v1/pickup-sessions/28/route` | 200 | {"sessionId": 28, "stateVersion": 1, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SIG-01 | POST | `/v1/pickup-sessions/28/vehicle-telemetry` | 202 |  |
| SIG-02 | POST | `/v1/pickup-sessions/28/vehicle-events` | 202 |  |
| SES-03 | GET | `/v1/pickup-sessions/28` | 200 | {"sessionId": 28, "stateVersion": 3, "status": {"session": "ACTIVE", "vehicle": "STOPPED", "call": "NONE", "sp… |
| CALL-02 | POST | `/v1/pickup-sessions/28/calls` | 201 | {"callId": 15, "status": "ACCEPTED"} |
| SES-03 | GET | `/v1/pickup-sessions/28` | 200 | {"sessionId": 28, "stateVersion": 3, "status": {"session": "ACTIVE", "vehicle": "STOPPED", "call": "ACCEPTED",… |
| CALL-03 | POST | `/v1/calls/15/revocation` | 200 | {"sessionId": 28, "stateVersion": 4, "status": {"session": "ACTIVE", "vehicle": "STOPPED", "call": "REVOKED", … |
| SES-07 | POST | `/v1/pickup-sessions/28/cancellation` | 200 | {"sessionId": 28, "stateVersion": 5, "status": {"session": "CANCELLED", "vehicle": "STOPPED", "call": "REVOKED… |
| SES-02 | POST | `/v1/pickup-sessions` | 201 | {"sessionId": 29, "stateVersion": 0, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SIG-03 | POST | `/v1/pickup-sessions/29/prep-time-extensions` | 200 | {"extraPrepMinutes": 5, "callNotBefore": "2026-11-13T22:01:07+09:00"} |
| SES-03 | GET | `/v1/pickup-sessions/29` | 200 | {"sessionId": 29, "stateVersion": 1, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SES-07 | POST | `/v1/pickup-sessions/29/cancellation` | 200 | {"sessionId": 29, "stateVersion": 2, "status": {"session": "CANCELLED", "vehicle": "ROUTING", "call": "NONE", … |
| SPOT-03 DEL | DELETE | `/v1/pickup-spots/34` | 204 |  |
| FAM-07 | DELETE | `/v1/families/me/members/43` | 204 |  |
| AUTH-04 | DELETE | `/v1/vehicle-devices/me/session` | 204 |  |
| LINK-05 | DELETE | `/v1/vehicle-links/25` | 204 |  |
