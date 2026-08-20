import { Pressable, StyleSheet, Text, View } from "react-native";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, subtitle, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 16,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: "#F7F9FF",
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  subtitle: {
    color: "#C5D5FF",
    fontSize: 13,
    lineHeight: 18,
  },
  action: {
    paddingVertical: 6,
  },
  pressed: {
    opacity: 0.55,
  },
  actionText: {
    color: "#FF9CB0",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },
});
