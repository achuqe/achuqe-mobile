import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ComponentProps, ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

import { haptic } from "@/lib/haptics";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  icon?: MaterialIconName;
  variant?: "primary" | "secondary" | "dark" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  accessory?: ReactNode;
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  accessory,
}: PrimaryButtonProps) {
  const handlePress = () => {
    haptic.light();
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <View style={styles.loadingContent}>
          <ActivityIndicator size="small" color={variant === "secondary" || variant === "ghost" ? "#E94F6D" : "#FFFFFF"} />
          <Text style={[styles.loadingLabel, (variant === "secondary" || variant === "ghost") && styles.labelAccent]}>იტვირთება...</Text>
        </View>
      ) : (
        <>
          {icon ? (
            <MaterialIcons
              name={icon}
              size={21}
              color={variant === "secondary" || variant === "ghost" ? "#E94F6D" : "#FFFFFF"}
            />
          ) : null}
          <Text style={[styles.label, (variant === "secondary" || variant === "ghost") && styles.labelAccent]}>
            {label}
          </Text>
          {accessory}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    paddingHorizontal: 20,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  primary: {
    backgroundColor: "#E94F6D",
    shadowColor: "#B82445",
    shadowOpacity: 0.2,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  secondary: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1C8D1",
    shadowColor: "#6B4A52",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  dark: {
    backgroundColor: "#251F24",
  },
  ghost: {
    backgroundColor: "transparent",
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.86,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
  },
  loadingContent: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  loadingLabel: { color: "#FFFFFF", fontSize: 15, lineHeight: 20, fontWeight: "800" },
  labelAccent: {
    color: "#E94F6D",
  },
});
