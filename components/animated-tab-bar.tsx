import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { haptic } from "@/lib/haptics";

export function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const expandedWidth = Math.max(120, screenWidth - 32 - (state.routes.length - 1) * 56);
  return (
    <View style={[styles.shell, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key];
          const focused = state.index === index;
          const label = typeof descriptor.options.tabBarLabel === "string"
            ? descriptor.options.tabBarLabel
            : descriptor.options.title ?? route.name;
          const icon = descriptor.options.tabBarIcon?.({ focused, color: focused ? "#FFFFFF" : "#C8D7F5", size: 22 });
          return (
            <AnimatedTabItem
              key={route.key}
              label={label}
              icon={icon}
              focused={focused}
              expandedWidth={expandedWidth}
              onPress={() => {
                const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) {
                  haptic.selection();
                  navigation.navigate(route.name, route.params);
                }
              }}
              onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
            />
          );
        })}
      </View>
    </View>
  );
}

function AnimatedTabItem({ label, icon, focused, expandedWidth, onPress, onLongPress }: { label: string; icon: React.ReactNode; focused: boolean; expandedWidth: number; onPress: () => void; onLongPress: () => void }) {
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(progress, { toValue: focused ? 1 : 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [focused, progress]);

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: [50, expandedWidth] });
  const backgroundColor = progress.interpolate({ inputRange: [0, 1], outputRange: ["#153968", "#F05578"] });
  const labelOpacity = progress;
  const labelTranslate = progress.interpolate({ inputRange: [0, 1], outputRange: [-7, 0] });

  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={label} onPress={onPress} onLongPress={onLongPress} style={({ pressed }) => [styles.itemPressable, pressed && styles.itemPressed]}>
      <Animated.View style={[styles.item, { width, backgroundColor }]}>
        <View style={styles.iconSlot}>
          <View style={[styles.iconOrb, focused && styles.iconOrbActive]}>{icon}</View>
        </View>
        <Animated.Text numberOfLines={1} style={[styles.label, { opacity: labelOpacity, transform: [{ translateX: labelTranslate }] }]}>{label}</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: { backgroundColor: "#041D48", paddingHorizontal: 16, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#294A79" },
  bar: { minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: 6 },
  itemPressable: { height: 50, alignItems: "center", justifyContent: "center" },
  item: { height: 50, borderRadius: 25, flexDirection: "row", alignItems: "center", justifyContent: "flex-start", overflow: "hidden", shadowColor: "#000000", shadowOpacity: 0.22, shadowRadius: 7, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  iconSlot: { width: 50, height: 50, flexShrink: 0, alignItems: "center", justifyContent: "center" },
  iconOrb: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  iconOrbActive: { backgroundColor: "rgba(255,255,255,0.18)" },
  label: { flexShrink: 1, color: "#FFFFFF", fontSize: 12, lineHeight: 16, fontWeight: "800", paddingRight: 14 },
  itemPressed: { opacity: 0.78, transform: [{ scale: 0.97 }] },
});
