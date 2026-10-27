import { memo, useMemo } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type Point = { x: number; y: number };
export type BotanicalVariant = 'willow' | 'fern' | 'bloom' | 'sprig';

const quad = (p0: Point, p1: Point, p2: Point, t: number): Point => ({
  x: (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t ** 2 * p2.x,
  y: (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t ** 2 * p2.y,
});

const tangent = (p0: Point, p1: Point, p2: Point, t: number) =>
  Math.atan2(2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y), 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x));

const f = (n: number) => n.toFixed(1);

/** Liść jako dwie krzywe Béziera + nerw środkowy. */
function leaf(at: Point, angle: number, length: number, width: number): string {
  const tip = { x: at.x + Math.cos(angle) * length, y: at.y + Math.sin(angle) * length };
  const mid = { x: (at.x + tip.x) / 2, y: (at.y + tip.y) / 2 };
  const px = -Math.sin(angle) * width;
  const py = Math.cos(angle) * width;
  return (
    `M${f(at.x)} ${f(at.y)} Q${f(mid.x + px)} ${f(mid.y + py)} ${f(tip.x)} ${f(tip.y)} ` +
    `Q${f(mid.x - px)} ${f(mid.y - py)} ${f(at.x)} ${f(at.y)} ` +
    `M${f(at.x)} ${f(at.y)} L${f(mid.x + (tip.x - mid.x) * 0.7)} ${f(mid.y + (tip.y - mid.y) * 0.7)}`
  );
}

function stem(p0: Point, p1: Point, p2: Point) {
  return `M${f(p0.x)} ${f(p0.y)} Q${f(p1.x)} ${f(p1.y)} ${f(p2.x)} ${f(p2.y)}`;
}

function willow(): string[] {
  const paths: string[] = [];
  const branches = [
    { p0: { x: 40, y: -5 }, p1: { x: 70, y: 60 }, p2: { x: 52, y: 190 } },
    { p0: { x: 95, y: -5 }, p1: { x: 120, y: 70 }, p2: { x: 105, y: 160 } },
    { p0: { x: 150, y: -5 }, p1: { x: 175, y: 50 }, p2: { x: 160, y: 130 } },
  ];
  branches.forEach(({ p0, p1, p2 }, b) => {
    paths.push(stem(p0, p1, p2));
    for (let i = 1; i <= 11; i += 1) {
      const t = i / 12;
      const at = quad(p0, p1, p2, t);
      const dir = tangent(p0, p1, p2, t);
      const side = i % 2 === 0 ? 1 : -1;
      paths.push(leaf(at, dir + side * 0.55, 20 - b * 2 - t * 4, 3.2));
    }
  });
  return paths;
}

function fern(): string[] {
  const p0 = { x: 30, y: 195 };
  const p1 = { x: 80, y: 90 };
  const p2 = { x: 175, y: 20 };
  const paths = [stem(p0, p1, p2)];
  for (let i = 1; i <= 14; i += 1) {
    const t = i / 15;
    const at = quad(p0, p1, p2, t);
    const dir = tangent(p0, p1, p2, t);
    const len = 30 * (1 - t * 0.7);
    paths.push(leaf(at, dir - 1.05, len, 4.5), leaf(at, dir + 1.05, len, 4.5));
  }
  return paths;
}

function bloom(): string[] {
  const center = { x: 120, y: 70 };
  const paths: string[] = [stem({ x: 60, y: 200 }, { x: 90, y: 140 }, center)];
  for (let i = 0; i < 9; i += 1) {
    paths.push(leaf(center, (i / 9) * Math.PI * 2, 34, 11));
  }
  paths.push(`M${center.x - 6} ${center.y} a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0`);
  paths.push(leaf({ x: 78, y: 158 }, -2.4, 40, 10), leaf({ x: 86, y: 132 }, -0.4, 36, 9));
  return paths;
}

function sprig(): string[] {
  const p0 = { x: 20, y: 180 };
  const p1 = { x: 110, y: 160 };
  const p2 = { x: 185, y: 40 };
  const paths = [stem(p0, p1, p2)];
  for (let i = 1; i <= 8; i += 1) {
    const t = i / 9;
    const at = quad(p0, p1, p2, t);
    const dir = tangent(p0, p1, p2, t);
    paths.push(leaf(at, dir + (i % 2 ? -0.9 : 0.9), 26, 8));
    // drobne „kwiatki” na końcach gałązek
    const tip = { x: at.x + Math.cos(dir + (i % 2 ? -0.9 : 0.9)) * 30, y: at.y + Math.sin(dir + (i % 2 ? -0.9 : 0.9)) * 30 };
    paths.push(`M${f(tip.x - 2)} ${f(tip.y)} a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0`);
  }
  return paths;
}

const GENERATORS: Record<BotanicalVariant, () => string[]> = { willow, fern, bloom, sprig };

export interface BotanicalProps {
  variant: BotanicalVariant;
  size?: number;
  color?: string;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
}

/** Autorskie, proceduralne ilustracje botaniczne w stylu rysunku tuszem. */
export const Botanical = memo(function Botanical({
  variant,
  size = 160,
  color = '#232323',
  opacity = 0.55,
  style,
}: BotanicalProps) {
  const d = useMemo(() => GENERATORS[variant]().join(' '), [variant]);
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" style={style} pointerEvents="none">
      <Path d={d} stroke={color} strokeOpacity={opacity} strokeWidth={1.1} fill="none" strokeLinecap="round" />
    </Svg>
  );
});
