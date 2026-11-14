import ActivityKit
import Foundation

/// 자녀 폰 잠금화면 · 다이나믹 아일랜드에 보이는 픽업 진행 (LA-01 · DI-01 · DI-02).
/// 앱(ILinkMobile)과 위젯 확장(ILinkLiveActivity) 두 타깃이 같이 쓴다.
public struct PickupActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    /// '8분' (도착까지 남은 분)
    public var minutesLeft: Int
    /// '20:10' (도착 예정 시각)
    public var etaText: String
    /// 0 차량 출발 · 1 곧 도착 · 2 탑승하기
    public var stage: Int
    /// 0...1 출발 → 도착 사이 위치
    public var progress: Double
    /// '엄마가 출발했어요'
    public var headline: String

    public init(minutesLeft: Int, etaText: String, stage: Int, progress: Double, headline: String) {
      self.minutesLeft = minutesLeft
      self.etaText = etaText
      self.stage = stage
      self.progress = progress
      self.headline = headline
    }
  }

  /// '수학 임팩트 학원' (만날 장소)
  public var placeName: String

  public init(placeName: String) {
    self.placeName = placeName
  }
}
