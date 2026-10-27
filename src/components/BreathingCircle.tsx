import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

/** Miękko „oddychające” koła: wdech 4 s, wydech 6 s. Bez cyfr, bez presji czasu. */
export function BreathingCircle({ size = 240, color = '#FFFFFF' }: { size?: number; color?: string }) {
  const scale = useRef(new Animated.Value(0.82)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.82, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);

  const ring = (factor: number, opacity: number) => (
    <Animated.View
      style={[
        styles.ring,
        {
          width: size * factor,
          height: size * factor,
          borderRadius: (size * factor) / 2,
          backgroundColor: color,
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );

  return (
    <View style={[styles.wrap, { width: size, height: size }]} pointerEvents="none">
      {ring(1, 0.08)}
      {ring(0.74, 0.12)}
      {ring(0.48, 0.2)}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute' },
});
