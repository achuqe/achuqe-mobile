import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { SavedCatalogFilter } from "@/shared/saved-catalog-filters";

type SavedCatalogFiltersProps = {
  filters: SavedCatalogFilter[];
  canSave: boolean;
  onSave: (name: string) => void;
  onApply: (filter: SavedCatalogFilter) => void;
  onRemove: (id: string) => void;
};

export function SavedCatalogFilters({ filters, canSave, onSave, onApply, onRemove }: SavedCatalogFiltersProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [name, setName] = useState("");
  const [validationMessage, setValidationMessage] = useState("");

  function save() {
    const normalizedName = name.trim();
    if (!normalizedName) {
      setValidationMessage("შეიყვანე ფილტრის სახელი.");
      return;
    }
    onSave(normalizedName);
    setName("");
    setValidationMessage("");
    setEditorOpen(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.titleRow}><MaterialIcons name="bookmark" size={18} color="#FF9CB0" /><Text style={styles.title}>შენახული ფილტრები</Text></View>
        <Pressable disabled={!canSave} onPress={() => { setEditorOpen((value) => !value); setValidationMessage(""); }} style={({ pressed }) => [styles.saveButton, !canSave && styles.saveButtonDisabled, pressed && styles.pressed]}><MaterialIcons name="bookmark-add" size={17} color="#FFFFFF" /><Text style={styles.saveButtonText}>შენახვა</Text></Pressable>
      </View>
      {!canSave && !filters.length ? <Text style={styles.hint}>ჯერ აირჩიე ინტერესი, ფასის დიაპაზონი ან დალაგების წესი.</Text> : null}
      {editorOpen ? (
        <View style={styles.editor}>
          <Text style={styles.editorLabel}>რა დავარქვათ ამ ფილტრს?</Text>
          <View style={styles.editorRow}>
            <TextInput value={name} onChangeText={(value) => { setName(value); setValidationMessage(""); }} maxLength={32} placeholder="მაგ. დაბადების დღე" placeholderTextColor="#A79CA1" returnKeyType="done" onSubmitEditing={save} style={styles.input} />
            <Pressable onPress={save} style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}><MaterialIcons name="check" size={20} color="#FFFFFF" /></Pressable>
          </View>
          {validationMessage ? <Text style={styles.validation}>{validationMessage}</Text> : null}
        </View>
      ) : null}
      {filters.length ? (
        <FlatList
          horizontal
          data={filters}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <SavedFilterChip filter={item} onApply={() => onApply(item)} onRemove={() => onRemove(item.id)} />}
        />
      ) : null}
    </View>
  );
}

function SavedFilterChip({ filter, onApply, onRemove }: { filter: SavedCatalogFilter; onApply: () => void; onRemove: () => void }) {
  return <View style={styles.chip}><Pressable onPress={onApply} style={({ pressed }) => [styles.chipMain, pressed && styles.pressed]}><MaterialIcons name="bookmark" size={16} color="#7057D9" /><Text numberOfLines={1} style={styles.chipText}>{filter.name}</Text></Pressable><Pressable accessibilityLabel={`${filter.name} ფილტრის წაშლა`} onPress={onRemove} hitSlop={8} style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}><MaterialIcons name="close" size={16} color="#A34962" /></Pressable></View>;
}

const styles = StyleSheet.create({
  container: { gap: 8, paddingTop: 2 },
  topRow: { minHeight: 36, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  title: { color: "#E2EAFF", fontSize: 12, lineHeight: 16, fontWeight: "900" },
  saveButton: { minHeight: 34, paddingHorizontal: 10, borderRadius: 12, backgroundColor: "#E94F6D", flexDirection: "row", alignItems: "center", gap: 5 },
  saveButtonDisabled: { opacity: 0.45 },
  saveButtonText: { color: "#FFFFFF", fontSize: 11, lineHeight: 15, fontWeight: "900" },
  hint: { color: "#AFC2EA", fontSize: 11, lineHeight: 16 },
  editor: { gap: 7, padding: 11, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EADFDA" },
  editorLabel: { color: "#4C4247", fontSize: 12, lineHeight: 16, fontWeight: "800" },
  editorRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: { flex: 1, minHeight: 41, paddingHorizontal: 11, borderRadius: 12, backgroundColor: "#FAFAFE", borderWidth: 1, borderColor: "#DFD7E8", color: "#251F24", fontSize: 14, lineHeight: 19 },
  confirmButton: { width: 42, height: 41, borderRadius: 12, backgroundColor: "#7057D9", alignItems: "center", justifyContent: "center" },
  validation: { color: "#C93B58", fontSize: 11, lineHeight: 15, fontWeight: "700" },
  list: { gap: 8, paddingRight: 20, paddingVertical: 2 },
  chip: { minHeight: 37, borderRadius: 13, overflow: "hidden", flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EADFDA" },
  chipMain: { maxWidth: 190, minHeight: 35, paddingLeft: 10, flexDirection: "row", alignItems: "center", gap: 5 },
  chipText: { color: "#4C4247", fontSize: 12, lineHeight: 16, fontWeight: "800", flexShrink: 1 },
  removeButton: { width: 32, minHeight: 35, alignItems: "center", justifyContent: "center", borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: "#EADFDA" },
  pressed: { opacity: 0.68 },
});
