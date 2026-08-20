import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import { haptic } from "@/lib/haptics";

type IconName = ComponentProps<typeof MaterialIcons>["name"];

interface ChoiceChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
  wide?: boolean;
  style?: ViewStyle;
}

export function ChoiceChip({ label, selected, onPress, icon, wide = false, style }: ChoiceChipProps) {
  const handlePress = () => {
    haptic.selection();
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        wide && styles.wide,
        selected && styles.selected,
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon ? <MaterialIcons name={icon} size={20} color={selected ? "#FFFFFF" : "#7057D9"} /> : null}
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
      {selected ? <MaterialIcons name="check-circle" size={18} color="#FFFFFF" /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 46,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EADFDA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  wide: {
    flex: 1,
    minWidth: "46%",
  },
  selected: {
    backgroundColor: "#7057D9",
    borderColor: "#7057D9",
  },
  pressed: {
    opacity: 0.74,
  },
  label: {
    color: "#3D353A",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  selectedLabel: {
    color: "#FFFFFF",
  },
});
