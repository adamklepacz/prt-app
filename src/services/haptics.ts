import * as Haptics from 'expo-haptics';

const swallow = () => undefined;

/** Haptyka zawsze „miękka” – żadnych alarmowych wibracji. */
export const haptics = {
  start: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(swallow),
  tap: () => Haptics.selectionAsync().catch(swallow),
  finished: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(swallow),
};
