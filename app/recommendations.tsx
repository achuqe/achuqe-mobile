import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { ProductCard } from "@/components/product-card";
import { ScreenContainer } from "@/components/screen-container";
import { PrimaryButton } from "@/components/ui/primary-button";
import { useApp } from "@/lib/app-context";
import { rankGiftProducts } from "@/lib/recommendations";
import type { GiftAnswers } from "@/shared/achuqe";

export default function RecommendationsScreen() {
  const params = useLocalSearchParams<{ answers?: string }>();
  const { allProducts, favoriteIds, toggleFavorite } = useApp();
  const answers = useMemo<GiftAnswers>(() => {
    try {
      return params.answers ? JSON.parse(params.answers) : { interests: [], minBudget: 0, maxBudget: 1000 };
    } catch {
      return { interests: [], minBudget: 0, maxBudget: 1000 };
    }
  }, [params.answers]);
  const ranked = useMemo(() => rankGiftProducts(allProducts, answers), [allProducts, answers]);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <FlatList
        data={ranked}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <View style={styles.topBar}>
              <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
                <MaterialIcons name="arrow-back-ios-new" size={20} color="#251F24" />
              </Pressable>
              <Text style={styles.topTitle}>შენი შედეგები</Text>
              <Pressable onPress={() => router.push({ pathname: "/gift-finder", params: { answers: JSON.stringify(answers), step: "1" } } as never)} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
                <MaterialIcons name="tune" size={22} color="#251F24" />
              </Pressable>
            </View>

            <View style={styles.successCard}>
              <View style={styles.successIcon}><MaterialIcons name="auto-awesome" size={24} color="#7057D9" /></View>
              <View style={styles.successCopy}>
                <Text style={styles.successTitle}>შევარჩიეთ {ranked.length} საჩუქარი</Text>
                <Text style={styles.successText}>შედეგები დალაგებულია თქვენი პასუხებისა და ბიუჯეტის შესაბამისობით.</Text>
              </View>
            </View>

            <View style={styles.listHeading}>
              <Text style={styles.heading}>საუკეთესო დამთხვევები</Text>
              <View style={styles.sortPill}><MaterialIcons name="sort" size={16} color="#7057D9" /><Text style={styles.sortText}>შესაბამისობით</Text></View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.resultItem}>
            <ProductCard
              product={item}
              compact
              score={item.score}
              favorite={favoriteIds.includes(item.id)}
              onToggleFavorite={() => toggleFavorite(item.id)}
              onPress={() => router.push({ pathname: "/products/[id]", params: { id: item.id, score: item.score, reasons: JSON.stringify(item.matchReasons) } } as never)}
            />
            {item.matchReasons.length > 0 ? (
              <View style={styles.reasons}>
                {item.matchReasons.slice(0, 2).map((reason) => (
                  <View key={reason} style={styles.reasonRow}>
                    <MaterialIcons name="check-circle" size={16} color="#2E9D74" />
                    <Text style={styles.reasonText}>{reason}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="sentiment-dissatisfied" size={44} color="#C8BCC2" />
            <Text style={styles.emptyTitle}>ამ ბიუჯეტში შედეგი ვერ ვიპოვეთ</Text>
            <Text style={styles.emptyText}>შეცვალე ბიუჯეტი ან ინტერესები და კიდევ ერთხელ სცადე.</Text>
            <PrimaryButton label="პასუხების შეცვლა" variant="secondary" onPress={() => router.replace({ pathname: "/gift-finder", params: { answers: JSON.stringify(answers), step: "1" } } as never)} style={styles.emptyButton} />
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 30 },
  separator: { height: 15 },
  headerWrap: { gap: 20, paddingBottom: 18 },
  topBar: { height: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EADFDA", alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.62 },
  topTitle: { color: "#F7F9FF", fontSize: 17, lineHeight: 22, fontWeight: "800" },
  successCard: { flexDirection: "row", alignItems: "center", gap: 13, backgroundColor: "#EEE8FF", borderRadius: 22, padding: 16 },
  successIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  successCopy: { flex: 1, gap: 3 },
  successTitle: { color: "#3B2E6F", fontSize: 16, lineHeight: 21, fontWeight: "800" },
  successText: { color: "#6C6093", fontSize: 12, lineHeight: 17 },
  listHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  heading: { flex: 1, color: "#F7F9FF", fontSize: 21, lineHeight: 27, fontWeight: "900" },
  sortPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: "#FFFFFF", borderRadius: 13, borderWidth: 1, borderColor: "#EADFDA" },
  sortText: { color: "#7057D9", fontSize: 11, lineHeight: 15, fontWeight: "700" },
  resultItem: { gap: 9 },
  reasons: { paddingHorizontal: 10, gap: 5 },
  reasonRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  reasonText: { color: "#C5D5FF", fontSize: 12, lineHeight: 17 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30, gap: 9 },
  emptyTitle: { color: "#F7F9FF", fontSize: 20, lineHeight: 26, fontWeight: "800", textAlign: "center" },
  emptyText: { color: "#C5D5FF", fontSize: 14, lineHeight: 20, textAlign: "center" },
  emptyButton: { marginTop: 9 },
});
