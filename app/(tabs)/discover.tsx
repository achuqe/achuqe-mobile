import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProductCard } from "@/components/product-card";
import { BusinessProductCard } from "@/components/business-product-card";
import { PrimaryButton } from "@/components/ui/primary-button";
import { PriceRangeFilter } from "@/components/price-range-filter";
import { SavedCatalogFilters } from "@/components/saved-catalog-filters";
import { ScreenContainer } from "@/components/screen-container";
import { INTERESTS } from "@/data/catalog";
import { useApp } from "@/lib/app-context";
import { useBusinessProductActions } from "@/hooks/use-business-product-actions";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import type { InterestId } from "@/shared/achuqe";
import { filterProductsByPrice, searchAndSortProducts, type ProductPriceSort } from "@/shared/product-search";
import { createSavedCatalogFilter, hasSavableCatalogFilter, mergeSavedCatalogFilter, type SavedCatalogFilter } from "@/shared/saved-catalog-filters";
import { loadSavedCatalogFilters, persistSavedCatalogFilters } from "@/lib/saved-catalog-filters";
import { haptic } from "@/lib/haptics";

export default function DiscoverScreen() {
  const { role, allProducts, favoriteIds, toggleFavorite, businessProducts } = useApp();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const { changeStatus, deleteProduct, changingProductId, deletingProductId } = useBusinessProductActions();
  const { data: profileData } = trpc.profile.me.useQuery(undefined, { enabled: isAuthenticated, retry: 1, staleTime: 30_000 });
  const [query, setQuery] = useState("");
  const [interest, setInterest] = useState<InterestId | null>(null);
  const [priceSort, setPriceSort] = useState<ProductPriceSort>("default");
  const [sortOpen, setSortOpen] = useState(false);
  const [minimumPrice, setMinimumPrice] = useState("");
  const [maximumPrice, setMaximumPrice] = useState("");
  const [savedFilters, setSavedFilters] = useState<SavedCatalogFilter[]>([]);

  useEffect(() => {
    let active = true;
    void loadSavedCatalogFilters().then((filters) => { if (active) setSavedFilters(filters); });
    return () => { active = false; };
  }, []);

  const products = useMemo(() => {
    const interestFiltered = allProducts.filter((product) => !interest || product.interests.includes(interest));
    const searchedAndSorted = searchAndSortProducts(interestFiltered, query, priceSort);
    return filterProductsByPrice(searchedAndSorted, minimumPrice, maximumPrice);
  }, [allProducts, interest, maximumPrice, minimumPrice, priceSort, query]);
  const openProductForm = () => router.push((profileData?.business ? "/business/product-form" : "/business/profile-form") as never);
  const currentFilter = { name: "", interest, minimumPrice, maximumPrice, priceSort };
  const canSaveCurrentFilter = hasSavableCatalogFilter(currentFilter);

  function saveCurrentFilter(name: string) {
    const nextFilter = createSavedCatalogFilter({ ...currentFilter, name });
    const next = mergeSavedCatalogFilter(savedFilters, nextFilter);
    setSavedFilters(next);
    void persistSavedCatalogFilters(next).catch(() => undefined);
    haptic.success();
  }

  function applySavedFilter(filter: SavedCatalogFilter) {
    setQuery("");
    setInterest(filter.interest);
    setMinimumPrice(filter.minimumPrice);
    setMaximumPrice(filter.maximumPrice);
    setPriceSort(filter.priceSort);
    setSortOpen(false);
    haptic.selection();
  }

  function removeSavedFilter(id: string) {
    const next = savedFilters.filter((filter) => filter.id !== id);
    setSavedFilters(next);
    void persistSavedCatalogFilters(next).catch(() => undefined);
  }

  if (role === "business") {
    return (
      <ScreenContainer>
        <FlatList
          data={businessProducts}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.businessContent, { paddingTop: Math.max(insets.top > 0 ? 82 : 68, 68) }]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={
            <View style={styles.businessHeader}>
              <View style={styles.businessTitleRow}>
                <View style={styles.businessTitleCopy}><Text style={styles.title}>ჩემი პროდუქტები</Text><Text style={styles.subtitle}>მართე კატალოგი და გამოქვეყნების სტატუსი</Text></View>
                <Pressable onPress={openProductForm} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
                  <MaterialIcons name="add" size={25} color="#FFFFFF" />
                </Pressable>
              </View>
              <View style={styles.businessFilterRow}>
                <View style={styles.businessCount}><Text style={styles.businessCountText}>{businessProducts.length} პროდუქტი</Text></View>
                <View style={styles.businessCount}><Text style={styles.businessCountText}>{businessProducts.filter((item) => item.status === "active").length} აქტიური</Text></View>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <BusinessProductCard
              product={item}
              onEdit={() => router.push({ pathname: "/business/product-form", params: { id: item.id } } as never)}
              onChangeStatus={(status) => changeStatus(item.id, status)}
              onDelete={() => deleteProduct(item.id)}
              changingStatus={changingProductId === item.id}
              deleting={deletingProductId === item.id}
            />
          )}
          ListEmptyComponent={
            <View style={styles.businessPlaceholder}>
              <MaterialIcons name="inventory-2" size={42} color="#7057D9" />
              <Text style={styles.emptyTitle}>ჯერ პროდუქტი არ დაგიმატებია</Text>
              <Text style={styles.emptyText}>შექმენი პირველი შეთავაზება და გახადე ხელმისაწვდომი საჩუქრის მაძიებლებისთვის.</Text>
              <PrimaryButton label="პროდუქტის დამატება" icon="add" variant="secondary" onPress={openProductForm} style={styles.businessCta} />
            </View>
          }
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top > 0 ? 82 : 68, 68) }]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>აღმოაჩინე</Text>
            <Text style={styles.subtitle}>საჩუქრები ქართული ბიზნესებისგან</Text>
            <View style={styles.search}>
              <MaterialIcons name="search" size={22} color="#756B70" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="მოძებნე პროდუქტის სახელით"
                placeholderTextColor="#A79CA1"
                returnKeyType="done"
                style={styles.searchInput}
              />
              {query ? (
                <Pressable onPress={() => setQuery("")} hitSlop={8}>
                  <MaterialIcons name="cancel" size={19} color="#A79CA1" />
                </Pressable>
              ) : null}
            </View>
            <FlatList
              horizontal
              data={INTERESTS}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
              renderItem={({ item }) => {
                const selected = interest === item.id;
                return (
                  <Pressable
                    onPress={() => setInterest(selected ? null : item.id)}
                    style={({ pressed }) => [styles.filter, selected && styles.filterSelected, pressed && styles.pressed]}
                  >
                    <MaterialIcons name={item.icon as keyof typeof MaterialIcons.glyphMap} size={17} color={selected ? "#FFFFFF" : "#7057D9"} />
                    <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{item.label}</Text>
                  </Pressable>
                );
              }}
            />
            <PriceRangeFilter minimum={minimumPrice} maximum={maximumPrice} onMinimumChange={setMinimumPrice} onMaximumChange={setMaximumPrice} />
            <SavedCatalogFilters filters={savedFilters} canSave={canSaveCurrentFilter} onSave={saveCurrentFilter} onApply={applySavedFilter} onRemove={removeSavedFilter} />
            <View style={styles.resultsRow}>
              <Text style={styles.resultCount}>{products.length} საჩუქარი</Text>
              <Pressable onPress={() => setSortOpen((value) => !value)} style={({ pressed }) => [styles.sortButton, pressed && styles.pressed]}>
                <MaterialIcons name="sort" size={18} color="#5C4A9B" />
                <Text style={styles.sortButtonText}>{priceSort === "price-asc" ? "ფასი: ნაკლებიდან" : priceSort === "price-desc" ? "ფასი: მეტიდან" : "დალაგება"}</Text>
              </Pressable>
            </View>
            {sortOpen ? (
              <View style={styles.sortMenu}>
                <SortOption active={priceSort === "default"} label="საწყისი რიგი" onPress={() => { setPriceSort("default"); setSortOpen(false); }} />
                <SortOption active={priceSort === "price-asc"} label="ფასი: ნაკლებიდან მეტისკენ" onPress={() => { setPriceSort("price-asc"); setSortOpen(false); }} />
                <SortOption active={priceSort === "price-desc"} label="ფასი: მეტიდან ნაკლებისკენ" onPress={() => { setPriceSort("price-desc"); setSortOpen(false); }} />
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            compact
            favorite={favoriteIds.includes(item.id)}
            onToggleFavorite={() => toggleFavorite(item.id)}
            onPress={() => router.push({ pathname: "/products/[id]", params: { id: item.id } } as never)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="search-off" size={38} color="#C9BEC3" />
            <Text style={styles.emptyTitle}>შესაბამისი საჩუქარი ვერ მოიძებნა</Text>
            <Text style={styles.emptyText}>სცადე სხვა სიტყვა ან გააუქმე არჩეული ინტერესი.</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

function SortOption({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.sortOption, pressed && styles.pressed]}><Text style={[styles.sortOptionText, active && styles.sortOptionTextActive]}>{label}</Text>{active ? <MaterialIcons name="check" size={18} color="#E94F6D" /> : null}</Pressable>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 28 },
  header: { gap: 10, paddingBottom: 17 },
  title: { color: "#F7F9FF", fontSize: 31, lineHeight: 38, fontWeight: "900", letterSpacing: -0.7 },
  subtitle: { color: "#C5D5FF", fontSize: 14, lineHeight: 20 },
  search: { height: 52, borderRadius: 17, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EADFDA", paddingHorizontal: 15, flexDirection: "row", alignItems: "center", gap: 9, marginTop: 7 },
  searchInput: { flex: 1, color: "#251F24", fontSize: 15, lineHeight: 20, paddingVertical: 0 },
  filters: { gap: 8, paddingVertical: 4, paddingRight: 20 },
  filter: { minHeight: 40, borderRadius: 14, paddingHorizontal: 13, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EADFDA", flexDirection: "row", alignItems: "center", gap: 6 },
  filterSelected: { backgroundColor: "#7057D9", borderColor: "#7057D9" },
  filterText: { color: "#4C4247", fontSize: 13, lineHeight: 17, fontWeight: "600" },
  filterTextSelected: { color: "#FFFFFF" },
  resultsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  resultCount: { color: "#C5D5FF", fontSize: 12, lineHeight: 17, fontWeight: "700" },
  sortButton: { minHeight: 36, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, borderRadius: 12, backgroundColor: "#EEE8FF" },
  sortButtonText: { color: "#5C4A9B", fontSize: 11, lineHeight: 15, fontWeight: "800" },
  sortMenu: { borderRadius: 16, overflow: "hidden", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EADFDA", shadowColor: "#000000", shadowOpacity: 0.16, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  sortOption: { minHeight: 44, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#EFE6E2" },
  sortOptionText: { color: "#4C4247", fontSize: 13, lineHeight: 18, fontWeight: "700" },
  sortOptionTextActive: { color: "#C93B58" },
  separator: { height: 12 },
  pressed: { opacity: 0.7 },
  empty: { alignItems: "center", paddingHorizontal: 24, paddingVertical: 64, gap: 8 },
  emptyTitle: { color: "#F7F9FF", fontSize: 18, lineHeight: 24, fontWeight: "800", textAlign: "center" },
  emptyText: { color: "#C5D5FF", fontSize: 14, lineHeight: 20, textAlign: "center" },
  businessPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, gap: 10 },
  businessContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 28 },
  businessHeader: { gap: 17, paddingBottom: 20 },
  businessTitleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  businessTitleCopy: { flex: 1, gap: 3 },
  addButton: { width: 48, height: 48, borderRadius: 17, backgroundColor: "#E94F6D", alignItems: "center", justifyContent: "center" },
  businessFilterRow: { flexDirection: "row", gap: 8 },
  businessCount: { borderRadius: 13, backgroundColor: "#EEE8FF", paddingHorizontal: 11, paddingVertical: 7 },
  businessCountText: { color: "#5C4A9B", fontSize: 11, lineHeight: 15, fontWeight: "700" },
  businessCta: { marginTop: 7 },
});
