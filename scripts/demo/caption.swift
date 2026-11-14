// compose.sh 가 쓰는 그림 만들기: 배경(기기 이름표) · 단계 자막 PNG. macOS 기본 글꼴(Apple SD 산돌고딕 Neo)을 쓴다.
//   swift caption.swift base OUT.png W H "x,y,이름" ...
//   swift caption.swift text OUT.png W H "자막"
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
