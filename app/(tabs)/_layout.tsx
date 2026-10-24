import Feather from "@expo/vector-icons/Feather";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";

type FeatherName = ComponentProps<typeof Feather>["name"];

const TABS: { name: string; title: string; icon: FeatherName }[] = [
  { name: "index", title: "Today", icon: "sun" },
  { name: "history", title: "History", icon: "book-open" },
  { name: "insights", title: "Insights", icon: "bar-chart-2" },
  { name: "profile", title: "Profile", icon: "user" },
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#F4845F",
        tabBarInactiveTintColor: "#8A8580",
        tabBarStyle: { backgroundColor: "#FFFFFF", borderTopColor: "#F0E8DE" },
      }}
    >
      {TABS.map(({ name, title, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarButtonTestID: `tab-${name}`,
            tabBarIcon: ({ color, size }) => <Feather name={icon} size={size} color={color as string} />,
          }}
        />
      ))}
    </Tabs>
  );
}
