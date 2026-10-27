import { BookOpen, ChartColumn, Settings, Timer } from 'lucide-react-native';
import { Tabs } from 'expo-router/tabs';

import { colors } from '../../src/theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brown,
        tabBarInactiveTintColor: colors.text,
        tabBarLabelStyle: { fontSize: 11, marginTop: 2 },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 88,
          paddingTop: 8,
        },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Timer', tabBarIcon: ({ color, size }) => <Timer color={color} size={size} strokeWidth={1.6} /> }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Reakcje',
          tabBarIcon: ({ color, size }) => <ChartColumn color={color} size={size} strokeWidth={1.6} />,
        }}
      />
      <Tabs.Screen
        name="knowledge"
        options={{
          title: 'Wiedza',
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} strokeWidth={1.6} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ustawienia',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} strokeWidth={1.6} />,
        }}
      />
    </Tabs>
  );
}
