import { type ReactNode, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

/*
 * 가벼운 지도: 웹 메르카토르 타일을 Image로 깔고 그 위에 표식을 올린다.
 * 지도 SDK(키 · 네이티브 모듈) 없이 iOS · Android에서 같은 모양으로 보인다.
 * 타일은 OpenStreetMap 기본 타일을 옅게(투명도) 깔아 시안의 밝은 회색 지도처럼 보이게 한다.
 * 선명하게 보이도록 한 단계 위 줌 타일을 반 크기로 그린다 (레티나).
 */

export type LatLng = { lat: number; lng: number };
export type Point = { x: number; y: number };

const TILE = 256;
const TILE_URL = (z: number, x: number, y: number) =>
  `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
/** 화면에 그리는 타일 한 칸 (pt). 줌 z+1 타일을 128pt로 그려 줌 z와 같은 축척이 된다 */
const DRAW = TILE / 2;
const HEADERS = { 'User-Agent': 'iLink-mobile/1.0' };

/** 위경도 → 줌 z에서의 전체 픽셀 좌표 */
function world(p: LatLng, z: number): Point {
  const n = TILE * 2 ** z;
  const s = Math.sin((p.lat * Math.PI) / 180);
  return {
    x: ((p.lng + 180) / 360) * n,
    y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n,
  };
}

type Frame = {
  z: number;
  /** 화면 왼쪽 위의 전체 픽셀 좌표 */
  origin: Point;
};

/** 모든 점이 (여백을 뺀) 보이는 영역에 들어가는 가장 큰 줌을 고른다 */
function fit(
  points: LatLng[],
  w: number,
  h: number,
  pad: { top: number; bottom: number; side: number },
  maxZoom: number,
): Frame {
  const usableW = Math.max(40, w - pad.side * 2);
  const usableH = Math.max(40, h - pad.top - pad.bottom);
  let z = maxZoom;
  for (; z > 3; z--) {
    const ps = points.map(p => world(p, z));
    const xs = ps.map(p => p.x);
    const ys = ps.map(p => p.y);
    if (
      Math.max(...xs) - Math.min(...xs) <= usableW &&
      Math.max(...ys) - Math.min(...ys) <= usableH
    )
      break;
  }
  const ps = points.map(p => world(p, z));
  const cx = (Math.max(...ps.map(p => p.x)) + Math.min(...ps.map(p => p.x))) / 2;
  const cy = (Math.max(...ps.map(p => p.y)) + Math.min(...ps.map(p => p.y))) / 2;
  const screenCx = w / 2;
  const screenCy = pad.top + usableH / 2;
  return { z, origin: { x: cx - screenCx, y: cy - screenCy } };
}

export function TileMap({
  points,
  padding = { top: 80, bottom: 80, side: 60 },
  maxZoom = 17,
  children,
  style,
}: {
  /** 화면에 꼭 들어와야 하는 점들 (1개면 그 점이 가운데) */
  points: LatLng[];
  padding?: { top: number; bottom: number; side: number };
  maxZoom?: number;
  /** 지도 좌표를 화면 좌표로 바꾸는 함수를 받아 표식을 그린다 */
  children?: (project: (p: LatLng) => Point) => ReactNode;
  style?: object;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const ready = size.w > 0 && points.length > 0;
  const frame = ready ? fit(points, size.w, size.h, padding, maxZoom) : null;

  const tiles: { key: string; uri: string; left: number; top: number }[] = [];
  if (frame) {
    const tz = frame.z + 1;
    const max = 2 ** tz;
    const x0 = Math.floor(frame.origin.x / DRAW);
    const y0 = Math.floor(frame.origin.y / DRAW);
    const x1 = Math.floor((frame.origin.x + size.w) / DRAW);
    const y1 = Math.floor((frame.origin.y + size.h) / DRAW);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (ty < 0 || ty >= max) continue;
        const wx = ((tx % max) + max) % max;
        tiles.push({
          key: `${tz}/${tx}/${ty}`,
          uri: TILE_URL(tz, wx, ty),
          left: tx * DRAW - frame.origin.x,
          top: ty * DRAW - frame.origin.y,
        });
      }
    }
  }
  const project = (p: LatLng): Point => {
    if (!frame) return { x: 0, y: 0 };
    const q = world(p, frame.z);
    return { x: q.x - frame.origin.x, y: q.y - frame.origin.y };
  };

  return (
    <View
      style={[s.root, style]}
      onLayout={e =>
        setSize({
          w: e.nativeEvent.layout.width,
          h: e.nativeEvent.layout.height,
        })
      }
    >
      {tiles.map(t => (
        <Image
          key={t.key}
          source={{ uri: t.uri, headers: HEADERS }}
          style={[s.tile, { left: t.left, top: t.top }]}
        />
      ))}
      {frame && children ? children(project) : null}
      <Text style={s.credit}>© OpenStreetMap</Text>
    </View>
  );
}

/** 두 점을 잇는 둥근 선. 색을 여러 개 주면 앞에서 뒤로 조금씩 바뀐다 */
export function RouteLine({
  from,
  to,
  colors,
  width = 7,
}: {
  from: Point;
  to: Point;
  colors: string[];
  width?: number;
}) {
  const n = colors.length;
  return (
    <>
      {colors.map((c, i) => {
        const a = {
          x: from.x + ((to.x - from.x) * i) / n,
          y: from.y + ((to.y - from.y) * i) / n,
        };
        const b = {
          x: from.x + ((to.x - from.x) * (i + 1)) / n,
          y: from.y + ((to.y - from.y) * (i + 1)) / n,
        };
        const len = Math.hypot(b.x - a.x, b.y - a.y) + width;
        const ang = Math.atan2(b.y - a.y, b.x - a.x);
        return (
          <View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: (a.x + b.x) / 2 - len / 2,
              top: (a.y + b.y) / 2 - width / 2,
              width: len,
              height: width,
              borderRadius: width / 2,
              backgroundColor: c,
              transform: [{ rotate: `${ang}rad` }],
            }}
          />
        );
      })}
    </>
  );
}

const s = StyleSheet.create({
  root: { overflow: 'hidden', backgroundColor: '#F4F4F2' },
  // 원본 색을 옅게: 시안의 밝은 지도
  tile: { position: 'absolute', width: DRAW, height: DRAW, opacity: 0.36 },
  credit: {
    position: 'absolute',
    right: 6,
    bottom: 4,
    fontSize: 9,
    color: '#9A9A9A',
  },
});
