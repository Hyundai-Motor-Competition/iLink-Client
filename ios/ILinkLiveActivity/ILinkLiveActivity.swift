import ActivityKit
import SwiftUI
import WidgetKit

/// iLink Live Activity: 잠금화면(LA-01) · 다이나믹 아일랜드 축소(DI-01) · 펼침(DI-02).
@main
struct ILinkLiveActivityBundle: WidgetBundle {
  var body: some Widget {
    PickupLiveActivity()
  }
}

struct PickupLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: PickupActivityAttributes.self) { context in
      LockScreenView(attributes: context.attributes, state: context.state)
        .activityBackgroundTint(PickupTheme.panel)
        .activitySystemActionForegroundColor(.white)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          AvatarWithCar(avatar: 40, car: 72)
            .padding(.leading, 4)
        }
        DynamicIslandExpandedRegion(.trailing) {
          VStack(alignment: .trailing, spacing: 2) {
            Text("\(context.state.minutesLeft)분")
              .font(.system(size: 28, weight: .heavy))
              .foregroundStyle(PickupTheme.yellow)
            Text(context.state.headline)
              .font(.system(size: 14, weight: .medium))
              .foregroundStyle(PickupTheme.sub)
          }
          .padding(.trailing, 4)
        }
        DynamicIslandExpandedRegion(.bottom) {
          // 펼친 아일랜드는 높이 제한이 있어 줄 간격을 줄인다 (단계 이름까지 보이게)
          VStack(spacing: 8) {
            PlaceRow(place: context.attributes.placeName, eta: context.state.etaText)
            ProgressRow(stage: context.state.stage, progress: context.state.progress, compact: true)
          }
          .padding(.horizontal, 4)
        }
      } compactLeading: {
        Avatar(size: 22, ring: 2)
      } compactTrailing: {
        Text("\(context.state.minutesLeft)분")
          .font(.system(size: 15, weight: .bold))
          .foregroundStyle(PickupTheme.yellow)
      } minimal: {
        Avatar(size: 22, ring: 2)
      }
      .keylineTint(PickupTheme.yellow)
    }
  }
}

/// 잠금화면 카드 (LA-01): '엄마가 출발했어요' / '8분 후 도착' / 장소 · 도착 예정 / 진행 막대
struct LockScreenView: View {
  let attributes: PickupActivityAttributes
  let state: PickupActivityAttributes.ContentState

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      HStack(alignment: .top) {
        VStack(alignment: .leading, spacing: 4) {
          Text(state.headline)
            .font(.system(size: 14, weight: .medium))
            .foregroundStyle(PickupTheme.sub)
          HStack(alignment: .firstTextBaseline, spacing: 6) {
            Text("\(state.minutesLeft)분")
              .font(.system(size: 32, weight: .heavy))
              .foregroundStyle(PickupTheme.yellow)
            Text("후 도착")
              .font(.system(size: 22, weight: .semibold))
              .foregroundStyle(.white)
          }
        }
        Spacer()
        AvatarWithCar(avatar: 46, car: 84)
      }
      // 잠금화면 Live Activity는 높이가 160pt로 제한된다
      PlaceRow(place: attributes.placeName, eta: state.etaText)
        .padding(.top, 8)
      ProgressRow(stage: state.stage, progress: state.progress, compact: true)
        .padding(.top, 10)
    }
    .padding(.horizontal, 18)
    .padding(.vertical, 14)
  }
}

/// 핀 + 장소 이름 · 오른쪽 'HH:mm 도착 예정'
struct PlaceRow: View {
  let place: String
  let eta: String

  var body: some View {
    HStack {
      Image(systemName: "mappin")
        .font(.system(size: 14))
        .foregroundStyle(PickupTheme.sub)
      Text(place)
        .font(.system(size: 15))
        .foregroundStyle(PickupTheme.sub)
        .lineLimit(1)
      Spacer()
      Text("\(eta) 도착 예정")
        .font(.system(size: 15, weight: .medium))
        .foregroundStyle(.white)
    }
  }
}

/// 진행 막대: 촘촘한 세로줄 길 + 노란 화살표 + 단계 원 3개 (차량 출발 · 곧 도착 · 탑승하기)
struct ProgressRow: View {
  let stage: Int
  let progress: Double
  var compact = false

  var body: some View {
    VStack(spacing: compact ? 4 : 8) {
      GeometryReader { geo in
        let w = geo.size.width
        let x = max(12, min(w - 12, w * progress))
        ZStack(alignment: .leading) {
          // 지나온 길(밝게) · 남은 길(흐리게)
          Stripes(color: Color.white.opacity(0.55)).frame(width: x).clipped()
          Stripes(color: Color.white.opacity(0.18)).offset(x: x).frame(width: max(0, w - x)).clipped()
          ForEach(0..<3, id: \.self) { i in
            Milestone(done: i <= stage, first: i == 0)
              .position(x: [12, w / 2, w - 12][i], y: 12)
          }
          Circle().fill(PickupTheme.yellow).frame(width: compact ? 26 : 30, height: compact ? 26 : 30)
            .shadow(color: PickupTheme.yellow.opacity(0.6), radius: 6)
            .overlay(Image(systemName: "location.north.fill").rotationEffect(.degrees(90))
              .font(.system(size: 12, weight: .bold)).foregroundStyle(PickupTheme.panel))
            .position(x: x, y: 12)
        }
      }
      .frame(height: 24)
      HStack {
        Text("차량 출발").foregroundStyle(stage >= 0 ? .white : PickupTheme.sub)
        Spacer()
        Text("곧 도착").foregroundStyle(stage >= 1 ? .white : PickupTheme.sub)
        Spacer()
        Text("탑승하기").foregroundStyle(stage >= 2 ? .white : PickupTheme.sub)
      }
      .font(.system(size: compact ? 13 : 14, weight: .medium))
    }
  }
}

struct Stripes: View {
  let color: Color
  var body: some View {
    Canvas { ctx, size in
      var x: CGFloat = 0
      while x < size.width {
        ctx.fill(Path(CGRect(x: x, y: 2, width: 1, height: size.height - 4)), with: .color(color))
        x += 3
      }
    }
  }
}

struct Milestone: View {
  let done: Bool
  let first: Bool
  var body: some View {
    ZStack {
      Circle().stroke(first ? PickupTheme.yellow : Color.white.opacity(0.6), lineWidth: 2).frame(width: 22, height: 22)
      Circle().fill(first ? PickupTheme.yellow : Color.white.opacity(done ? 0.8 : 0.45)).frame(width: 12, height: 12)
    }
    .background(Circle().fill(PickupTheme.panel).frame(width: 22, height: 22))
  }
}

/// 보호자 사진(노란 테두리)
struct Avatar: View {
  let size: CGFloat
  let ring: CGFloat
  var body: some View {
    Image("GuardianAvatar")
      .resizable()
      .scaledToFill()
      .frame(width: size, height: size)
      .clipShape(Circle())
      .overlay(Circle().stroke(PickupTheme.yellow, lineWidth: ring))
  }
}

/// 보호자 사진 + 옆모습 차 (사진이 차 앞을 살짝 덮는다)
struct AvatarWithCar: View {
  let avatar: CGFloat
  let car: CGFloat
  var body: some View {
    ZStack(alignment: .leading) {
      Image("CarSide").resizable().scaledToFit().frame(width: car).offset(x: avatar * 0.62)
      Image("GuardianAvatar")
        .resizable().scaledToFill()
        .frame(width: avatar, height: avatar)
        .clipShape(Circle())
        .overlay(Circle().stroke(Color.white.opacity(0.25), lineWidth: 1))
    }
    .frame(width: avatar * 0.62 + car, alignment: .leading)
  }
}

enum PickupTheme {
  static let yellow = Color(red: 0.965, green: 1.0, blue: 0.263) // #F6FF43
  static let panel = Color(red: 0.067, green: 0.071, blue: 0.0)  // #111200
  static let sub = Color(red: 0.69, green: 0.69, blue: 0.66)
}
