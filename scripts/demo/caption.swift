// compose.sh 가 쓰는 그림 만들기: 배경(기기 이름표) · 단계 자막 PNG. macOS 기본 글꼴(Apple SD 산돌고딕 Neo)을 쓴다.
//   swift caption.swift base OUT.png W H "x,y,이름" ...
//   swift caption.swift text OUT.png W H "자막"
//   swift caption.swift phone OUT.png W H ios|android 화면폭 화면높이 베젤   (화면 자리는 투명한 폰 테두리)
import AppKit

let a = CommandLine.arguments
let mode = a[1], out = a[2]
let W = Int(a[3])!, H = Int(a[4])!
let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: W, pixelsHigh: H, bitsPerSample: 8,
                           samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB,
                           bytesPerRow: 0, bitsPerPixel: 0)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
let ctx = NSGraphicsContext.current!.cgContext
// 위에서 아래로 그리기
ctx.translateBy(x: 0, y: CGFloat(H)); ctx.scaleBy(x: 1, y: -1)
NSGraphicsContext.current = NSGraphicsContext(cgContext: ctx, flipped: true)

func font(_ size: CGFloat, _ bold: Bool) -> NSFont {
  NSFont(name: bold ? "AppleSDGothicNeo-Bold" : "AppleSDGothicNeo-Medium", size: size) ?? .systemFont(ofSize: size)
}
func draw(_ s: String, center x: CGFloat, top y: CGFloat, size: CGFloat, bold: Bool, color: NSColor) {
  let attr: [NSAttributedString.Key: Any] = [.font: font(size, bold), .foregroundColor: color]
  let str = NSAttributedString(string: s, attributes: attr)
  let sz = str.size()
  str.draw(at: NSPoint(x: x - sz.width / 2, y: y))
}

if mode == "base" {
  NSColor(calibratedRed: 0.07, green: 0.08, blue: 0.10, alpha: 1).setFill()
  NSRect(x: 0, y: 0, width: W, height: H).fill()
  for spec in a.dropFirst(5) {
    let p = spec.split(separator: ",", maxSplits: 2).map(String.init)
    draw(p[2], center: CGFloat(Double(p[0])!), top: CGFloat(Double(p[1])!), size: 26, bold: false,
         color: NSColor(white: 0.75, alpha: 1))
  }
} else if mode == "phone" {
  // 폰 테두리: 몸통(둥근 사각형) · 화면 자리는 투명 · 옆 버튼 · (Android) 펀치홀 카메라
  let kind = a[5]
  let sw = CGFloat(Double(a[6])!), sh = CGFloat(Double(a[7])!), b = CGFloat(Double(a[8])!)
  let side: CGFloat = 4
  let body = NSRect(x: side, y: 0, width: sw + 2 * b, height: sh + 2 * b)
  let screenR = kind == "ios" ? sw * 0.135 : sw * 0.085
  let bodyR = screenR + b
  // 옆 버튼
  NSColor(white: 0.16, alpha: 1).setFill()
  func btn(_ x: CGFloat, _ y: CGFloat, _ h: CGFloat) {
    NSBezierPath(roundedRect: NSRect(x: x, y: y, width: side + 2, height: h), xRadius: 1.5, yRadius: 1.5).fill()
  }
  if kind == "ios" {
    btn(0, body.height * 0.17, body.height * 0.035)        // 동작 버튼
    btn(0, body.height * 0.24, body.height * 0.065)        // 볼륨 +
    btn(0, body.height * 0.32, body.height * 0.065)        // 볼륨 -
    btn(body.maxX - 2, body.height * 0.27, body.height * 0.10)   // 측면 버튼
  } else {
    btn(body.maxX - 2, body.height * 0.20, body.height * 0.06)   // 전원
    btn(body.maxX - 2, body.height * 0.29, body.height * 0.12)   // 볼륨
  }
  // 몸통 테두리(밝은 금속 테) + 검은 베젤
  NSColor(white: kind == "ios" ? 0.42 : 0.30, alpha: 1).setFill()
  NSBezierPath(roundedRect: body, xRadius: bodyR, yRadius: bodyR).fill()
  NSColor(white: 0.04, alpha: 1).setFill()
  NSBezierPath(roundedRect: body.insetBy(dx: 2, dy: 2), xRadius: bodyR - 2, yRadius: bodyR - 2).fill()
  // 화면 자리 비우기
  let screen = NSRect(x: side + b, y: b, width: sw, height: sh)
  NSGraphicsContext.current!.compositingOperation = .clear
  NSBezierPath(roundedRect: screen, xRadius: screenR, yRadius: screenR).fill()
  NSGraphicsContext.current!.compositingOperation = .sourceOver
  if kind == "android" {
    NSColor.black.setFill()
    let d = sw * 0.032
    NSBezierPath(ovalIn: NSRect(x: screen.midX - d / 2, y: screen.minY + sw * 0.035, width: d, height: d)).fill()
  }
} else {
  // 자막: 반투명 띠 위에 흰 글씨
  NSColor(calibratedRed: 0, green: 0, blue: 0, alpha: 0).setFill()
  NSRect(x: 0, y: 0, width: W, height: H).fill()
  let text = a[5]
  let attr: [NSAttributedString.Key: Any] = [.font: font(40, true)]
  let tw = NSAttributedString(string: text, attributes: attr).size().width
  let box = NSRect(x: (CGFloat(W) - tw) / 2 - 36, y: 18, width: tw + 72, height: CGFloat(H) - 36)
  NSColor(calibratedRed: 1, green: 0.235, blue: 0.08, alpha: 0.92).setFill()   // iLink 주황 #FF3C14
  NSBezierPath(roundedRect: box, xRadius: (CGFloat(H) - 36) / 2, yRadius: (CGFloat(H) - 36) / 2).fill()
  draw(text, center: CGFloat(W) / 2, top: box.midY - 27, size: 40, bold: true, color: .white)
}
NSGraphicsContext.restoreGraphicsState()
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: out))
