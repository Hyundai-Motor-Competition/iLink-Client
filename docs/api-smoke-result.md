# Swagger API 점검 결과

서버: https://ilink-api-dev.chisanw.com  
실행: 2026-11-14 11:13 KST  
성공 104 / 호출 104 · API 65개 중 65개 정상 응답

| Swagger ID | 메서드 | 경로 | 상태 | 응답 요약 |
|---|---|---|---|---|
| AUTH-02 | POST | `/v1/vehicle-devices` | 201 | {"deviceId": 69, "vehicleId": 28, "deviceToken": "***"} |
| LINK-01 | POST | `/v1/vehicle-link-codes` | 201 | {"codeId": 29, "code": "WSJCVTIL", "qrPayload": "pickup://link?code=WSJCVTIL", "expiresAt": "2026-11-14T11:17:… |
| LINK-03 | GET | `/v1/vehicle-link-codes/by-code/WSJCVTIL` | 200 | {"status": "NEW", "vehicleModel": "PLEOS_CONNECT_TEST", "plateNumberMasked": null, "expiresAt": "2026-11-14T11… |
| LINK-02 | GET | `/v1/vehicle-link-codes/29/status` | 200 | {"status": "WAITING", "vehicleId": null, "familyId": null, "accessToken": null, "refreshToken": null, "pollAft… |
| LINK-04 | POST | `/v1/vehicle-links` | 201 | {"vehicleId": 28, "familyId": 24, "userId": 48, "accessToken": "***", "refreshToken": "***"} |
| LINK-02 | GET | `/v1/vehicle-link-codes/29/status` | 200 | {"status": "LINKED", "vehicleId": 28, "familyId": 24, "accessToken": "***", "refreshToken": "***", "pollAfterS… |
| AUTH-01 | POST | `/v1/auth/refresh` | 200 | {"accessToken": "***", "refreshToken": "***", "accessTokenExpiresAt": "***"} |
| AUTH-03 | PUT | `/v1/devices/me/push-token` | 204 |  |
| FAM-01 | GET | `/v1/families/me` | 200 | {"familyId": 24, "joinCallMode": "AUTO", "vehicle": {"vehicleId": 28, "model": "PLEOS_CONNECT_TEST", "plateNum… |
| FAM-02 | POST | `/v1/families/me/members` | 201 | {"userId": 49} |
| FAM-03 | PATCH | `/v1/families/me/members/49` | 200 | {"userId": 49, "role": "CHILD", "name": "테스트자녀2", "phone": "+821000000000", "grade": null, "deviceStatus": "NO… |
| FAM-04 | POST | `/v1/families/me/members/49/invites` | 201 | {"inviteUrl": "https://app.example/invite/aTWQhX4Fk0DUzHI4n3i3EroV_de9Ab1KpPohiNO0nH4", "expiresAt": "2026-11-… |
| FAM-05 | GET | `/v1/invites/{token}` | 200 | {"inviterName": "테스트보호자", "memberName": "테스트자녀2", "role": "CHILD", "requiredConsents": ["TERMS", "PRIVACY", "L… |
| FAM-06 | POST | `/v1/invites/{token}/acceptance` | 201 | {"userId": 49, "familyId": 24, "role": "CHILD", "accessToken": "***", "refreshToken": "***"} |
| SET-01 | GET | `/v1/places/academies` | 200 | {"items": [{"externalPlaceId": "kakao:297826918", "name": "돌파수학학원", "address": "서울 강남구 역삼로 416", "location": {… |
| SET-02 | POST | `/v1/children/49/schedules` | 201 | {"scheduleId": 23, "academyId": 26, "status": "READY"} |
| SET-04 | GET | `/v1/children/49/schedules` | 200 | {"items": [{"scheduleId": 23, "academy": {"academyId": 26, "name": "돌파수학학원"}, "weekdays": ["MON", "TUE", "WED"… |
| SET-03 | PUT | `/v1/schedules/23` | 200 | {"scheduleId": 23, "academyId": 26, "status": "READY"} |
| SET-06 | PUT | `/v1/families/me/call-mode` | 200 | {"joinCallMode": "AUTO", "settingsVersion": 1} |
| SET-11 | PUT | `/v1/families/me/child-location` | 200 | {"childLocationEnabled": true, "settingsVersion": 2} |
| SPOT-02 | POST | `/v1/families/me/pickup-spots` | 201 | {"spotId": 39, "isDefault": true} |
| SPOT-02 | POST | `/v1/families/me/pickup-spots` | 201 | {"spotId": 40, "isDefault": false} |
| SPOT-01 | GET | `/v1/families/me/pickup-spots` | 200 | {"academies": [{"academyId": 26, "academyName": "돌파수학학원", "spots": [{"spotId": 39, "name": "테스트 정문 앞", "stopPo… |
| SPOT-03 | PATCH | `/v1/pickup-spots/40` | 200 | {"spotId": 40, "name": "테스트 후문", "stopPoint": {"lat": 37.500763865044256, "lng": 127.05260544255009}, "meeting… |
| SET-03 | PUT | `/v1/schedules/23` | 200 | {"scheduleId": 23, "academyId": 26, "status": "READY"} |
| SET-07 | GET | `/v1/children/49/setup-summary` | 200 | {"child": {"userId": 49, "name": "테스트자녀2", "deviceStatus": "CONNECTED"}, "schedules": [{"scheduleId": 23, "aca… |
| SET-08 | POST | `/v1/children/49/setup-completion` | 200 | {"syncedToVehicle": true} |
| OUT-04 | PUT | `/v1/guardians/me/data-settings` | 200 | {"learningConsent": false, "retentionDays": 90} |
| SET-09 | GET | `/v1/vehicles/me/weekly-pickups` | 200 | {"weekStart": "2026-11-09", "days": [{"date": "2026-11-09", "pickups": [{"scheduleId": 23, "childName": "테스트자녀… |
| SET-10 | GET | `/v1/vehicles/me/settings-summary` | 200 | {"guardianNameMasked": "테****자", "children": [{"userId": 49, "name": "테스트자녀2"}], "joinCallMode": "AUTO"} |
| SPOT-01 | GET | `/v1/families/me/pickup-spots` | 200 | {"academies": [{"academyId": 26, "academyName": "돌파수학학원", "spots": [{"spotId": 39, "name": "테스트 정문 앞", "stopPo… |
| SPOT-04 | GET | `/v1/pickup-spot-recommendations` | 200 | {"supported": true, "items": [{"rank": 1, "kind": "CURB_STOP", "name": "선릉로76길", "location": {"lat": 37.501879… |
| SPOT-04 | GET | `/v1/pickup-spot-recommendations` | 200 | {"supported": true, "items": [{"rank": 1, "kind": "CURB_STOP", "name": "선릉로76길", "location": {"lat": 37.501879… |
| SPOT-05 | GET | `/v1/pickup-spot-recommendations/nearby` | 200 | {"supported": true, "items": [{"name": "선릉로76길", "location": {"lat": 37.501879, "lng": 127.052562}, "walkMeter… |
| SPOT-05 | GET | `/v1/pickup-spot-recommendations/nearby` | 200 | {"supported": true, "items": [{"name": "선릉로76길", "location": {"lat": 37.501879, "lng": 127.052562}, "walkMeter… |
| SET-13 | GET | `/v1/families/me/today-pickups` | 200 | {"items": [{"scheduleId": 23, "childName": "테스트자녀2", "academyName": "돌파수학학원", "targetAt": "2026-11-14T18:20:00… |
| SET-12 | GET | `/v1/children/me/next-pickup` | 200 | {"academyName": "돌파수학학원", "spotName": "테스트 정문 앞", "targetAt": "2026-11-14T18:20:00+09:00"} |
| SES-02 | POST | `/v1/pickup-sessions` | 201 | {"sessionId": 34, "stateVersion": 0, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SES-01 | GET | `/v1/pickup-sessions/active` | 200 | {"sessionId": 34, "status": "ACTIVE", "stateVersion": 0} |
| SES-03 | GET | `/v1/pickup-sessions/34` | 200 | {"sessionId": 34, "stateVersion": 0, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SES-04 | PUT | `/v1/pickup-sessions/34/route` | 200 | {"sessionId": 34, "stateVersion": 1, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SES-08 | GET | `/v1/pickup-sessions/34/stream` | 200 | {"_contentType": "text/event-stream"} |
| SIG-01 | POST | `/v1/pickup-sessions/34/vehicle-telemetry` | 202 |  |
| SES-03 | GET | `/v1/pickup-sessions/34` | 200 | {"sessionId": 34, "stateVersion": 1, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| CALL-01 | PUT | `/v1/pickup-sessions/34/call-hold` | 200 | {"sessionId": 34, "stateVersion": 2, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| CALL-01 DEL | DELETE | `/v1/pickup-sessions/34/call-hold` | 200 | {"sessionId": 34, "stateVersion": 3, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SES-03 | GET | `/v1/pickup-sessions/34` | 200 | {"sessionId": 34, "stateVersion": 3, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SES-05 | POST | `/v1/pickup-sessions/34/spot-changes` | 200 | {"sessionId": 34, "stateVersion": 4, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SES-03 | GET | `/v1/pickup-sessions/34` | 200 | {"sessionId": 34, "stateVersion": 4, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SES-04 | PUT | `/v1/pickup-sessions/34/route` | 200 | {"sessionId": 34, "stateVersion": 5, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SET-06 | PUT | `/v1/families/me/call-mode` | 200 | {"joinCallMode": "GUARDIAN_CONFIRM", "settingsVersion": 3} |
| SIG-01 | POST | `/v1/pickup-sessions/34/vehicle-telemetry` | 202 |  |
| SIG-02 | POST | `/v1/pickup-sessions/34/vehicle-events` | 202 |  |
| SES-03 | GET | `/v1/pickup-sessions/34` | 200 | {"sessionId": 34, "stateVersion": 7, "status": {"session": "ACTIVE", "vehicle": "STOPPED", "call": "NONE", "sp… |
| SET-06 | PUT | `/v1/families/me/call-mode` | 200 | {"joinCallMode": "GUARDIAN_CONFIRM", "settingsVersion": 4} |
| SES-03 | GET | `/v1/pickup-sessions/34` | 200 | {"sessionId": 34, "stateVersion": 7, "status": {"session": "ACTIVE", "vehicle": "STOPPED", "call": "NONE", "sp… |
| CALL-02 | POST | `/v1/pickup-sessions/34/calls` | 201 | {"callId": 19, "status": "ACCEPTED"} |
| SES-03 | GET | `/v1/pickup-sessions/34` | 200 | {"sessionId": 34, "stateVersion": 7, "status": {"session": "ACTIVE", "vehicle": "STOPPED", "call": "ACCEPTED",… |
| CALL-04 | POST | `/v1/calls/19/acknowledgement` | 200 | {"callId": 19, "status": "ACKNOWLEDGED", "acknowledgedAt": "2026-11-14T11:12:59+09:00"} |
| SIG-04 | POST | `/v1/pickup-sessions/34/child-locations` | 202 |  |
| SES-03 | GET | `/v1/pickup-sessions/34` | 200 | {"sessionId": 34, "stateVersion": 8, "status": {"session": "ACTIVE", "vehicle": "STOPPED", "call": "ACKNOWLEDG… |
| SES-06 | PUT | `/v1/pickup-sessions/34/hold` | 200 | {"sessionId": 34, "stateVersion": 9, "status": {"session": "ON_HOLD", "vehicle": "STOPPED", "call": "ACKNOWLED… |
| SES-03 | GET | `/v1/pickup-sessions/34` | 200 | {"sessionId": 34, "stateVersion": 9, "status": {"session": "ON_HOLD", "vehicle": "STOPPED", "call": "ACKNOWLED… |
| SES-06 DEL | DELETE | `/v1/pickup-sessions/34/hold` | 200 | {"sessionId": 34, "stateVersion": 10, "status": {"session": "ACTIVE", "vehicle": "STOPPED", "call": "ACKNOWLED… |
| SIG-05 | POST | `/v1/pickup-sessions/34/help-requests` | 201 | {"nextAllowedAt": "2026-11-14T11:14:01+09:00"} |
| SIG-02 | POST | `/v1/pickup-sessions/34/vehicle-events` | 202 |  |
| SES-03 | GET | `/v1/pickup-sessions/34` | 200 | {"sessionId": 34, "stateVersion": 11, "status": {"session": "ACTIVE", "vehicle": "STOPPED", "call": "ACKNOWLED… |
| SES-12 | POST | `/v1/pickup-sessions/34/boarding-rejection` | 200 | {"sessionId": 34, "stateVersion": 12, "status": {"session": "ACTIVE", "vehicle": "STOPPED", "call": "ACKNOWLED… |
| SES-03 | GET | `/v1/pickup-sessions/34` | 200 | {"sessionId": 34, "stateVersion": 12, "status": {"session": "ACTIVE", "vehicle": "STOPPED", "call": "ACKNOWLED… |
| SES-13 | PUT | `/v1/pickup-sessions/34/incident` | 200 | {"sessionId": 34, "stateVersion": 13, "status": {"session": "ON_HOLD", "vehicle": "STOPPED", "call": "ACKNOWLE… |
| SES-09 | GET | `/v1/pickup-sessions/34/events` | 200 | {"items": [{"eventId": 289, "seq": 1, "type": "SESSION_STARTED", "stateVersion": 0, "occurredAt": "2026-11-14T… |
| SES-10 | GET | `/v1/pickup-sessions/34/contacts` | 200 | {"items": [{"name": "돌파수학학원", "role": "ACADEMY", "phone": null}]} |
| NOTI-02 | GET | `/v1/pickup-sessions/34/notifications` | 200 | {"items": [{"notificationId": 154, "type": "SESSION_STARTED", "receiverName": "테스트보호자", "title": "픽업 시작", "sen… |
| NOTI-01 | POST | `/v1/notifications/154/delivery-receipt` | 204 |  |
| NOTI-03 (기대 429) | POST | `/v1/notifications/154/resend` | 429 | RESEND_TOO_SOON: 잠시 뒤에 다시 보내 주세요 |
| SES-03 | GET | `/v1/pickup-sessions/34` | 200 | {"sessionId": 34, "stateVersion": 13, "status": {"session": "ON_HOLD", "vehicle": "STOPPED", "call": "ACKNOWLE… |
| SES-11 | POST | `/v1/pickup-sessions/34/completion` | 200 | {"sessionId": 34, "stateVersion": 14, "status": {"session": "COMPLETED", "vehicle": "STOPPED", "call": "ACKNOW… |
| OUT-02 | GET | `/v1/pickup-sessions/34/outcome` | 200 | {"sessionId": 34, "completedAt": "2026-11-14T11:13:05+09:00", "spotName": "테스트 후문", "boardingMethod": "MANUAL"… |
| OUT-03 | PUT | `/v1/pickup-sessions/34/outcome/correction` | 200 | {"sessionId": 34, "completedAt": "2026-11-14T11:13:05+09:00", "spotName": "테스트 후문", "boardingMethod": "MANUAL"… |
| OUT-01 | GET | `/v1/children/49/pickup-history` | 200 | {"items": [{"date": "2026-11-14", "sessionId": 34, "status": "COMPLETED", "completedAt": "2026-11-14T11:13:05+… |
| SES-02 | POST | `/v1/pickup-sessions` | 201 | {"sessionId": 35, "stateVersion": 0, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SES-04 | PUT | `/v1/pickup-sessions/35/route` | 200 | {"sessionId": 35, "stateVersion": 1, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SIG-01 | POST | `/v1/pickup-sessions/35/vehicle-telemetry` | 202 |  |
| SIG-02 | POST | `/v1/pickup-sessions/35/vehicle-events` | 202 |  |
| SES-03 | GET | `/v1/pickup-sessions/35` | 200 | {"sessionId": 35, "stateVersion": 3, "status": {"session": "ACTIVE", "vehicle": "STOPPED", "call": "NONE", "sp… |
| CALL-02 | POST | `/v1/pickup-sessions/35/calls` | 201 | {"callId": 20, "status": "ACCEPTED"} |
| SES-03 | GET | `/v1/pickup-sessions/35` | 200 | {"sessionId": 35, "stateVersion": 3, "status": {"session": "ACTIVE", "vehicle": "STOPPED", "call": "ACCEPTED",… |
| CALL-03 | POST | `/v1/calls/20/revocation` | 200 | {"sessionId": 35, "stateVersion": 4, "status": {"session": "ACTIVE", "vehicle": "STOPPED", "call": "REVOKED", … |
| SES-07 | POST | `/v1/pickup-sessions/35/cancellation` | 200 | {"sessionId": 35, "stateVersion": 5, "status": {"session": "CANCELLED", "vehicle": "STOPPED", "call": "REVOKED… |
| SES-02 | POST | `/v1/pickup-sessions` | 201 | {"sessionId": 36, "stateVersion": 0, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SIG-03 | POST | `/v1/pickup-sessions/36/prep-time-extensions` | 200 | {"extraPrepMinutes": 5, "callNotBefore": "2026-11-14T11:18:10+09:00"} |
| SES-03 | GET | `/v1/pickup-sessions/36` | 200 | {"sessionId": 36, "stateVersion": 1, "status": {"session": "ACTIVE", "vehicle": "ROUTING", "call": "NONE", "sp… |
| SES-07 | POST | `/v1/pickup-sessions/36/cancellation` | 200 | {"sessionId": 36, "stateVersion": 2, "status": {"session": "CANCELLED", "vehicle": "ROUTING", "call": "NONE", … |
| SPOT-03 DEL | DELETE | `/v1/pickup-spots/40` | 204 |  |
| FAM-04 | POST | `/v1/families/me/members/49/invites` | 201 | {"inviteUrl": "https://app.example/invite/DlZZ8l2OsMuhXpO64wTCdgeOOWiBCfVeg5isoGovco8", "expiresAt": "2026-11-… |
| FAM-07 | DELETE | `/v1/families/me/members/49` | 204 |  |
| FAM-04 (기대 404) | POST | `/v1/families/me/members/49/invites` | 404 | NOT_FOUND: 대상을 찾을 수 없습니다 |
| FAM-05 (기대 410) | GET | `/v1/invites/{token}` | 410 | INVITE_EXPIRED: 만료된 초대입니다 |
| FAM-06 (기대 410) | POST | `/v1/invites/{token}/acceptance` | 410 | INVITE_EXPIRED: 만료된 초대입니다 |
| SET-02 (기대 404) | POST | `/v1/children/49/schedules` | 404 | NOT_FOUND: 대상을 찾을 수 없습니다 |
| SET-03 (기대 404) | PUT | `/v1/schedules/23` | 404 | NOT_FOUND: 대상을 찾을 수 없습니다 |
| SET-04 (기대 404) | GET | `/v1/children/49/schedules` | 404 | NOT_FOUND: 대상을 찾을 수 없습니다 |
| AUTH-04 | DELETE | `/v1/vehicle-devices/me/session` | 204 |  |
| LINK-05 | DELETE | `/v1/vehicle-links/28` | 204 |  |
