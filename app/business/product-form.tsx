import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { ChoiceChip } from "@/components/ui/choice-chip";
import { PrimaryButton } from "@/components/ui/primary-button";
import { AGE_RANGES, INTERESTS, OCCASIONS } from "@/data/catalog";
import { useAuth } from "@/hooks/use-auth";
import { useApp } from "@/lib/app-context";
import { resolveAssetUrl } from "@/lib/assets";
import { haptic } from "@/lib/haptics";
import { trpc } from "@/lib/trpc";
import type { ProductDraft, ProductStatus, RecipientGender } from "@/shared/achuqe";

const emptyDraft: ProductDraft = {
  name: "",
  description: "",
  price: "",
  imageUrl: "",
  occasions: [],
  interests: [],
  ageRanges: [],
  genders: ["any"],
  relationships: ["partner", "friend", "family", "colleague"],
  deliveryLabel: "მიწოდება 1–2 დღეში",
  city: "თბილისი",
  status: "active",
};

export default function ProductFormScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { businessProducts, businessProfile, saveProduct } = useApp();
  const { isAuthenticated } = useAuth();
  const existing = useMemo(
    () => businessProducts.find((item) => item.id === params.id),
    [businessProducts, params.id],
  );
  const [draft, setDraft] = useState<ProductDraft>(() =>
    existing
      ? {
          id: existing.id,
          name: existing.name,
          description: existing.description,
          price: String(existing.price),
          imageUrl: existing.imageUrl,
          occasions: existing.occasions,
          interests: existing.interests,
          ageRanges: existing.ageRanges,
          genders: existing.genders,
          relationships: existing.relationships,
          deliveryLabel: existing.deliveryLabel,
          city: existing.city,
          status: existing.status,
        }
      : emptyDraft,
  );
  const [submitting, setSubmitting] = useState(false);
  const saveBusinessMutation = trpc.profile.saveBusiness.useMutation();
  const uploadMutation = trpc.products.uploadImage.useMutation();
  const createMutation = trpc.products.create.useMutation();
  const updateMutation = trpc.products.update.useMutation();

  const update = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const toggleArray = <K extends "occasions" | "interests" | "ageRanges" | "genders">(
    key: K,
    value: ProductDraft[K][number],
  ) => {
    const items = draft[key] as string[];
    update(
      key,
      (items.includes(value as string)
        ? items.filter((item) => item !== value)
        : [...items, value]) as ProductDraft[K],
    );
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.82,
    });
    if (!result.canceled) {
      update("imageUrl", result.assets[0].uri);
      haptic.success();
    }
  };

  const submit = async (status: EditableProductStatus) => {
    const price = Number(draft.price.replace(",", "."));
    if (
      !draft.name.trim() ||
      !draft.description.trim() ||
      !Number.isFinite(price) ||
      price <= 0 ||
      draft.occasions.length === 0 ||
      draft.interests.length === 0
    ) {
      Alert.alert(
        "შეამოწმე ინფორმაცია",
        "შეავსე სახელი, აღწერა, სწორი ფასი და მონიშნე მინიმუმ ერთი შემთხვევა და ინტერესი.",
      );
      haptic.error();
      return;
    }

    setSubmitting(true);
    let imageUrl = draft.imageUrl || "/manus-storage/achuqe-product-headphones_277f9213.png";
    let serverId: number | undefined;

    try {
      if (isAuthenticated) {
        await saveBusinessMutation.mutateAsync(businessProfile);

        if (isLocalImageUri(imageUrl)) {
          const uploadInput = await readImageForUpload(imageUrl);
          const uploaded = await uploadMutation.mutateAsync(uploadInput);
          imageUrl = uploaded.url;
        }

        const product = {
          name: draft.name.trim(),
          description: draft.description.trim(),
          price,
          imageUrl,
          occasions: draft.occasions,
          interests: draft.interests,
          ageRanges: draft.ageRanges,
          genders: draft.genders,
          relationships: draft.relationships,
          deliveryLabel: draft.deliveryLabel.trim(),
          city: draft.city.trim(),
          status,
        };

        const numericId = existing && /^\d+$/.test(existing.id) ? Number(existing.id) : null;
        if (numericId) {
          await updateMutation.mutateAsync({ id: numericId, product });
          serverId = numericId;
        } else {
          serverId = await createMutation.mutateAsync(product);
        }
      }

      saveProduct({
        ...draft,
        id: serverId ? String(serverId) : draft.id,
        imageUrl,
        price: String(price),
        status,
      });
      haptic.success();
      router.back();
    } catch {
      saveProduct({ ...draft, imageUrl, price: String(price), status });
      haptic.error();
      Alert.alert(
        "შენახულია მოწყობილობაზე",
        "პროდუქტის სერვერზე სინქრონიზაცია დროებით ვერ მოხერხდა. მონაცემები ამ მოწყობილობაზე შენარჩუნებულია.",
      );
      router.back();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <MaterialIcons name="close" size={23} color="#251F24" />
          </Pressable>
          <Text style={styles.headerTitle}>{existing ? "პროდუქტის რედაქტირება" : "ახალი პროდუქტი"}</Text>
          <Pressable
            disabled={submitting}
            onPress={() => void submit("draft")}
            style={({ pressed }) => [styles.draftButton, pressed && styles.pressed]}
          >
            <Text style={styles.draftText}>მონახაზი</Text>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>პროდუქტის ფოტო</Text>
            <Pressable onPress={pickImage} style={({ pressed }) => [styles.imagePicker, pressed && styles.pressed]}>
              {draft.imageUrl ? (
                <Image source={resolveAssetUrl(draft.imageUrl)} contentFit="cover" transition={180} style={styles.selectedImage} />
              ) : (
                <View style={styles.imageEmpty}>
                  <View style={styles.cameraIcon}><MaterialIcons name="add-a-photo" size={28} color="#7057D9" /></View>
                  <Text style={styles.imageTitle}>დაამატე მთავარი ფოტო</Text>
                  <Text style={styles.imageHint}>ვერტიკალური, ნათელი ფოტო საუკეთესო შედეგს იძლევა</Text>
                </View>
              )}
              {draft.imageUrl ? (
                <View style={styles.changePhoto}>
                  <MaterialIcons name="photo-camera" size={17} color="#FFFFFF" />
                  <Text style={styles.changePhotoText}>შეცვლა</Text>
                </View>
              ) : null}
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ძირითადი ინფორმაცია</Text>
            <Field label="დასახელება *" value={draft.name} onChangeText={(value) => update("name", value)} placeholder="მაგ. ხელნაკეთი კერამიკის ნაკრები" />
            <Field label="აღწერა *" value={draft.description} onChangeText={(value) => update("description", value)} placeholder="რა შედის პროდუქტში და რით არის განსაკუთრებული?" multiline />
            <View style={styles.priceRow}>
              <View style={styles.priceField}>
                <Field label="ფასი *" value={draft.price} onChangeText={(value) => update("price", value)} placeholder="0.00" keyboardType="decimal-pad" />
              </View>
              <View style={styles.currencyBox}>
                <Text style={styles.currencyLabel}>ვალუტა</Text>
                <View style={styles.currencyValue}><Text style={styles.currencyText}>₾ GEL</Text></View>
              </View>
            </View>
          </View>

          <TagSection title="რომელი შემთხვევისთვისაა? *" hint="აირჩიე მინიმუმ ერთი">
            {OCCASIONS.map((item) => (
              <ChoiceChip key={item.id} label={item.label} selected={draft.occasions.includes(item.id)} onPress={() => toggleArray("occasions", item.id)} wide />
            ))}
          </TagSection>
          <TagSection title="რა ინტერესებს ემთხვევა? *" hint="რამდენიმე არჩევანი რეკომენდაციას აუმჯობესებს">
            {INTERESTS.map((item) => (
              <ChoiceChip key={item.id} label={item.label} icon={item.icon as keyof typeof MaterialIcons.glyphMap} selected={draft.interests.includes(item.id)} onPress={() => toggleArray("interests", item.id)} wide />
            ))}
          </TagSection>
          <TagSection title="ასაკობრივი ჯგუფები" hint="ვისთვის იქნება ყველაზე შესაფერისი">
            {AGE_RANGES.map((item) => (
              <ChoiceChip key={item.id} label={item.label} selected={draft.ageRanges.includes(item.id)} onPress={() => toggleArray("ageRanges", item.id)} wide />
            ))}
          </TagSection>
          <TagSection title="სქესი" hint="შეგიძლია დატოვო უნივერსალური">
            {([
              { id: "woman", label: "ქალი", icon: "female" },
              { id: "man", label: "კაცი", icon: "male" },
              { id: "any", label: "უნივერსალური", icon: "all-inclusive" },
            ] as const).map((item) => (
              <ChoiceChip key={item.id} label={item.label} icon={item.icon} selected={draft.genders.includes(item.id as RecipientGender)} onPress={() => toggleArray("genders", item.id)} wide />
            ))}
          </TagSection>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>მიწოდება</Text>
            <Field label="ქალაქი" value={draft.city} onChangeText={(value) => update("city", value)} placeholder="თბილისი" />
            <Field label="მიწოდების ინფორმაცია" value={draft.deliveryLabel} onChangeText={(value) => update("deliveryLabel", value)} placeholder="მიწოდება 1–2 დღეში" />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={existing ? "ცვლილებების გამოქვეყნება" : "პროდუქტის გამოქვეყნება"}
            icon="publish"
            onPress={() => void submit("active")}
            loading={submitting}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function isLocalImageUri(uri: string) {
  return /^(file|content|ph|blob):/.test(uri);
}

async function readImageForUpload(uri: string): Promise<{
  base64: string;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  extension: "jpg" | "png" | "webp";
}> {
  if (Platform.OS === "web") {
    const response = await fetch(uri);
    const blob = await response.blob();
    if (blob.size > 7_000_000) throw new Error("Image exceeds 7 MB limit");
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
      reader.readAsDataURL(blob);
    });
    const contentType = normalizeImageType(blob.type);
    return { base64, contentType, extension: extensionForType(contentType) };
  }

  const file = new File(uri);
  if (file.size > 7_000_000) throw new Error("Image exceeds 7 MB limit");
  const contentType = normalizeImageType(file.type);
  return {
    base64: await file.base64(),
    contentType,
    extension: extensionForType(contentType),
  };
}

function normalizeImageType(type: string): "image/jpeg" | "image/png" | "image/webp" {
  if (type === "image/png" || type === "image/webp") return type;
  return "image/jpeg";
}

function extensionForType(type: "image/jpeg" | "image/png" | "image/webp"): "jpg" | "png" | "webp" {
  return type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
}

function TagSection({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionHint}>{hint}</Text>
      <View style={styles.chips}>{children}</View>
    </View>
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
  headerTitle: { color: "#F7F9FF", fontSize: 16, lineHeight: 21, fontWeight: "800" },
  draftButton: { width: 72, minHeight: 42, alignItems: "flex-end", justifyContent: "center" },
  draftText: { color: "#7057D9", fontSize: 12, lineHeight: 17, fontWeight: "800" },
  pressed: { opacity: 0.62 },
  content: { paddingHorizontal: 20, paddingTop: 13, paddingBottom: 30, gap: 24 },
  section: { gap: 10 },
  sectionTitle: { color: "#F7F9FF", fontSize: 18, lineHeight: 24, fontWeight: "800" },
  sectionHint: { color: "#C5D5FF", fontSize: 12, lineHeight: 17, marginTop: -5 },
  imagePicker: { height: 230, borderRadius: 22, overflow: "hidden", backgroundColor: "#F7ECE8", borderWidth: 1, borderColor: "#EADFDA", borderStyle: "dashed" },
  selectedImage: { width: "100%", height: "100%" },
  imageEmpty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 35, gap: 8 },
  cameraIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: "#EEE8FF", alignItems: "center", justifyContent: "center" },
  imageTitle: { color: "#3D353A", fontSize: 16, lineHeight: 21, fontWeight: "800" },
  imageHint: { color: "#8C7F85", fontSize: 12, lineHeight: 17, textAlign: "center" },
  changePhoto: { position: "absolute", right: 12, bottom: 12, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(37,31,36,0.82)", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8 },
  changePhotoText: { color: "#FFFFFF", fontSize: 11, lineHeight: 15, fontWeight: "800" },
  field: { gap: 7 },
  label: { color: "#C5D5FF", fontSize: 13, lineHeight: 18, fontWeight: "700" },
  input: { minHeight: 52, backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#EADFDA", paddingHorizontal: 15, color: "#251F24", fontSize: 15, lineHeight: 20 },
  textarea: { minHeight: 116, paddingTop: 14 },
  priceRow: { flexDirection: "row", gap: 10, alignItems: "flex-end" },
  priceField: { flex: 1 },
  currencyBox: { width: 108, gap: 7 },
  currencyLabel: { color: "#C5D5FF", fontSize: 13, lineHeight: 18, fontWeight: "700" },
  currencyValue: { minHeight: 52, backgroundColor: "#F2ECE9", borderRadius: 16, alignItems: "center", justifyContent: "center" },
  currencyText: { color: "#756B70", fontSize: 15, lineHeight: 20, fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#EADFDA" },
});
type EditableProductStatus = Exclude<ProductStatus, "deleted">;
