import Foundation
import React
import UserNotifications

/// iOS 보호자 앱의 픽업 알림 (src/services/localNotify.ts).
/// iOS 원격 푸시(APNs · FCM)는 GoogleService-Info.plist · APNs 키를 받은 뒤 켠다. 그 전까지는
/// 앱이 서버 알림 목록(NOTI-02)에서 새 알림을 찾아 이 모듈로 기기 알림을 띄운다. 앱이 앞에 있어도 배너로 보인다.
@objc(ILinkLocalNotify)
class LocalNotifyModule: NSObject, UNUserNotificationCenterDelegate {
  @objc static func requiresMainQueueSetup() -> Bool { true }

  override init() {
    super.init()
    UNUserNotificationCenter.current().delegate = self
  }

  @objc(requestPermission:rejecter:)
  func requestPermission(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { ok, err in
      NSLog("[iLinkNotify] permission %@ %@", ok ? "yes" : "no", err?.localizedDescription ?? "")
      resolve(ok)
    }
  }

  @objc(show:title:body:resolver:rejecter:)
  func show(_ id: String, title: String, body: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let content = UNMutableNotificationContent()
    content.title = title
    content.body = body
    content.sound = .default
    NSLog("[iLinkNotify] show %@ %@", id, title)
    let req = UNNotificationRequest(identifier: id, content: content, trigger: nil)
    UNUserNotificationCenter.current().add(req) { error in
      if let error { NSLog("[iLinkNotify] add failed %@", error.localizedDescription) }
      if let error { reject("NOTIFY", error.localizedDescription, error) } else { resolve(nil) }
    }
  }

  // 앱이 앞에 있어도 배너 · 소리로 보여 준다
  func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification,
                              withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    completionHandler([.banner, .list, .sound])
  }
}
