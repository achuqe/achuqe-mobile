import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

const MONTHS = ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი", "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"];
const WEEKDAYS = ["ორ", "სა", "ოთ", "ხუ", "პა", "შა", "კვ"];

function parseDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function sameDate(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

export function BirthDatePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<"days" | "months">("days");
  const [cursor, setCursor] = useState(() => new Date(new Date().getFullYear() - 25, 0, 1));
  const today = new Date();
  const selected = parseDateValue(value);
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: startOffset + daysInMonth }, (_, index) => index < startOffset ? null : new Date(cursor.getFullYear(), cursor.getMonth(), index - startOffset + 1));
  const canGoForward = cursor.getFullYear() < today.getFullYear() || (cursor.getFullYear() === today.getFullYear() && cursor.getMonth() < today.getMonth());
  const dateLabel = selected ? selected.toLocaleDateString("ka-GE", { day: "numeric", month: "long", year: "numeric" }) : "დაბადების თარიღი";

  const open = () => {
    const next = selected ?? new Date(today.getFullYear() - 25, 0, 1);
    setCursor(new Date(next.getFullYear(), next.getMonth(), 1));
    setMode("days");
    setVisible(true);
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>დაბადების თარიღი *</Text>
      <Pressable onPress={open} style={({ pressed }) => [styles.fieldButton, pressed && styles.pressed]}>
        <MaterialIcons name="calendar-month" size={21} color="#7057D9" />
        <Text style={[styles.value, !selected && styles.placeholder]}>{dateLabel}</Text>
        <MaterialIcons name="expand-more" size={21} color="#7057D9" />
      </Pressable>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.topRow}>
              <Text style={styles.sheetTitle}>დაბადების თარიღი</Text>
              <Pressable onPress={() => setVisible(false)} style={styles.closeButton} hitSlop={8}><MaterialIcons name="close" size={20} color="#3D353A" /></Pressable>
            </View>
            <View style={styles.navigation}>
              <Pressable onPress={() => setCursor(new Date(cursor.getFullYear() - 1, cursor.getMonth(), 1))} style={styles.navButton}><MaterialIcons name="chevron-left" size={24} color="#7057D9" /></Pressable>
              <Pressable onPress={() => setMode(mode === "days" ? "months" : "days")} style={styles.monthHeading}><Text style={styles.monthHeadingText}>{mode === "days" ? `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}` : cursor.getFullYear()}</Text><MaterialIcons name="expand-more" size={18} color="#7057D9" /></Pressable>
              <Pressable disabled={!canGoForward} onPress={() => setCursor(new Date(cursor.getFullYear() + 1, cursor.getMonth(), 1))} style={[styles.navButton, !canGoForward && styles.disabled]}><MaterialIcons name="chevron-right" size={24} color="#7057D9" /></Pressable>
            </View>
            {mode === "months" ? (
              <View style={styles.monthGrid}>{MONTHS.map((month, index) => <Pressable key={month} onPress={() => { setCursor(new Date(cursor.getFullYear(), index, 1)); setMode("days"); }} style={({ pressed }) => [styles.monthChoice, cursor.getMonth() === index && styles.monthChoiceActive, pressed && styles.pressed]}><Text style={[styles.monthChoiceText, cursor.getMonth() === index && styles.monthChoiceTextActive]}>{month}</Text></Pressable>)}</View>
            ) : (
              <>
                <View style={styles.weekRow}>{WEEKDAYS.map((day) => <Text key={day} style={styles.weekday}>{day}</Text>)}</View>
                <View style={styles.days}>{cells.map((date, index) => { if (!date) return <View key={`empty-${index}`} style={styles.dayCell} />; const future = date > today; const active = selected ? sameDate(date, selected) : false; return <Pressable key={date.toISOString()} disabled={future} onPress={() => { onChange(toDateValue(date)); setVisible(false); }} style={({ pressed }) => [styles.dayCell, active && styles.activeDay, future && styles.disabled, pressed && !future && styles.pressed]}><Text style={[styles.dayText, active && styles.activeDayText, future && styles.disabledDayText]}>{date.getDate()}</Text></Pressable>; })}</View>
              </>
            )}
            <Text style={styles.hint}>არჩევის შემდეგ დააჭირე „ცვლილებების შენახვას“.</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 }, label: { color: "#3D353A", fontSize: 13, lineHeight: 18, fontWeight: "800" }, fieldButton: { minHeight: 50, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 14, borderRadius: 15, borderWidth: 1, borderColor: "#DFD7E8", backgroundColor: "#FAFAFE" }, value: { flex: 1, color: "#251F24", fontSize: 14, lineHeight: 20, fontWeight: "600" }, placeholder: { color: "#8796B9", fontWeight: "400" }, overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(4, 29, 72, 0.6)" }, sheet: { gap: 14, padding: 20, paddingBottom: 30, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: "#FFFFFF" }, topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, sheetTitle: { color: "#251F24", fontSize: 18, lineHeight: 24, fontWeight: "900" }, closeButton: { width: 34, height: 34, borderRadius: 12, backgroundColor: "#F3F0FF", alignItems: "center", justifyContent: "center" }, navigation: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, navButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#F3F0FF", alignItems: "center", justifyContent: "center" }, monthHeading: { flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 12, paddingVertical: 8 }, monthHeadingText: { color: "#3B2E6F", fontSize: 16, lineHeight: 22, fontWeight: "900" }, weekRow: { flexDirection: "row" }, weekday: { width: "14.285%", color: "#857A80", fontSize: 11, lineHeight: 16, fontWeight: "800", textAlign: "center" }, days: { flexDirection: "row", flexWrap: "wrap" }, dayCell: { width: "14.285%", aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 16 }, activeDay: { backgroundColor: "#E94F6D" }, dayText: { color: "#3D353A", fontSize: 14, lineHeight: 19, fontWeight: "700" }, activeDayText: { color: "#FFFFFF" }, monthGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8 }, monthChoice: { width: "31%", minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: "#F6F4FC" }, monthChoiceActive: { backgroundColor: "#7057D9" }, monthChoiceText: { color: "#4D4358", fontSize: 12, lineHeight: 17, fontWeight: "800" }, monthChoiceTextActive: { color: "#FFFFFF" }, hint: { color: "#756B70", fontSize: 12, lineHeight: 17, textAlign: "center" }, disabled: { opacity: 0.3 }, disabledDayText: { color: "#A79CA1" }, pressed: { opacity: 0.68 },
});
