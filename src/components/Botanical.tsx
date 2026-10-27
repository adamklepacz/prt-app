import { memo, useMemo } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { botanicalPath, BotanicalVariant } from './botanicalPaths';

export type { BotanicalVariant };

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
  const d = useMemo(() => botanicalPath(variant), [variant]);
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" style={style} pointerEvents="none">
      <Path d={d} stroke={color} strokeOpacity={opacity} strokeWidth={1.1} fill="none" strokeLinecap="round" />
    </Svg>
  );
});
