import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { BirthDatePicker } from "@/components/birth-date-picker";
import { PrimaryButton } from "@/components/ui/primary-button";
import { useAuth } from "@/hooks/use-auth";
import { useApp } from "@/lib/app-context";
import { haptic } from "@/lib/haptics";
import { resolveAssetUrl } from "@/lib/assets";
import { formatGeorgianMobile } from "@/lib/phone";
import { trpc } from "@/lib/trpc";

type SettingsSection = "account" | "notifications" | "language" | "help" | "privacy" | "terms";

const content: Record<SettingsSection, { title: string; icon: keyof typeof MaterialIcons.glyphMap; heading: string; body: string }> = {
  account: { title: "პირადი ინფორმაცია", icon: "person-outline", heading: "შენი პირადი ინფორმაცია", body: "აქ შეგიძლია განაახლო სახელი, გვარი, დაბადების თარიღი და საკონტაქტო ნომერი." },
  notifications: { title: "შეტყობინებები", icon: "notifications-none", heading: "რა შეგატყობინოთ?", body: "რეკომენდაციებზე, შენახულ საჩუქრებსა და ბიზნესის პროდუქტების სტატუსზე შეტყობინებების მიღება ნებისმიერ დროს შეგიძლია შეცვალო." },
  language: { title: "ენა", icon: "language", heading: "ინტერფეისის ენა", body: "პირველი ვერსია სრულად ქართულენოვანია. სხვა ენების დამატება შესაძლებელი იქნება შემდეგ განახლებაში." },
  help: { title: "დახმარების ცენტრი", icon: "help-outline", heading: "როგორ დაგეხმაროთ?", body: "თუ საჩუქრის შერჩევა, ბიზნეს-პროფილი ან პროდუქტის დამატება გიჭირს, მოგვწერე და მიუთითე რომელი ეკრანი შეგიქმნა დაბრკოლება." },
  privacy: { title: "კონფიდენციალურობა", icon: "shield", heading: "შენი მონაცემები", body: "მიღებული პასუხები გამოიყენება მხოლოდ პერსონალური საჩუქრების შესარჩევად. შენ შეგიძლია ნებისმიერ დროს წაშალო დემო გამოცდილება პროფილიდან." },
  terms: { title: "გამოყენების პირობები", icon: "description", heading: "პირველი ვერსიის წესები", body: "ბიზნესის მიერ განთავსებული პროდუქტის მონაცემების სიზუსტეზე პასუხისმგებელია შესაბამისი ბიზნესი. შეკვეთასა და გადახდას მომდევნო ვერსიაში დაემატება ცალკე დაცული ნაკადი." },
};

function toDateInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

export default function SettingsScreen() {
  const params = useLocalSearchParams<{ section?: SettingsSection }>();
  const section = params.section && params.section in content ? params.section : "help";
  const page = content[section];
  const { notificationsEnabled, setNotificationsEnabled } = useApp();
  const { user, isAuthenticated, startLogin } = useAuth();
  const utils = trpc.useUtils();
  const { data: profileData } = trpc.profile.me.useQuery(undefined, { enabled: isAuthenticated, retry: 1, staleTime: 30_000 });
  const savePersonal = trpc.profile.savePersonalDetails.useMutation({
    onSuccess: () => void utils.profile.me.invalidate(),
  });
  const uploadAvatar = trpc.profile.uploadAvatar.useMutation({ onSuccess: () => void utils.profile.me.invalidate() });
  const clearAvatar = trpc.profile.clearAvatar.useMutation({ onSuccess: () => void utils.profile.me.invalidate() });
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const profile = profileData?.profile;
    if (!profile) return;
    setFirstName(profile.firstName ?? "");
    setLastName(profile.lastName ?? "");
    setBirthDate(toDateInput(profile.birthDate));
    setPhone(profile.phone ?? "");
  }, [profileData?.profile]);

  const toggleNotifications = (next: boolean) => {
    haptic.selection();
    setNotificationsEnabled(next);
  };

  const savePersonalDetails = async () => {
    if (!firstName.trim() || !lastName.trim() || !birthDate.trim()) {
      haptic.error();
      Alert.alert("შეავსე აუცილებელი ველები", "სახელი, გვარი და დაბადების თარიღი აუცილებელია.");
      return;
    }
    try {
      await savePersonal.mutateAsync({ firstName: firstName.trim(), lastName: lastName.trim(), birthDate: birthDate.trim(), phone: phone.trim() || undefined });
      haptic.success();
      Alert.alert("მონაცემები შენახულია", "პირადი ინფორმაცია წარმატებით განახლდა.");
    } catch (error) {
      haptic.error();
      Alert.alert("შენახვა ვერ დასრულდა", error instanceof Error ? error.message : "სცადე ხელახლა.");
    }
  };

  const pickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.65, base64: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset.base64) throw new Error("ფოტოს წაკითხვა ვერ მოხერხდა. სცადე სხვა სურათი.");
      const contentType = asset.mimeType === "image/png" || asset.mimeType === "image/webp" ? asset.mimeType : "image/jpeg";
      const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
      await uploadAvatar.mutateAsync({ base64: asset.base64, contentType, extension });
      haptic.success();
      Alert.alert("ფოტო განახლდა", "პროფილის სურათი წარმატებით შეინახა.");
    } catch (error) {
      haptic.error();
      Alert.alert("ფოტო ვერ აიტვირთა", error instanceof Error ? error.message : "სცადე ხელახლა.");
    }
  };

  const removeAvatar = () => Alert.alert("ფოტოს წაშლა", "პროფილის სურათის ნაცვლად კვლავ ინიციალი გამოჩნდება.", [{ text: "გაუქმება", style: "cancel" }, { text: "წაშლა", style: "destructive", onPress: () => void clearAvatar.mutateAsync().then(() => { haptic.success(); }).catch(() => { haptic.error(); Alert.alert("ფოტო ვერ წაიშალა", "სცადე ხელახლა."); }) }]);

  const avatarUrl = profileData?.profile?.avatarUrl ? resolveAssetUrl(profileData.profile.avatarUrl) : null;

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><MaterialIcons name="arrow-back-ios-new" size={20} color="#251F24" /></Pressable>
          <Text style={styles.title}>{page.title}</Text>
          <View style={styles.spacer} />
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}><MaterialIcons name={page.icon} size={31} color="#7057D9" /></View>
          <Text style={styles.heading}>{page.heading}</Text>
          <Text style={styles.body}>{page.body}</Text>
        </View>

        {section === "notifications" ? <View style={styles.card}><View style={styles.row}><View style={styles.rowCopy}><Text style={styles.rowTitle}>აპის შეტყობინებები</Text><Text style={styles.rowText}>მიიღე ახალი იდეები და სტატუსები</Text></View><Switch value={notificationsEnabled} onValueChange={toggleNotifications} trackColor={{ false: "#D8CDCF", true: "#F5A6B6" }} thumbColor={notificationsEnabled ? "#E94F6D" : "#FFFFFF"} /></View><Text style={styles.smallNote}>{notificationsEnabled ? "შეტყობინებები ჩართულია ამ მოწყობილობისთვის." : "შეტყობინებები გამორთულია ამ მოწყობილობისთვის."}</Text></View> : null}

        {section === "account" ? (
          <View style={styles.card}>
            {isAuthenticated ? (
              <>
                <Text style={styles.cardIntro}>რედაქტირებადი მონაცემები</Text>
                <View style={styles.avatarEditor}>
                  <View style={styles.avatarPreview}>{avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatarImage} /> : <MaterialIcons name="person" size={34} color="#7057D9" />}</View>
                  <View style={styles.avatarCopy}><Text style={styles.avatarTitle}>პროფილის სურათი</Text><Text style={styles.avatarText}>აირჩიე გალერეიდან კვადრატული ფოტო.</Text></View>
                </View>
                <View style={styles.avatarActions}><Pressable disabled={uploadAvatar.isPending} onPress={() => void pickAvatar()} style={({ pressed }) => [styles.avatarAction, pressed && styles.pressed, uploadAvatar.isPending && styles.disabled]}>{uploadAvatar.isPending ? <MaterialIcons name="hourglass-top" size={18} color="#5C4A9B" /> : <MaterialIcons name="photo-library" size={18} color="#5C4A9B" />}<Text style={styles.avatarActionText}>{avatarUrl ? "ფოტოს შეცვლა" : "ფოტოს დამატება"}</Text></Pressable>{avatarUrl ? <Pressable disabled={clearAvatar.isPending} onPress={removeAvatar} style={({ pressed }) => [styles.avatarRemove, pressed && styles.pressed]}><MaterialIcons name="delete-outline" size={18} color="#C93B58" /></Pressable> : null}</View>
                <Field label="სახელი *" value={firstName} onChangeText={setFirstName} placeholder="სახელი" />
                <Field label="გვარი *" value={lastName} onChangeText={setLastName} placeholder="გვარი" />
                <BirthDatePicker value={birthDate} onChange={setBirthDate} />
                <Field label="ტელეფონის ნომერი" value={phone} onChangeText={(value) => setPhone(formatGeorgianMobile(value))} placeholder="ტელეფონის ნომერი" keyboardType="phone-pad" maxLength={20} />
                <Text style={styles.smallNote}>ნომრის ცვლილებისთვის SMS-კოდის დადასტურება დაემატება შეტყობინებების სერვისის გააქტიურების შემდეგ.</Text>
                <View style={styles.emailBox}><View style={styles.emailIcon}><MaterialIcons name="email" size={20} color="#7057D9" /></View><View style={styles.emailCopy}><Text style={styles.emailLabel}>ელფოსტა</Text><Text style={styles.emailValue}>{user?.email ?? "ელფოსტა პროვაიდერს არ გაუზიარებია"}</Text></View></View>
                <Pressable onPress={() => Alert.alert("ელფოსტის ცვლილება", "ელფოსტის შეცვლა საჭიროებს ერთჯერად კოდს. ფუნქცია გააქტიურდება ელფოსტის სერვისის კონფიგურაციის შემდეგ.")} style={({ pressed }) => [styles.emailAction, pressed && styles.pressed]}><MaterialIcons name="verified-user" size={18} color="#7057D9" /><Text style={styles.emailActionText}>ელფოსტის ცვლილების დადასტურება</Text></Pressable>
                <Text style={styles.accountMeta}>შესვლის მეთოდი: {user?.loginMethod ?? "ავტორიზაციის პროვაიდერი"}</Text>
                <PrimaryButton label="ცვლილებების შენახვა" icon="save" loading={savePersonal.isPending} onPress={() => void savePersonalDetails()} style={styles.saveButton} />
                <Text style={styles.smallNote}>პირადი ინფორმაცია ინახება მხოლოდ შენი თანხმობით და ჩანს მხოლოდ შენთვის.</Text>
              </>
            ) : <><Text style={styles.accountName}>ანგარიში არ არის დაკავშირებული</Text><Text style={styles.accountEmail}>რეგისტრაციით შეინახავ რჩეულებს და ბიზნესის მონაცემებს.</Text><PrimaryButton label="რეგისტრაცია ან შესვლა" icon="login" onPress={() => void startLogin().then((authenticated) => { if (!authenticated) Alert.alert("რეგისტრაცია არ დასრულებულა", "ავტორიზაციის ფანჯარა დაიხურა ან სესია ვერ დადასტურდა. სცადე ხელახლა."); }).catch((error) => Alert.alert("რეგისტრაცია ვერ გაიხსნა", error instanceof Error ? error.message : "სცადე ხელახლა."))} style={styles.loginButton} /></>}
          </View>
        ) : null}

        {section === "help" ? <View style={styles.card}><Text style={styles.rowTitle}>სწრაფი გზამკვლევი</Text><Text style={styles.helpLine}>1. მთავარ ეკრანზე აირჩიე „იპოვე საჩუქარი“.</Text><Text style={styles.helpLine}>2. უპასუხე კითხვებს მიმღებისა და ბიუჯეტის შესახებ.</Text><Text style={styles.helpLine}>3. შეინახე საუკეთესო იდეები რჩეულებში.</Text><PrimaryButton label="დავიწყოთ საჩუქრის ძიება" variant="secondary" icon="redeem" onPress={() => router.replace("/gift-finder" as never)} style={styles.helpButton} /></View> : null}
      </ScrollView>
    </ScreenContainer>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput {...props} placeholderTextColor="#8796B9" style={styles.input} /></View>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 34, gap: 22 }, header: { height: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, back: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EADFDA", alignItems: "center", justifyContent: "center" }, title: { color: "#F7F9FF", fontSize: 17, lineHeight: 22, fontWeight: "800" }, spacer: { width: 42 }, hero: { alignItems: "center", gap: 10, paddingHorizontal: 12, paddingTop: 12 }, heroIcon: { width: 66, height: 66, borderRadius: 23, backgroundColor: "#EEE8FF", alignItems: "center", justifyContent: "center" }, heading: { color: "#F7F9FF", fontSize: 25, lineHeight: 31, fontWeight: "900", textAlign: "center" }, body: { color: "#C5D5FF", fontSize: 14, lineHeight: 21, textAlign: "center" }, card: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EADFDA", borderRadius: 22, padding: 17, gap: 12 }, row: { flexDirection: "row", alignItems: "center", gap: 14 }, rowCopy: { flex: 1, gap: 3 }, rowTitle: { color: "#3D353A", fontSize: 16, lineHeight: 21, fontWeight: "800" }, rowText: { color: "#5F555A", fontSize: 12, lineHeight: 17 }, smallNote: { color: "#5F555A", fontSize: 12, lineHeight: 18 }, cardIntro: { color: "#3D353A", fontSize: 16, lineHeight: 22, fontWeight: "900" }, avatarEditor: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 18, backgroundColor: "#F3F0FF" }, avatarPreview: { width: 66, height: 66, borderRadius: 23, overflow: "hidden", backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }, avatarImage: { width: "100%", height: "100%" }, avatarCopy: { flex: 1, gap: 3 }, avatarTitle: { color: "#3B2E6F", fontSize: 15, lineHeight: 20, fontWeight: "900" }, avatarText: { color: "#6C6093", fontSize: 12, lineHeight: 17 }, avatarActions: { flexDirection: "row", gap: 8 }, avatarAction: { flex: 1, minHeight: 43, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 14, backgroundColor: "#EEE8FF" }, avatarActionText: { color: "#5C4A9B", fontSize: 13, lineHeight: 18, fontWeight: "800" }, avatarRemove: { width: 43, minHeight: 43, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#FBE2E8" }, field: { gap: 6 }, fieldLabel: { color: "#3D353A", fontSize: 13, lineHeight: 18, fontWeight: "800" }, input: { minHeight: 50, paddingHorizontal: 14, borderRadius: 15, borderWidth: 1, borderColor: "#DFD7E8", backgroundColor: "#FAFAFE", color: "#251F24", fontSize: 14, lineHeight: 20 }, emailBox: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, backgroundColor: "#F3F0FF", borderRadius: 16 }, emailIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }, emailCopy: { flex: 1, gap: 1 }, emailLabel: { color: "#5C4A9B", fontSize: 11, lineHeight: 15, fontWeight: "800" }, emailValue: { color: "#3B2E6F", fontSize: 13, lineHeight: 18, fontWeight: "700" }, emailAction: { minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 14, backgroundColor: "#EEE8FF" }, emailActionText: { color: "#5C4A9B", fontSize: 13, lineHeight: 18, fontWeight: "800" }, accountName: { color: "#251F24", fontSize: 18, lineHeight: 24, fontWeight: "800" }, accountEmail: { color: "#4C4247", fontSize: 13, lineHeight: 19 }, accountMeta: { color: "#5F555A", fontSize: 12, lineHeight: 18, fontWeight: "600" }, saveButton: { marginTop: 3 }, loginButton: { marginTop: 6 }, helpLine: { color: "#4C4247", fontSize: 13, lineHeight: 20 }, helpButton: { marginTop: 7 }, disabled: { opacity: 0.55 }, pressed: { opacity: 0.65 },
});
