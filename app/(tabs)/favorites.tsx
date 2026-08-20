import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProductCard } from "@/components/product-card";
import { ScreenContainer } from "@/components/screen-container";
import { PrimaryButton } from "@/components/ui/primary-button";
import { useApp } from "@/lib/app-context";

export default function FavoritesScreen() {
  const { role, allProducts, favoriteIds, toggleFavorite } = useApp();
  const insets = useSafeAreaInsets();

  if (role === "business") {
    return (
      <ScreenContainer>
        <View style={[styles.businessAdd, { paddingTop: Math.max(insets.top > 0 ? 82 : 68, 68) }]}>
          <View style={styles.businessVisual}>
            <View style={styles.businessVisualCircle}><MaterialIcons name="add-business" size={54} color="#7057D9" /></View>
            <View style={styles.businessSpark}><MaterialIcons name="auto-awesome" size={24} color="#F3B84B" /></View>
          </View>
          <View style={styles.businessCopy}>
            <Text style={styles.businessTitle}>დაამატე ახალი პროდუქტი</Text>
            <Text style={styles.businessText}>მიუთითე ფოტო, ფასი და ვისთვისაა საჩუქარი — დანარჩენს რეკომენდაციის სისტემა მიხედავს.</Text>
          </View>
          <PrimaryButton label="პროდუქტის შექმნა" icon="add" onPress={() => router.push("/business/product-form" as never)} style={styles.businessButton} />
          <View style={styles.tipCard}>
            <MaterialIcons name="tips-and-updates" size={22} color="#E94F6D" />
            <Text style={styles.tipText}>რჩევა: ნათელი ფოტო და ზუსტად მონიშნული ინტერესები პროდუქტს უკეთეს მომხმარებელთან აკავშირებს.</Text>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  const favorites = allProducts.filter((product) => favoriteIds.includes(product.id));

  return (
    <ScreenContainer>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top > 0 ? 82 : 68, 68) }]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>რჩეულები</Text>
            <Text style={styles.subtitle}>შეინახე საუკეთესო იდეები და შეადარე მოგვიანებით</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            compact
            favorite
            onToggleFavorite={() => toggleFavorite(item.id)}
            onPress={() => router.push({ pathname: "/products/[id]", params: { id: item.id } } as never)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="favorite-border" size={42} color="#E94F6D" />
            </View>
            <Text style={styles.emptyTitle}>აქ ჯერ არაფერია</Text>
            <Text style={styles.emptyText}>საჩუქრის ბარათზე გულის ნიშნით შენთვის საინტერესო იდეა შეინახე.</Text>
            <PrimaryButton label="აღმოაჩინე საჩუქრები" variant="secondary" onPress={() => router.push("/(tabs)/discover" as never)} style={styles.button} />
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 28 },
  header: { gap: 5, paddingBottom: 20 },
  title: { color: "#F7F9FF", fontSize: 31, lineHeight: 38, fontWeight: "900", letterSpacing: -0.7 },
  subtitle: { color: "#C5D5FF", fontSize: 14, lineHeight: 20 },
  separator: { height: 12 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 26, gap: 10 },
  emptyIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#FBE2E8", alignItems: "center", justifyContent: "center", marginBottom: 5 },
  emptyTitle: { color: "#F7F9FF", fontSize: 21, lineHeight: 27, fontWeight: "800", textAlign: "center" },
  emptyText: { color: "#C5D5FF", fontSize: 14, lineHeight: 21, textAlign: "center" },
  button: { marginTop: 10 },
  businessAdd: { flex: 1, paddingHorizontal: 22, paddingBottom: 24, justifyContent: "center", gap: 17 },
  businessVisual: { height: 220, alignItems: "center", justifyContent: "center", position: "relative" },
  businessVisualCircle: { width: 164, height: 164, borderRadius: 52, backgroundColor: "#EEE8FF", alignItems: "center", justifyContent: "center", transform: [{ rotate: "-4deg" }] },
  businessSpark: { position: "absolute", top: 30, right: "19%" },
  businessCopy: { gap: 8, alignItems: "center" },
  businessTitle: { color: "#F7F9FF", fontSize: 28, lineHeight: 35, fontWeight: "900", textAlign: "center", letterSpacing: -0.6 },
  businessText: { color: "#C5D5FF", fontSize: 14, lineHeight: 21, textAlign: "center" },
  businessButton: { marginTop: 4 },
  tipCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#FBE2E8", borderRadius: 18, padding: 14 },
  tipText: { flex: 1, color: "#7E4A56", fontSize: 12, lineHeight: 18 },
});
