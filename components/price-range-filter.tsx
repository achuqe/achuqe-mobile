import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { parsePriceInput } from "@/shared/product-search";

type PriceRangeFilterProps = {
  minimum: string;
  maximum: string;
  onMinimumChange: (value: string) => void;
  onMaximumChange: (value: string) => void;
};

function sanitizePrice(value: string) {
  return value.replace(/[^0-9,.]/g, "");
}

export function PriceRangeFilter({ minimum, maximum, onMinimumChange, onMaximumChange }: PriceRangeFilterProps) {
  const [expanded, setExpanded] = useState(Boolean(minimum || maximum));
  const minValue = parsePriceInput(minimum);
  const maxValue = parsePriceInput(maximum);
  const hasRange = minimum.length > 0 || maximum.length > 0;
  const invalidRange = minValue !== undefined && maxValue !== undefined && minValue > maxValue;
  const rangeLabel = hasRange ? `₾${minimum || "0"} — ₾${maximum || "∞"}` : "ფასის დიაპაზონი";

  return (
    <View style={styles.wrapper}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded((value) => !value)} style={({ pressed }) => [styles.trigger, hasRange && styles.triggerActive, pressed && styles.pressed]}>
        <View style={styles.triggerCopy}><MaterialIcons name="payments" size={19} color={hasRange ? "#FFFFFF" : "#5C4A9B"} /><Text style={[styles.triggerText, hasRange && styles.triggerTextActive]}>{rangeLabel}</Text></View>
        <MaterialIcons name={expanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={21} color={hasRange ? "#FFFFFF" : "#5C4A9B"} />
      </Pressable>
      {expanded ? (
        <View style={styles.panel}>
          <View style={styles.fields}>
            <View style={styles.field}><Text style={styles.label}>მინ. ფასი</Text><View style={styles.inputWrap}><Text style={styles.currency}>₾</Text><TextInput value={minimum} onChangeText={(value) => onMinimumChange(sanitizePrice(value))} keyboardType="decimal-pad" placeholder="0" placeholderTextColor="#A79CA1" returnKeyType="done" style={styles.input} /></View></View>
            <View style={styles.field}><Text style={styles.label}>მაქს. ფასი</Text><View style={styles.inputWrap}><Text style={styles.currency}>₾</Text><TextInput value={maximum} onChangeText={(value) => onMaximumChange(sanitizePrice(value))} keyboardType="decimal-pad" placeholder="ნებისმიერი" placeholderTextColor="#A79CA1" returnKeyType="done" style={styles.input} /></View></View>
          </View>
          {invalidRange ? <Text style={styles.error}>მინიმალური ფასი მაქსიმალურ ფასს არ უნდა აჭარბებდეს.</Text> : <Text style={styles.hint}>ცარიელი ველი ფასის ერთ მხარეს შეზღუდვას არ გამოიყენებს.</Text>}
          {hasRange ? <Pressable onPress={() => { onMinimumChange(""); onMaximumChange(""); }} style={({ pressed }) => [styles.clear, pressed && styles.pressed]}><MaterialIcons name="close" size={16} color="#C93B58" /><Text style={styles.clearText}>ფილტრის გასუფთავება</Text></Pressable> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  trigger: { minHeight: 42, paddingHorizontal: 13, borderRadius: 14, backgroundColor: "#EEE8FF", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  triggerActive: { backgroundColor: "#7057D9" },
  triggerCopy: { flexDirection: "row", alignItems: "center", gap: 7 },
  triggerText: { color: "#5C4A9B", fontSize: 12, lineHeight: 16, fontWeight: "900" },
  triggerTextActive: { color: "#FFFFFF" },
  panel: { padding: 12, gap: 9, borderRadius: 17, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EADFDA" },
  fields: { flexDirection: "row", gap: 9 },
  field: { flex: 1, gap: 5 },
  label: { color: "#4C4247", fontSize: 11, lineHeight: 15, fontWeight: "800" },
  inputWrap: { minHeight: 44, paddingHorizontal: 11, borderRadius: 13, backgroundColor: "#FAFAFE", borderWidth: 1, borderColor: "#DFD7E8", flexDirection: "row", alignItems: "center", gap: 5 },
  currency: { color: "#7057D9", fontSize: 15, lineHeight: 20, fontWeight: "900" },
  input: { flex: 1, color: "#251F24", fontSize: 14, lineHeight: 19, paddingVertical: 0 },
  hint: { color: "#6C6093", fontSize: 11, lineHeight: 16 },
  error: { color: "#C93B58", fontSize: 11, lineHeight: 16, fontWeight: "700" },
  clear: { alignSelf: "flex-start", minHeight: 30, flexDirection: "row", alignItems: "center", gap: 4 },
  clearText: { color: "#C93B58", fontSize: 12, lineHeight: 16, fontWeight: "800" },
  pressed: { opacity: 0.68 },
});
