import ActivityKit
import Foundation
import React

/// JS에서 부르는 Live Activity 모듈 (src/services/liveActivity.ts).
/// 자녀 폰에서 보호자가 출발하면 시작하고, ETA가 바뀌면 갱신하고, 탑승 완료 · 취소되면 끝낸다.
@objc(ILinkLiveActivity)
class LiveActivityModule: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool { false }

  private var current: Any?

  private func state(_ s: NSDictionary) -> PickupActivityAttributes.ContentState {
    PickupActivityAttributes.ContentState(
      minutesLeft: (s["minutesLeft"] as? NSNumber)?.intValue ?? 0,
      etaText: s["etaText"] as? String ?? "--:--",
      stage: (s["stage"] as? NSNumber)?.intValue ?? 0,
      progress: (s["progress"] as? NSNumber)?.doubleValue ?? 0,
      headline: s["headline"] as? String ?? "보호자가 출발했어요"
    )
  }

  /// 이미 진행 중이면 내용만 바꾼다
  @objc(start:state:resolver:rejecter:)
  func start(_ placeName: String, state s: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard #available(iOS 16.2, *) else { resolve(nil); return }
    guard ActivityAuthorizationInfo().areActivitiesEnabled else { resolve(nil); return }
    let content = ActivityContent(state: state(s), staleDate: nil)
    if let running = Activity<PickupActivityAttributes>.activities.first {
      Task { await running.update(content); resolve(running.id) }
      return
    }
    do {
      let activity = try Activity.request(attributes: PickupActivityAttributes(placeName: placeName), content: content)
      current = activity
      resolve(activity.id)
    } catch {
      reject("LIVE_ACTIVITY", error.localizedDescription, error)
    }
  }

  @objc(update:resolver:rejecter:)
  func update(_ s: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard #available(iOS 16.2, *) else { resolve(nil); return }
    let content = ActivityContent(state: state(s), staleDate: nil)
    Task {
      for a in Activity<PickupActivityAttributes>.activities { await a.update(content) }
      resolve(nil)
    }
  }

  @objc(end:resolver:rejecter:)
  func end(_ s: NSDictionary?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard #available(iOS 16.2, *) else { resolve(nil); return }
    Task {
      for a in Activity<PickupActivityAttributes>.activities {
        let final = s.map { ActivityContent(state: state($0), staleDate: nil) }
        await a.end(final, dismissalPolicy: .default)
      }
      resolve(nil)
    }
  }
}
