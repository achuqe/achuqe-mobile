import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenContainer } from "@/components/screen-container";
import { ChoiceChip } from "@/components/ui/choice-chip";
import { PrimaryButton } from "@/components/ui/primary-button";
import { AGE_RANGES, INTERESTS, OCCASIONS, RELATIONSHIPS } from "@/data/catalog";
import { haptic } from "@/lib/haptics";
import type {
  AgeRangeId,
  GiftAnswers,
  OccasionId,
  RecipientGender,
  RelationshipId,
} from "@/shared/achuqe";

const TOTAL_STEPS = 5;

export default function GiftFinderScreen() {
  const params = useLocalSearchParams<{ occasion?: string; answers?: string; step?: string }>();
  const insets = useSafeAreaInsets();
  const initialOccasion = OCCASIONS.some((item) => item.id === params.occasion)
    ? (params.occasion as OccasionId)
    : undefined;
  const restoredAnswers = useMemo<GiftAnswers | null>(() => {
    if (!params.answers) return null;
    try {
      return JSON.parse(params.answers) as GiftAnswers;
    } catch {
      return null;
    }
  }, [params.answers]);
  const [step, setStep] = useState(() => Math.max(1, Math.min(TOTAL_STEPS, Number(params.step) || (initialOccasion ? 2 : 1))));
  const [answers, setAnswers] = useState<GiftAnswers>(() => restoredAnswers ?? {
    occasion: initialOccasion,
    interests: [],
    minBudget: 0,
    maxBudget: 250,
  });

  const progress = `${(step / TOTAL_STEPS) * 100}%` as `${number}%`;
  const canContinue = useMemo(() => {
    if (step === 1) return Boolean(answers.occasion);
    if (step === 2) return Boolean(answers.relationship);
    if (step === 3) return Boolean(answers.gender && answers.ageRange);
    if (step === 4) return answers.interests.length > 0;
    return answers.maxBudget > 0;
  }, [answers, step]);

  const update = <K extends keyof GiftAnswers>(key: K, value: GiftAnswers[K]) => {
    setAnswers((current) => ({ ...current, [key]: value }));
  };

  const toggleInterest = (interest: GiftAnswers["interests"][number]) => {
    update(
      "interests",
      answers.interests.includes(interest)
        ? answers.interests.filter((item) => item !== interest)
        : [...answers.interests, interest],
    );
  };

  const goBack = () => {
    if (step === 1 || (step === 2 && initialOccasion && !restoredAnswers)) {
      router.back();
      return;
    }
    setStep((current) => Math.max(1, current - 1));
  };

  const goNext = () => {
    if (!canContinue) return;
    if (step < TOTAL_STEPS) {
      setStep((current) => current + 1);
      return;
    }
    haptic.success();
    router.replace({ pathname: "/recommendations", params: { answers: JSON.stringify(answers) } } as never);
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={[styles.container, { paddingTop: Math.max(insets.top > 0 ? 60 : 52, 52) }]}>
        <View style={styles.header}>
          <Pressable onPress={goBack} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <MaterialIcons name="arrow-back-ios-new" size={20} color="#251F24" />
          </Pressable>
          <View style={styles.progressCopy}>
            <Text style={styles.stepText}>ნაბიჯი {step} / {TOTAL_STEPS}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: progress }]} />
            </View>
          </View>
          <Pressable onPress={() => router.dismiss()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <MaterialIcons name="close" size={23} color="#251F24" />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <QuestionHeader step={step} />
          <View style={styles.options}>{renderStep(step, answers, update, toggleInterest)}</View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={step === TOTAL_STEPS ? "აჩვენე შედეგები" : "შემდეგი"}
            icon={step === TOTAL_STEPS ? "auto-awesome" : "arrow-forward"}
            disabled={!canContinue}
            onPress={goNext}
          />
          <Text style={styles.footerHint}>პასუხები გამოიყენება მხოლოდ უკეთესი შეთავაზებების მოსაძებნად</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

function QuestionHeader({ step }: { step: number }) {
  const content = [
    ["რას აღნიშნავთ?", "შემთხვევა დაგვეხმარება საჩუქრის ტონის სწორად შერჩევაში."],
    ["ვინ არის შენთვის?", "მონიშნე თქვენი ურთიერთობა საჩუქრის მიმღებთან."],
    ["ცოტა რამ ადამიანზე", "ასაკი და სქესი შედეგებს უფრო ზუსტს გახდის."],
    ["რა უყვარს?", "აირჩიე მინიმუმ ერთი ინტერესი. შეგიძლია რამდენიმე მონიშნო."],
    ["რა ბიუჯეტი გაქვს?", "ჩვენ მხოლოდ ამ დიაპაზონში არსებულ საჩუქრებს გაჩვენებთ."],
  ][step - 1];

  return (
    <View style={styles.questionHeader}>
      <View style={styles.magicIcon}><MaterialIcons name="auto-awesome" size={22} color="#7057D9" /></View>
      <Text style={styles.title}>{content[0]}</Text>
      <Text style={styles.subtitle}>{content[1]}</Text>
    </View>
  );
}

function renderStep(
  step: number,
  answers: GiftAnswers,
  update: <K extends keyof GiftAnswers>(key: K, value: GiftAnswers[K]) => void,
  toggleInterest: (interest: GiftAnswers["interests"][number]) => void,
) {
  if (step === 1) {
    return OCCASIONS.map((item) => (
      <ChoiceChip
        key={item.id}
        label={item.label}
        icon={item.icon as keyof typeof MaterialIcons.glyphMap}
        selected={answers.occasion === item.id}
        onPress={() => update("occasion", item.id)}
        wide
      />
    ));
  }

  if (step === 2) {
    return RELATIONSHIPS.map((item) => (
      <ChoiceChip
        key={item.id}
        label={item.label}
        icon={item.icon as keyof typeof MaterialIcons.glyphMap}
        selected={answers.relationship === item.id}
        onPress={() => update("relationship", item.id as RelationshipId)}
        wide
      />
    ));
  }

  if (step === 3) {
    const genders: { id: RecipientGender; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
      { id: "woman", label: "ქალი", icon: "female" },
      { id: "man", label: "კაცი", icon: "male" },
      { id: "any", label: "არ აქვს მნიშვნელობა", icon: "all-inclusive" },
    ];
    return (
      <>
        <Text style={styles.groupLabel}>სქესი</Text>
        {genders.map((item) => (
          <ChoiceChip key={item.id} label={item.label} icon={item.icon} selected={answers.gender === item.id} onPress={() => update("gender", item.id)} wide />
        ))}
        <Text style={styles.groupLabel}>ასაკი</Text>
        {AGE_RANGES.map((item) => (
          <ChoiceChip key={item.id} label={item.label} selected={answers.ageRange === item.id} onPress={() => update("ageRange", item.id as AgeRangeId)} wide />
        ))}
      </>
    );
  }

  if (step === 4) {
    return INTERESTS.map((item) => (
      <ChoiceChip
        key={item.id}
        label={item.label}
        icon={item.icon as keyof typeof MaterialIcons.glyphMap}
        selected={answers.interests.includes(item.id)}
        onPress={() => toggleInterest(item.id)}
        wide
      />
    ));
  }

  const budgets = [
    { label: "50 ₾-მდე", min: 0, max: 50 },
    { label: "50–100 ₾", min: 50, max: 100 },
    { label: "100–200 ₾", min: 100, max: 200 },
    { label: "200–400 ₾", min: 200, max: 400 },
    { label: "400 ₾ და მეტი", min: 400, max: 1000 },
  ];
  return budgets.map((item) => (
    <ChoiceChip
      key={item.label}
      label={item.label}
      icon="payments"
      selected={answers.minBudget === item.min && answers.maxBudget === item.max}
      onPress={() => {
        update("minBudget", item.min);
        update("maxBudget", item.max);
      }}
      wide
    />
  ));
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { height: 56, flexDirection: "row", alignItems: "center", gap: 14 },
  iconButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EADFDA", alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.62 },
  progressCopy: { flex: 1, gap: 6 },
  stepText: { color: "#C5D5FF", fontSize: 11, lineHeight: 15, fontWeight: "700", textAlign: "center" },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: "#36598C", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3, backgroundColor: "#E94F6D" },
  scrollContent: { paddingTop: 25, paddingBottom: 24 },
  questionHeader: { alignItems: "center", gap: 9, paddingHorizontal: 10, marginBottom: 28 },
  magicIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#EEE8FF", alignItems: "center", justifyContent: "center" },
  title: { color: "#F7F9FF", fontSize: 29, lineHeight: 36, fontWeight: "900", letterSpacing: -0.6, textAlign: "center" },
  subtitle: { color: "#C5D5FF", fontSize: 14, lineHeight: 21, textAlign: "center" },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  groupLabel: { width: "100%", color: "#C5D5FF", fontSize: 12, lineHeight: 17, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 8 },
  footer: { paddingTop: 12, paddingBottom: 4, gap: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#40608E" },
  footerHint: { color: "#BFD0F4", fontSize: 10, lineHeight: 14, textAlign: "center" },
});
