import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { PrimaryButton } from "@/components/ui/primary-button";
import { useAuth } from "@/hooks/use-auth";
import { useApp } from "@/lib/app-context";
import { trpc } from "@/lib/trpc";

function splitName(name: string | null | undefined) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

function formatBirthDate(value: Date | string | null | undefined) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export default function CompleteProfileScreen() {
  const { user, isAuthenticated, startLogin } = useAuth();
  const { role } = useApp();
  const { data, isLoading } = trpc.profile.me.useQuery(undefined, { enabled: isAuthenticated, retry: 1, staleTime: 30_000 });
  const saveDetails = trpc.profile.savePersonalDetails.useMutation();
  const initialName = useMemo(() => splitName(user?.name), [user?.name]);
  const [firstName, setFirstName] = useState(initialName.firstName);
  const [lastName, setLastName] = useState(initialName.lastName);
  const [birthDate, setBirthDate] = useState("");
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    if (!data?.profile) return;
    setFirstName(data.profile.firstName ?? initialName.firstName);
    setLastName(data.profile.lastName ?? initialName.lastName);
    setBirthDate(formatBirthDate(data.profile.birthDate));
  }, [data?.profile, initialName.firstName, initialName.lastName]);

  const continueToApp = () => router.replace((role === "business" ? "/business/profile-form" : "/(tabs)") as never);

  useEffect(() => {
    if (data?.profile?.profileConsentAt) continueToApp();
  }, [data?.profile?.profileConsentAt]);

  const save = async () => {
    if (!firstName.trim() || !lastName.trim() || !birthDate.trim()) {
      Alert.alert("შეავსე ყველა ველი", "სახელი, გვარი და დაბადების თარიღი საჭიროა პროფილის დასასრულებლად.");
      return;
    }
    if (!hasConsent) {
      Alert.alert("საჭიროა თანხმობა", "მონაცემების შენახვამდე დაადასტურე ნებაყოფლობითი თანხმობა.");
      return;
    }
    try {
      await saveDetails.mutateAsync({ firstName: firstName.trim(), lastName: lastName.trim(), birthDate: birthDate.trim() });
      continueToApp();
    } catch (error) {
      Alert.alert("პროფილი ვერ შეინახა", error instanceof Error ? error.message : "სცადე ხელახლა.");
    }
  };

  if (!isAuthenticated) {
    return <ScreenContainer edges={["top", "bottom", "left", "right"]}><View style={styles.centered}><View style={styles.lockIcon}><MaterialIcons name="lock-outline" size={34} color="#7057D9" /></View><Text style={styles.title}>პროფილისთვის შესვლა საჭიროა</Text><Text style={styles.subtitle}>ანგარიშის შექმნის შემდეგ შეძლებ პირადი მონაცემების ნებაყოფლობით შევსებას.</Text><PrimaryButton label="რეგისტრაცია ან შესვლა" icon="login" onPress={() => void startLogin()} /></View></ScreenContainer>;
  }

  if (isLoading) return <ScreenContainer><View style={styles.centered}><ActivityIndicator color="#7057D9" /><Text style={styles.loadingText}>პროფილი იტვირთება...</Text></View></ScreenContainer>;

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}><View style={styles.headerIcon}><MaterialIcons name="person-outline" size={23} color="#7057D9" /></View><Text style={styles.headerTitle}>პროფილის დასრულება</Text><View style={styles.headerSpacer} /></View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.introCard}><View style={styles.introIcon}><MaterialIcons name="verified-user" size={28} color="#E94F6D" /></View><View style={styles.introCopy}><Text style={styles.introTitle}>შენი მონაცემები შენს კონტროლშია</Text><Text style={styles.introText}>ელფოსტა და შესვლის მეთოდი უსაფრთხოდ მოვიდა არჩეული პროვაიდერიდან. ქვემოთ მოცემულ მონაცემებს მხოლოდ შენი თანხმობით ვინახავთ.</Text></View></View>
          <View style={styles.providerCard}><MaterialIcons name="alternate-email" size={19} color="#7057D9" /><View style={styles.providerCopy}><Text style={styles.providerLabel}>ავტორიზებული ელფოსტა</Text><Text style={styles.providerValue}>{user?.email ?? "პროვაიდერს ელფოსტა არ გაუზიარებია"}</Text></View></View>
          <View style={styles.providerCard}><MaterialIcons name="login" size={19} color="#7057D9" /><View style={styles.providerCopy}><Text style={styles.providerLabel}>შესვლის მეთოდი</Text><Text style={styles.providerValue}>{user?.loginMethod ?? "ავტორიზაციის პროვაიდერი"}</Text></View></View>
          <Field label="სახელი *" value={firstName} onChangeText={setFirstName} placeholder="მაგ. ნინო" autoCapitalize="words" />
          <Field label="გვარი *" value={lastName} onChangeText={setLastName} placeholder="მაგ. ბერიძე" autoCapitalize="words" />
          <Field label="დაბადების თარიღი *" value={birthDate} onChangeText={setBirthDate} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" maxLength={10} />
          <Pressable onPress={() => setHasConsent((value) => !value)} style={({ pressed }) => [styles.consent, hasConsent && styles.consentSelected, pressed && styles.pressed]}><MaterialIcons name={hasConsent ? "check-box" : "check-box-outline-blank"} size={23} color={hasConsent ? "#7057D9" : "#8C7F85"} /><Text style={styles.consentText}>ვადასტურებ, რომ ამ მონაცემებს ნებაყოფლობით ვაწვდი „აჩუქე“-ს მხოლოდ ჩემი პროფილისთვის.</Text></Pressable>
        </ScrollView>
        <View style={styles.footer}><PrimaryButton label="შენახვა და გაგრძელება" icon="arrow-forward" onPress={() => void save()} loading={saveDetails.isPending} /></View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...props} returnKeyType="done" placeholderTextColor="#A79CA1" style={styles.input} /></View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { height: 62, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: "#EEE8FF", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#F7F9FF", fontSize: 17, lineHeight: 23, fontWeight: "900" },
  headerSpacer: { width: 42 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 26, gap: 15 },
  introCard: { flexDirection: "row", gap: 12, padding: 15, borderRadius: 21, backgroundColor: "#FBE2E8" },
  introIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  introCopy: { flex: 1, gap: 3 },
  introTitle: { color: "#7A2A40", fontSize: 15, lineHeight: 20, fontWeight: "900" },
  introText: { color: "#925D6B", fontSize: 12, lineHeight: 17 },
  providerCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 13, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EADFDA" },
  providerCopy: { flex: 1, gap: 1 },
  providerLabel: { color: "#8C7F85", fontSize: 11, lineHeight: 15, fontWeight: "700" },
  providerValue: { color: "#3D353A", fontSize: 13, lineHeight: 18, fontWeight: "700" },
  field: { gap: 7 },
  label: { color: "#C5D5FF", fontSize: 13, lineHeight: 18, fontWeight: "800" },
  input: { minHeight: 52, paddingHorizontal: 15, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EADFDA", color: "#251F24", fontSize: 15, lineHeight: 20 },
  consent: { flexDirection: "row", alignItems: "flex-start", gap: 9, padding: 13, borderRadius: 16, borderWidth: 1, borderColor: "#EADFDA", backgroundColor: "#FFFFFF" },
  consentSelected: { borderColor: "#B6A5FF", backgroundColor: "#F7F4FF" },
  consentText: { flex: 1, color: "#5F555A", fontSize: 12, lineHeight: 18 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#EADFDA" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30, gap: 10 },
  lockIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: "#EEE8FF", alignItems: "center", justifyContent: "center" },
  title: { color: "#F7F9FF", fontSize: 20, lineHeight: 26, fontWeight: "900", textAlign: "center" },
  subtitle: { color: "#C5D5FF", fontSize: 13, lineHeight: 19, textAlign: "center" },
  loadingText: { color: "#C5D5FF", fontSize: 13, lineHeight: 18 },
  pressed: { opacity: 0.68 },
});
