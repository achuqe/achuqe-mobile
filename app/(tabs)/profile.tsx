import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { haptic } from "@/lib/haptics";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { resolveAssetUrl } from "@/lib/assets";
import { getProfileRolePresentation } from "@/lib/profile-role";

export default function ProfileScreen() {
  const { role, chooseRole, resetExperience, businessProfile } = useApp();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, loading, logout, startLogin } = useAuth();
  const { data: profileData } = trpc.profile.me.useQuery(undefined, { enabled: isAuthenticated, retry: 1, staleTime: 30_000 });
  const avatarUrl = profileData?.profile?.avatarUrl ? resolveAssetUrl(profileData.profile.avatarUrl) : null;
  const rolePresentation = getProfileRolePresentation({ authenticated: isAuthenticated, systemRole: user?.role, appRole: role ?? "consumer" });

  const switchRole = () => {
    const nextRole = role === "business" ? "consumer" : "business";
    haptic.medium();
    chooseRole(nextRole);
    router.replace((nextRole === "business" ? "/business/profile-form" : "/(tabs)") as never);
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top > 0 ? 82 : 68, 68) }]}>
        <Text style={styles.title}>პროფილი</Text>

        <View style={styles.userCard}>
          <View style={styles.avatar}>{avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{isAuthenticated ? (user?.name?.slice(0, 1) ?? "ა") : role === "business" ? businessProfile.name.slice(0, 1) : "ა"}</Text>}</View>
          <View style={styles.userCopy}>
            <Text style={styles.userName}>{isAuthenticated ? (user?.name ?? "აჩუქე მომხმარებელი") : role === "business" ? businessProfile.name : "დემო მომხმარებელი"}</Text>
            <Text style={styles.userRole}>{loading ? "ანგარიშის შემოწმება..." : isAuthenticated ? (user?.email ?? (role === "business" ? "ბიზნეს-ანგარიში" : "საჩუქრის მაძიებელი")) : "ანგარიშის გარეშე"}</Text>
            <View style={[styles.rolePill, rolePresentation.tone === "admin" && styles.rolePillAdmin, rolePresentation.tone === "business" && styles.rolePillBusiness, rolePresentation.tone === "member" && styles.rolePillMember]}>
              <MaterialIcons name={rolePresentation.icon} size={14} color={rolePresentation.tone === "admin" ? "#FFFFFF" : rolePresentation.tone === "business" ? "#FFFFFF" : "#3B2E6F"} />
              <Text style={[styles.rolePillText, (rolePresentation.tone === "admin" || rolePresentation.tone === "business") && styles.rolePillTextLight]}>{rolePresentation.label}</Text>
            </View>
            <Text style={styles.roleDescription}>{rolePresentation.description}</Text>
          </View>
          <MaterialIcons name={rolePresentation.icon} size={22} color={rolePresentation.tone === "admin" ? "#E94F6D" : "#7057D9"} />
        </View>

        <View style={styles.modeCard}>
          <View style={styles.modeIcon}>
            <MaterialIcons name={role === "business" ? "redeem" : "storefront"} size={26} color="#7057D9" />
          </View>
          <View style={styles.modeCopy}>
            <Text style={styles.modeTitle}>{role === "business" ? "გადადი საჩუქრების რეჟიმში" : "გაქვს ბიზნესი?"}</Text>
            <Text style={styles.modeText}>{role === "business" ? "იპოვე იდეები პირადი საჩუქრებისთვის" : "შექმენი ბიზნეს-პროფილი და დაამატე პროდუქტები"}</Text>
          </View>
          <Pressable onPress={switchRole} style={({ pressed }) => [styles.switchButton, pressed && styles.pressed]}>
            <Text style={styles.switchText}>გადასვლა</Text>
          </Pressable>
        </View>

        {role === "business" ? (
          <Pressable
            onPress={() => router.push("/business/profile-form" as never)}
            style={({ pressed }) => [styles.businessProfileCard, pressed && styles.pressed]}
          >
            <View style={styles.businessProfileIcon}>
              <MaterialIcons name="add-business" size={25} color="#E94F6D" />
            </View>
            <View style={styles.businessProfileCopy}>
              <Text style={styles.businessProfileTitle}>ბიზნესის ინფორმაციის რედაქტირება</Text>
              <Text style={styles.businessProfileText}>{businessProfile.category} · {businessProfile.city}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color="#B0A4AA" />
          </Pressable>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ანგარიში</Text>
          {isAuthenticated ? (
            <SettingsRow icon="person-outline" label="პირადი ინფორმაცია" value="დაკავშირებულია" onPress={() => router.push({ pathname: "/settings", params: { section: "account" } } as never)} />
          ) : (
            <Pressable onPress={() => void startLogin().then((authenticated) => { if (!authenticated) Alert.alert("რეგისტრაცია არ დასრულებულა", "ავტორიზაციის ფანჯარა დაიხურა ან სესია ვერ დადასტურდა. სცადე ხელახლა."); }).catch((error) => Alert.alert("რეგისტრაცია ვერ გაიხსნა", error instanceof Error ? error.message : "სცადე ხელახლა."))} style={({ pressed }) => [styles.signInRow, pressed && styles.pressed]}>
              <View style={styles.signInIcon}><MaterialIcons name="login" size={21} color="#FFFFFF" /></View>
              <View style={styles.signInCopy}><Text style={styles.signInTitle}>რეგისტრაცია ან შესვლა</Text><Text style={styles.signInText}>შეინახე მონაცემები უსაფრთხოდ ანგარიშში</Text></View>
              <MaterialIcons name="chevron-right" size={22} color="#B0A4AA" />
            </Pressable>
          )}
          {isAuthenticated ? <SettingsRow icon="receipt-long" label="ჩემი შეკვეთები" onPress={() => router.push("/orders" as never)} /> : null}
          {user?.role === "admin" ? (
            <SettingsRow icon="admin-panel-settings" label="ბიზნესების დამტკიცება" value="ადმინისტრატორი" onPress={() => router.push("/admin" as never)} />
          ) : null}
          <SettingsRow icon="notifications-none" label="შეტყობინებები" onPress={() => router.push({ pathname: "/settings", params: { section: "notifications" } } as never)} />
          <SettingsRow icon="language" label="ენა" value="ქართული" onPress={() => router.push({ pathname: "/settings", params: { section: "language" } } as never)} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>დახმარება</Text>
          <SettingsRow icon="help-outline" label="დახმარების ცენტრი" onPress={() => router.push({ pathname: "/settings", params: { section: "help" } } as never)} />
          <SettingsRow icon="shield" label="კონფიდენციალურობა" onPress={() => router.push({ pathname: "/settings", params: { section: "privacy" } } as never)} />
          <SettingsRow icon="description" label="გამოყენების პირობები" onPress={() => router.push({ pathname: "/settings", params: { section: "terms" } } as never)} />
        </View>

        <Pressable
          onPress={() => {
            resetExperience();
            router.replace("/onboarding" as never);
          }}
          style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
        >
          <MaterialIcons name="restart-alt" size={19} color="#C93B58" />
          <Text style={styles.resetText}>დემო გამოცდილების თავიდან დაწყება</Text>
        </Pressable>

        {isAuthenticated ? (
          <Pressable onPress={() => void logout()} style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}>
            <MaterialIcons name="logout" size={19} color="#756B70" />
            <Text style={styles.logoutText}>ანგარიშიდან გასვლა</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

function SettingsRow({ icon, label, value, onPress }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; value?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.rowIcon}><MaterialIcons name={icon} size={21} color="#7057D9" /></View>
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      <MaterialIcons name="chevron-right" size={22} color="#B0A4AA" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 34, gap: 18 },
  title: { color: "#F7F9FF", fontSize: 31, lineHeight: 38, fontWeight: "900", letterSpacing: -0.7 },
  userCard: { flexDirection: "row", alignItems: "center", gap: 13, backgroundColor: "#FFFFFF", borderRadius: 22, padding: 16, borderWidth: 1, borderColor: "#EADFDA", shadowColor: "#000000", shadowOpacity: 0.25, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  avatar: { width: 56, height: 56, borderRadius: 20, backgroundColor: "#E94F6D", alignItems: "center", justifyContent: "center" },
  avatarImage: { width: "100%", height: "100%", borderRadius: 20 },
  avatarText: { color: "#FFFFFF", fontSize: 25, lineHeight: 31, fontWeight: "900" },
  userCopy: { flex: 1, gap: 3 },
  userName: { color: "#251F24", fontSize: 17, lineHeight: 23, fontWeight: "800" },
  userRole: { color: "#4C4247", fontSize: 13, lineHeight: 18 },
  rolePill: { alignSelf: "flex-start", minHeight: 24, paddingHorizontal: 8, borderRadius: 9, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EEE8FF" },
  rolePillAdmin: { backgroundColor: "#E94F6D" },
  rolePillBusiness: { backgroundColor: "#7057D9" },
  rolePillMember: { backgroundColor: "#EEE8FF" },
  rolePillText: { color: "#3B2E6F", fontSize: 11, lineHeight: 15, fontWeight: "900" },
  rolePillTextLight: { color: "#FFFFFF" },
  roleDescription: { color: "#756B70", fontSize: 10, lineHeight: 14 },
  modeCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#EEE8FF", borderRadius: 22, padding: 15 },
  modeIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  modeCopy: { flex: 1, gap: 2 },
  modeTitle: { color: "#3B2E6F", fontSize: 14, lineHeight: 19, fontWeight: "800" },
  modeText: { color: "#6C6093", fontSize: 11, lineHeight: 16 },
  businessProfileCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#FFFFFF", borderRadius: 20, padding: 15, borderWidth: 1, borderColor: "#EADFDA" },
  businessProfileIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: "#FBE2E8", alignItems: "center", justifyContent: "center" },
  businessProfileCopy: { flex: 1, gap: 2 },
  businessProfileTitle: { color: "#3D353A", fontSize: 14, lineHeight: 19, fontWeight: "800" },
  businessProfileText: { color: "#5F555A", fontSize: 11, lineHeight: 15 },
  switchButton: { paddingHorizontal: 10, paddingVertical: 8 },
  switchText: { color: "#7057D9", fontSize: 12, lineHeight: 16, fontWeight: "800" },
  section: { backgroundColor: "#FFFFFF", borderRadius: 22, overflow: "hidden", borderWidth: 1, borderColor: "#EADFDA", shadowColor: "#000000", shadowOpacity: 0.2, shadowRadius: 13, shadowOffset: { width: 0, height: 7 }, elevation: 5 },
  sectionTitle: { color: "#4C4247", fontSize: 12, lineHeight: 16, fontWeight: "800", paddingHorizontal: 16, paddingTop: 15, paddingBottom: 7, textTransform: "uppercase", letterSpacing: 0.5 },
  signInRow: { minHeight: 70, flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 15, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#EFE6E2" },
  signInIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: "#E94F6D", alignItems: "center", justifyContent: "center" },
  signInCopy: { flex: 1, gap: 2 },
  signInTitle: { color: "#3D353A", fontSize: 14, lineHeight: 19, fontWeight: "800" },
  signInText: { color: "#5F555A", fontSize: 11, lineHeight: 15 },
  row: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 15, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#EFE6E2" },
  rowIcon: { width: 32, alignItems: "center" },
  rowLabel: { flex: 1, color: "#3D353A", fontSize: 15, lineHeight: 20, fontWeight: "600" },
  rowValue: { color: "#5F555A", fontSize: 13, lineHeight: 18 },
  resetButton: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  resetText: { color: "#C93B58", fontSize: 14, lineHeight: 19, fontWeight: "700" },
  logoutButton: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  logoutText: { color: "#C5D5FF", fontSize: 14, lineHeight: 19, fontWeight: "700" },
  pressed: { opacity: 0.65 },
});
