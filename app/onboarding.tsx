import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PrimaryButton } from "@/components/ui/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useApp } from "@/lib/app-context";
import { haptic } from "@/lib/haptics";
import type { UserRole } from "@/shared/achuqe";

export default function OnboardingScreen() {
  const { chooseRole, completeOnboarding } = useApp();
  const { startLogin } = useAuth();
  const [step, setStep] = useState<"welcome" | "role">("welcome");
  const [selectedRole, setSelectedRole] = useState<UserRole>("consumer");
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const compactScreen = height <= 700;

  const continueToApp = () => {
    chooseRole(selectedRole);
    completeOnboarding();
    haptic.success();
    router.replace((selectedRole === "business" ? "/business/profile-form" : "/(tabs)") as never);
  };

  const continueWithAccount = () => {
    chooseRole(selectedRole);
    void startLogin();
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      {step === "welcome" ? (
        <View style={[styles.welcome, compactScreen && styles.welcomeCompact]}>
          <View style={[styles.visualWrap, compactScreen && styles.visualWrapCompact]}>
            <View style={styles.glowLarge} />
            <View style={styles.glowSmall} />
            <Image
              source={require("../assets/images/icon.png")}
              contentFit="cover"
              transition={180}
              style={styles.heroLogo}
            />
            <View style={styles.sparkleOne}>
              <MaterialIcons name="auto-awesome" size={26} color="#F3B84B" />
            </View>
            <View style={styles.sparkleTwo}>
              <MaterialIcons name="favorite" size={23} color="#7057D9" />
            </View>
          </View>

          <View style={styles.welcomeCopy}>
            <Text style={styles.eyebrow}>საჩუქრის არჩევა მარტივად</Text>
            <Text style={[styles.heroTitle, compactScreen && styles.heroTitleCompact]}>იპოვე ის, რაც ნამდვილად გაახარებს</Text>
            <Text style={[styles.heroSubtitle, compactScreen && styles.heroSubtitleCompact]}>
              გვიამბე ადამიანზე და შემთხვევაზე — ჩვენ მისთვის შესაფერის იდეებს შეგირჩევთ.
            </Text>
          </View>

          <PrimaryButton label="დავიწყოთ" icon="arrow-forward" onPress={() => setStep("role")} />
          <Text style={styles.privacy}>გაგრძელებით ეთანხმები გამოყენებისა და კონფიდენციალურობის პირობებს</Text>
        </View>
      ) : (
        <View style={[styles.roleScreen, compactScreen && styles.roleScreenCompact]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="უკან"
            onPress={() => setStep("welcome")}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <MaterialIcons name="arrow-back-ios-new" size={20} color="#251F24" />
          </Pressable>

          <View style={styles.roleHeader}>
            <Text style={[styles.roleTitle, compactScreen && styles.roleTitleCompact]}>როგორ გამოიყენებ „აჩუქე“-ს?</Text>
            <Text style={[styles.roleSubtitle, compactScreen && styles.roleSubtitleCompact]}>რეჟიმის შეცვლას მოგვიანებით პროფილიდანაც შეძლებ.</Text>
          </View>

          <View style={styles.roleCards}>
            <RoleCard
              title="ვეძებ საჩუქარს"
              subtitle="მიიღე პერსონალური იდეები რამდენიმე პასუხის შემდეგ"
              icon="redeem"
              color="#E94F6D"
              tint="#FBE2E8"
              selected={selectedRole === "consumer"}
              onPress={() => setSelectedRole("consumer")}
            />
            <RoleCard
              title="წარმოვადგენ ბიზნესს"
              subtitle="განათავსე პროდუქტები და მიაწვდინე ხმა ახალ მომხმარებლებს"
              icon="storefront"
              color="#7057D9"
              tint="#EEE8FF"
              selected={selectedRole === "business"}
              onPress={() => setSelectedRole("business")}
            />
          </View>

          <View style={[styles.roleFooter, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <PrimaryButton label="რეგისტრაცია ან შესვლა" icon="login" onPress={continueWithAccount} />
            <PrimaryButton label="ჯერ დემო რეჟიმით გაგრძელება" variant="ghost" onPress={continueToApp} />
            <Text style={styles.accountHint}>ანგარიშით შენი რჩეულები და ბიზნესის პროდუქტები სხვადასხვა მოწყობილობაზეც ხელმისაწვდომი იქნება</Text>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

function RoleCard({
  title,
  subtitle,
  icon,
  color,
  tint,
  selected,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  tint: string;
  selected: boolean;
  onPress: () => void;
}) {
  const selectionProgress = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(selectionProgress, {
      toValue: selected ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [selected, selectionProgress]);

  const animatedCardStyle = {
    backgroundColor: selectionProgress.interpolate({ inputRange: [0, 1], outputRange: ["#FFFFFF", tint] }),
    borderColor: selectionProgress.interpolate({ inputRange: [0, 1], outputRange: ["#EADFDA", color] }),
    transform: [{ scale: selectionProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.012] }) }],
  };

  return (
    <Animated.View style={[styles.roleCard, animatedCardStyle, selected && styles.roleCardSelected]}>
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        onPress={() => {
          haptic.selection();
          onPress();
        }}
        style={({ pressed }) => [styles.roleCardButton, pressed && styles.pressed]}
      >
        <View style={[styles.roleIcon, { backgroundColor: selected ? "#FFFFFF" : tint }]}>
          <MaterialIcons name={icon} size={29} color={color} />
        </View>
        <View style={styles.roleCardCopy}>
          <Text style={styles.roleCardTitle}>{title}</Text>
          <Text style={styles.roleCardSubtitle}>{subtitle}</Text>
        </View>
        <MaterialIcons name={selected ? "check-circle" : "radio-button-unchecked"} size={24} color={selected ? color : "#C3B8BD"} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  welcome: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 18,
    justifyContent: "flex-end",
    gap: 16,
  },
  welcomeCompact: { gap: 12 },
  visualWrap: {
    flex: 1,
    minHeight: 270,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  visualWrapCompact: { minHeight: 220 },
  glowLarge: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#FBE2E8",
  },
  glowSmall: {
    position: "absolute",
    width: 188,
    height: 188,
    borderRadius: 94,
    backgroundColor: "#F7D3DB",
  },
  heroLogo: {
    width: 154,
    height: 154,
    borderRadius: 42,
    shadowColor: "#8D2B40",
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
  },
  sparkleOne: {
    position: "absolute",
    top: "24%",
    right: "17%",
  },
  sparkleTwo: {
    position: "absolute",
    bottom: "24%",
    left: "18%",
  },
  welcomeCopy: {
    gap: 9,
    marginBottom: 8,
  },
  eyebrow: {
    color: "#E94F6D",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
  },
  heroTitle: {
    color: "#F7F9FF",
    fontSize: 34,
    lineHeight: 41,
    fontWeight: "900",
    letterSpacing: -1,
  },
  heroTitleCompact: { fontSize: 29, lineHeight: 35 },
  heroSubtitle: {
    color: "#C5D5FF",
    fontSize: 16,
    lineHeight: 24,
  },
  heroSubtitleCompact: { fontSize: 14, lineHeight: 21 },
  privacy: {
    color: "#BFD0F4",
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  roleScreen: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 40,
    paddingBottom: 18,
  },
  roleScreenCompact: { paddingTop: 30 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EADFDA",
  },
  pressed: {
    opacity: 0.68,
  },
  roleHeader: {
    marginTop: 30,
    gap: 8,
  },
  roleTitle: {
    color: "#F7F9FF",
    fontSize: 30,
    lineHeight: 37,
    fontWeight: "900",
    letterSpacing: -0.7,
  },
  roleTitleCompact: { fontSize: 26, lineHeight: 32 },
  roleSubtitle: {
    color: "#C5D5FF",
    fontSize: 15,
    lineHeight: 22,
  },
  roleSubtitleCompact: { fontSize: 13, lineHeight: 19 },
  roleCards: {
    marginTop: 30,
    gap: 14,
  },
  roleCard: {
    minHeight: 118,
    padding: 15,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EADFDA",
  },
  roleCardSelected: {
    borderWidth: 2,
    shadowColor: "#7057D9",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  roleCardButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 15,
    minHeight: 116,
  },
  roleIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  roleCardCopy: {
    flex: 1,
    gap: 5,
  },
  roleCardTitle: {
    color: "#251F24",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
  },
  roleCardSubtitle: {
    color: "#756B70",
    fontSize: 12,
    lineHeight: 18,
  },
  roleFooter: {
    marginTop: "auto",
    gap: 10,
    backgroundColor: "rgba(255,248,245,0.96)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingTop: 8,
    shadowColor: "#6B4A52",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
    elevation: 2,
  },
  accountHint: {
    color: "#324A78",
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
});
