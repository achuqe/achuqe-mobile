import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { PrimaryButton } from "@/components/ui/primary-button";
import { INTERESTS, OCCASIONS } from "@/data/catalog";
import { useApp } from "@/lib/app-context";
import { resolveAssetUrl } from "@/lib/assets";
import { haptic } from "@/lib/haptics";

export default function ProductDetailScreen() {
  const params = useLocalSearchParams<{ id: string; score?: string; reasons?: string }>();
  const { allProducts, favoriteIds, toggleFavorite } = useApp();
  const product = allProducts.find((item) => item.id === params.id);
  const favorite = product ? favoriteIds.includes(product.id) : false;
  let reasons: string[] = [];
  try {
    reasons = params.reasons ? JSON.parse(params.reasons) : [];
  } catch {
    reasons = [];
  }

  if (!product) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <View style={styles.notFound}>
          <MaterialIcons name="inventory-2" size={42} color="#C8BCC2" />
          <Text style={styles.notFoundTitle}>პროდუქტი ვერ მოიძებნა</Text>
          <PrimaryButton label="უკან დაბრუნება" variant="secondary" onPress={() => router.back()} />
        </View>
      </ScreenContainer>
    );
  }

  const occasionLabels = OCCASIONS.filter((item) => product.occasions.includes(item.id)).map((item) => item.label);
  const interestLabels = INTERESTS.filter((item) => product.interests.includes(item.id)).map((item) => item.label);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.imageWrap}>
          <Image source={resolveAssetUrl(product.imageUrl)} contentFit="cover" transition={220} cachePolicy="memory-disk" style={styles.image} />
          <View style={styles.topButtons}>
            <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}>
              <MaterialIcons name="arrow-back-ios-new" size={20} color="#251F24" />
            </Pressable>
            <View style={styles.topActions}>
              <Pressable
                onPress={() => void Share.share({ message: `${product.name} — ${product.price} ${product.currency}` })}
                style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
              >
                <MaterialIcons name="ios-share" size={21} color="#251F24" />
              </Pressable>
              <Pressable
                onPress={() => {
                  haptic.selection();
                  toggleFavorite(product.id);
                }}
                style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
              >
                <MaterialIcons name={favorite ? "favorite" : "favorite-border"} size={22} color="#E94F6D" />
              </Pressable>
            </View>
          </View>
          {params.score ? (
            <View style={styles.matchBadge}>
              <MaterialIcons name="auto-awesome" size={16} color="#7057D9" />
              <Text style={styles.matchText}>{params.score}% შესაბამისობა</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <Pressable
            disabled={!/^\d+$/.test(product.businessId)}
            onPress={() => router.push({ pathname: "/businesses/[id]", params: { id: product.businessId } } as never)}
            style={({ pressed }) => [styles.businessRow, pressed && /^\d+$/.test(product.businessId) && styles.pressed]}
          >
            <View style={styles.businessAvatar}><MaterialIcons name="storefront" size={19} color="#7057D9" /></View>
            <View style={styles.businessCopy}>
              <Text style={styles.businessName}>{product.businessName}</Text>
              <Text style={styles.location}>{product.city} · დამოწმებული ბიზნესი</Text>
            </View>
            <MaterialIcons name="verified" size={20} color="#7057D9" />
            {/^\d+$/.test(product.businessId) ? <MaterialIcons name="chevron-right" size={20} color="#C5D5FF" /> : null}
          </Pressable>

          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.price}>{product.price} {product.currency}</Text>

          {reasons.length > 0 ? (
            <View style={styles.matchCard}>
              <Text style={styles.matchCardTitle}>რატომ შეგირჩიეთ</Text>
              {reasons.map((reason) => (
                <View key={reason} style={styles.reasonRow}>
                  <MaterialIcons name="check-circle" size={18} color="#2E9D74" />
                  <Text style={styles.reasonText}>{reason}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>პროდუქტის შესახებ</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          <View style={styles.infoGrid}>
            <InfoCard icon="local-shipping" title="მიწოდება" value={product.deliveryLabel} />
            <InfoCard icon="inventory" title="ხელმისაწვდომობა" value="მარაგშია" />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>რისთვის გამოდგება</Text>
            <View style={styles.tags}>
              {[...occasionLabels, ...interestLabels].slice(0, 7).map((label) => (
                <View key={label} style={styles.tag}><Text style={styles.tagText}>{label}</Text></View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="შეკვეთის შექმნა"
          icon="shopping-bag"
          onPress={() => {
            router.push({ pathname: "/order-checkout", params: { productId: product.id } } as never);
          }}
          style={styles.footerButton}
        />
      </View>
    </ScreenContainer>
  );
}

function InfoCard({ icon, title, value }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; value: string }) {
  return (
    <View style={styles.infoCard}>
      <MaterialIcons name={icon} size={22} color="#7057D9" />
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 104 },
  imageWrap: { height: 390, backgroundColor: "#F7EAE5", position: "relative" },
  image: { width: "100%", height: "100%" },
  topButtons: { position: "absolute", top: 13, left: 17, right: 17, flexDirection: "row", justifyContent: "space-between" },
  topActions: { flexDirection: "row", gap: 9 },
  circleButton: { width: 43, height: 43, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.94)", alignItems: "center", justifyContent: "center", shadowColor: "#402832", shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  pressed: { opacity: 0.65, transform: [{ scale: 0.96 }] },
  matchBadge: { position: "absolute", left: 18, bottom: 17, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 15, paddingHorizontal: 11, paddingVertical: 8 },
  matchText: { color: "#7057D9", fontSize: 12, lineHeight: 16, fontWeight: "800" },
  body: { paddingHorizontal: 20, paddingTop: 20, gap: 18 },
  businessRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  businessAvatar: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#EEE8FF", alignItems: "center", justifyContent: "center" },
  businessCopy: { flex: 1, gap: 1 },
  businessName: { color: "#F7F9FF", fontSize: 14, lineHeight: 19, fontWeight: "800" },
  location: { color: "#C5D5FF", fontSize: 11, lineHeight: 15 },
  title: { color: "#F7F9FF", fontSize: 27, lineHeight: 34, fontWeight: "900", letterSpacing: -0.5 },
  price: { color: "#E94F6D", fontSize: 25, lineHeight: 31, fontWeight: "900" },
  matchCard: { backgroundColor: "#E7F5EF", borderRadius: 20, padding: 16, gap: 9 },
  matchCardTitle: { color: "#236B51", fontSize: 15, lineHeight: 20, fontWeight: "800" },
  reasonRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  reasonText: { flex: 1, color: "#3C6657", fontSize: 13, lineHeight: 18 },
  section: { gap: 10 },
  sectionTitle: { color: "#F7F9FF", fontSize: 18, lineHeight: 24, fontWeight: "800" },
  description: { color: "#C5D5FF", fontSize: 15, lineHeight: 23 },
  infoGrid: { flexDirection: "row", gap: 10 },
  infoCard: { flex: 1, minHeight: 112, borderRadius: 19, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EADFDA", padding: 14, gap: 4 },
  infoTitle: { color: "#756B70", fontSize: 11, lineHeight: 15, fontWeight: "700", marginTop: 3 },
  infoValue: { color: "#3D353A", fontSize: 13, lineHeight: 18, fontWeight: "700" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { backgroundColor: "#F7ECE8", borderRadius: 13, paddingHorizontal: 11, paddingVertical: 7 },
  tagText: { color: "#655A60", fontSize: 12, lineHeight: 16, fontWeight: "600" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, backgroundColor: "#061C44", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#355681" },
  footerButton: { width: "100%" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, gap: 12 },
  notFoundTitle: { color: "#F7F9FF", fontSize: 20, lineHeight: 26, fontWeight: "800" },
});
