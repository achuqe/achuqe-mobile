import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { PrimaryButton } from "@/components/ui/primary-button";
import { useApp } from "@/lib/app-context";
import { haptic } from "@/lib/haptics";
import type { BusinessProfile } from "@/shared/achuqe";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

export default function BusinessProfileFormScreen() {
  const { businessProfile, setBusinessProfile } = useApp();
  const { isAuthenticated, startLogin } = useAuth();
  const [form, setForm] = useState<BusinessProfile>(businessProfile);
  const saveMutation = trpc.profile.saveBusiness.useMutation();
  const utils = trpc.useUtils();

  const update = (key: keyof BusinessProfile, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const save = async () => {
    if (!form.name.trim() || !form.category.trim() || !form.contact.trim()) {
      Alert.alert("შეავსე აუცილებელი ველები", "ბიზნესის სახელი, კატეგორია და საკონტაქტო ინფორმაცია აუცილებელია.");
      haptic.error();
      return;
    }
    if (!isAuthenticated) {
      Alert.alert("რეგისტრაცია საჭიროა", "ბიზნესის განაცხადის ადმინისტრატორთან გასაგზავნად ჯერ შექმენი ან გახსენი ანგარიში.", [
        { text: "გაუქმება", style: "cancel" },
        { text: "რეგისტრაცია ან შესვლა", onPress: () => void startLogin() },
      ]);
      return;
    }
    try {
      await saveMutation.mutateAsync(form);
      setBusinessProfile(form);
      await utils.profile.me.invalidate();
      haptic.success();
      const message = "შენი ბიზნეს-პროფილი გადაეგზავნა ადმინისტრატორს. დამტკიცებამდე პროდუქტები მომხმარებლებისთვის არ გამოჩნდება.";
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") window.alert(message);
        router.replace("/(tabs)" as never);
      } else {
        Alert.alert("განაცხადი გაიგზავნა", message, [
          { text: "გასაგებია", onPress: () => router.replace("/(tabs)" as never) },
        ]);
      }
    } catch {
      haptic.error();
      Alert.alert("განაცხადი ვერ გაიგზავნა", "სერვერთან დაკავშირება ახლა ვერ მოხერხდა. შეამოწმე ინტერნეტი და სცადე ხელახლა.");
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <MaterialIcons name="close" size={23} color="#251F24" />
          </Pressable>
          <Text style={styles.headerTitle}>ბიზნეს-პროფილი</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.introCard}>
            <View style={styles.introIcon}><MaterialIcons name="storefront" size={28} color="#7057D9" /></View>
            <View style={styles.introCopy}>
              <Text style={styles.introTitle}>გააგზავნე ბიზნესი დასამტკიცებლად</Text>
              <Text style={styles.introText}>შევსების შემდეგ განაცხადს ადმინისტრატორი გადაამოწმებს. დამტკიცებამდე პროდუქტები მომხმარებლებს არ გამოუჩნდებათ.</Text>
            </View>
          </View>
          <Field label="ბიზნესის სახელი *" value={form.name} onChangeText={(value) => update("name", value)} placeholder="მაგ. თიხის ამბავი" />
          <Field label="კატეგორია *" value={form.category} onChangeText={(value) => update("category", value)} placeholder="მაგ. ხელნაკეთი ნივთები" />
          <Field label="აღწერა" value={form.description} onChangeText={(value) => update("description", value)} placeholder="მოკლედ მოყევი შენი ბიზნესის შესახებ" multiline />
          <Field label="ქალაქი" value={form.city} onChangeText={(value) => update("city", value)} placeholder="თბილისი" />
          <Field label="საკონტაქტო ნომერი ან ბმული *" value={form.contact} onChangeText={(value) => update("contact", value)} placeholder="+995 555 00 00 00" keyboardType="phone-pad" />
          <Field label="პირადი ანგარიშის ნომერი (IBAN)" value={form.payoutAccountIban} onChangeText={(value) => update("payoutAccountIban", value.replace(/\s/g, "").toUpperCase())} placeholder="GE29NB0000000101904917" autoCapitalize="characters" />
          <Text style={styles.accountHint}>ეს ანგარიში ინახება მხოლოდ შენი ბიზნესისთვის. გადახდილი შეკვეთის ბიზნესის წილი ამ ანგარიშის payout დანიშნულებას დაუკავშირდება. რეალური ბანკური გადარიცხვა გააქტიურდება TBC/Bank of Georgia-ს სავაჭრო ინტეგრაციის შემდეგ.</Text>
        </ScrollView>
        <View style={styles.footer}><PrimaryButton label="ცვლილებების შენახვა" icon="check" onPress={() => void save()} loading={saveMutation.isPending} /></View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function Field({ label, multiline = false, ...props }: { label: string; multiline?: boolean } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor="#A79CA1"
        returnKeyType={multiline ? "default" : "done"}
        textAlignVertical={multiline ? "top" : "center"}
        style={[styles.input, multiline && styles.textarea]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { height: 56, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EADFDA", alignItems: "center", justifyContent: "center" },
  headerSpacer: { width: 42 },
  headerTitle: { color: "#F7F9FF", fontSize: 17, lineHeight: 22, fontWeight: "800" },
  pressed: { opacity: 0.62 },
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24, gap: 18 },
  introCard: { flexDirection: "row", alignItems: "center", gap: 13, backgroundColor: "#EEE8FF", borderRadius: 20, padding: 15 },
  introIcon: { width: 50, height: 50, borderRadius: 17, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  introCopy: { flex: 1, gap: 3 },
  introTitle: { color: "#3B2E6F", fontSize: 15, lineHeight: 20, fontWeight: "800" },
  introText: { color: "#6C6093", fontSize: 12, lineHeight: 17 },
  field: { gap: 7 },
  label: { color: "#C5D5FF", fontSize: 13, lineHeight: 18, fontWeight: "700" },
  input: { minHeight: 52, backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#EADFDA", paddingHorizontal: 15, color: "#251F24", fontSize: 15, lineHeight: 20 },
  textarea: { minHeight: 116, paddingTop: 14 },
  accountHint: { color: "#C5D5FF", fontSize: 11, lineHeight: 16, marginTop: -8 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#EADFDA" },
});
