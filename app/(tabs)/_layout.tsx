import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";

import { AnimatedTabBar } from "@/components/animated-tab-bar";
import { useApp } from "@/lib/app-context";

export default function TabLayout() {
  const { role } = useApp();

  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: role === "business" ? "მიმოხილვა" : "მთავარი",
          tabBarIcon: ({ color }) => <MaterialIcons size={25} name={role === "business" ? "dashboard" : "home-filled"} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: role === "business" ? "პროდუქტები" : "აღმოაჩინე",
          tabBarIcon: ({ color }) => <MaterialIcons size={25} name={role === "business" ? "inventory-2" : "explore"} color={color} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: role === "business" ? "დამატება" : "რჩეულები",
          tabBarIcon: ({ color }) => <MaterialIcons size={25} name={role === "business" ? "add-box" : "favorite"} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "პროფილი",
          tabBarIcon: ({ color }) => <MaterialIcons size={25} name="person" color={color} />,
        }}
      />
    </Tabs>
  );
}
