import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { PrimaryButton } from "@/components/ui/primary-button";
import { PriceRangeFilter } from "@/components/price-range-filter";
import { OCCASIONS } from "@/data/catalog";
import { resolveAssetUrl } from "@/lib/assets";
import { haptic } from "@/lib/haptics";
import { trpc } from "@/lib/trpc";
import type { GiftProduct, OccasionId } from "@/shared/achuqe";
import { filterProductsByPrice, searchAndSortProducts, type ProductPriceSort } from "@/shared/product-search";

type ProfileTab = "products" | "about";
type OccasionFilter = "all" | OccasionId;

export default function PublicBusinessProfileScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const businessId = Number(params.id);
  const [tab, setTab] = useState<ProfileTab>("products");
  const [filter, setFilter] = useState<OccasionFilter>("all");
  const [query, setQuery] = useState("");
  const [priceSort, setPriceSort] = useState<ProductPriceSort>("default");
  const [sortOpen, setSortOpen] = useState(false);
  const [minimumPrice, setMinimumPrice] = useState("");
  const [maximumPrice, setMaximumPrice] = useState("");
  const { data, isLoading } = trpc.businesses.publicProfile.useQuery(
    { id: businessId },
    { enabled: Number.isInteger(businessId) && businessId > 0, retry: 1, staleTime: 60_000 },
  );

  const filteredProducts = useMemo(() => {
    if (!data) return [];
    const occasionFiltered = filter === "all" ? data.products : data.products.filter((product) => product.occasions.includes(filter));
    const searchedAndSorted = searchAndSortProducts(occasionFiltered, query, priceSort);
    return filterProductsByPrice(searchedAndSorted, minimumPrice, maximumPrice);
  }, [data, filter, maximumPrice, minimumPrice, priceSort, query]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (!data) {
    return <UnavailableState />;
  }

  const { business } = data;
  const firstLetter = business.name.trim().slice(0, 1).toUpperCase() || "ა";

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <FlatList
        data={tab === "products" ? filteredProducts : []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PublicProductCard product={item} />}
        numColumns={2}
        columnWrapperStyle={tab === "products" && filteredProducts.length > 0 ? styles.productRow : undefined}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.cover}>
              <View style={styles.coverGlowOne} />
              <View style={styles.coverGlowTwo} />
              <MaterialIcons name="redeem" size={62} color="rgba(255,255,255,0.22)" style={styles.coverIcon} />
            </View>

            <View style={styles.topActions}>
              <Pressable accessibilityLabel="უკან დაბრუნება" onPress={() => router.back()} style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}>
                <MaterialIcons name="arrow-back-ios-new" size={19} color="#251F24" />
              </Pressable>
              <Pressable
                accessibilityLabel="ბიზნესის გაზიარება"
                onPress={() => void Share.share({ message: `${business.name} — ${business.category} · ${business.city ?? "საქართველო"}` })}
                style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
              >
                <MaterialIcons name="ios-share" size={21} color="#251F24" />
              </Pressable>
            </View>

            <View style={styles.identityCard}>
              <View style={styles.logoFallback}><Text style={styles.logoInitial}>{firstLetter}</Text></View>
              <View style={styles.identityCopy}>
                <View style={styles.nameRow}>
                  <Text numberOfLines={1} style={styles.businessName}>{business.name}</Text>
                  <MaterialIcons name="verified" size={20} color="#7057D9" />
                </View>
                <Text numberOfLines={1} style={styles.meta}>{business.category} · {business.city ?? "საქართველო"}</Text>
                <View style={styles.verifiedPill}><MaterialIcons name="check-circle" size={14} color="#2E9D74" /><Text style={styles.verifiedText}>დამოწმებული ბიზნესი</Text></View>
              </View>
            </View>

            <View style={styles.introCard}>
              <Text style={styles.introText} numberOfLines={3}>{business.description?.trim() || "ამ ბიზნესს მოკლე აღწერა ჯერ არ დაუმატებია."}</Text>
            </View>

            <View style={styles.tabs}>
              <TabButton active={tab === "products"} label={`პროდუქტები (${data.products.length})`} onPress={() => setTab("products")} />
              <TabButton active={tab === "about"} label="ბიზნესის შესახებ" onPress={() => setTab("about")} />
            </View>

            {tab === "products" ? (
              <>
                <View style={styles.search}>
                  <MaterialIcons name="search" size={20} color="#5C4A9B" />
                  <TextInput value={query} onChangeText={setQuery} placeholder="მოძებნე პროდუქტის სახელით" placeholderTextColor="#8D849D" returnKeyType="done" style={styles.searchInput} />
                  {query ? <Pressable onPress={() => setQuery("")} hitSlop={8}><MaterialIcons name="cancel" size={18} color="#8D849D" /></Pressable> : null}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
                  <FilterChip active={filter === "all"} label="ყველა" onPress={() => setFilter("all")} />
                  {OCCASIONS.map((occasion) => <FilterChip key={occasion.id} active={filter === occasion.id} label={occasion.label} onPress={() => setFilter(occasion.id)} />)}
                </ScrollView>
                <View style={styles.priceFilter}><PriceRangeFilter minimum={minimumPrice} maximum={maximumPrice} onMinimumChange={setMinimumPrice} onMaximumChange={setMaximumPrice} /></View>
                <View style={styles.catalogActions}>
                  <Text style={styles.catalogCount}>{filteredProducts.length} პროდუქტი</Text>
                  <Pressable onPress={() => setSortOpen((value) => !value)} style={({ pressed }) => [styles.sortButton, pressed && styles.pressed]}>
                    <MaterialIcons name="sort" size={18} color="#5C4A9B" />
                    <Text style={styles.sortText}>{priceSort === "price-asc" ? "ფასი ↑" : priceSort === "price-desc" ? "ფასი ↓" : "დალაგება"}</Text>
                  </Pressable>
                </View>
                {sortOpen ? (
                  <View style={styles.sortMenu}>
                    <ProfileSortOption active={priceSort === "default"} label="საწყისი რიგი" onPress={() => { setPriceSort("default"); setSortOpen(false); }} />
                    <ProfileSortOption active={priceSort === "price-asc"} label="ფასი: ნაკლებიდან მეტისკენ" onPress={() => { setPriceSort("price-asc"); setSortOpen(false); }} />
                    <ProfileSortOption active={priceSort === "price-desc"} label="ფასი: მეტიდან ნაკლებისკენ" onPress={() => { setPriceSort("price-desc"); setSortOpen(false); }} />
                  </View>
                ) : null}
              </>
            ) : null}
          </>
        }
        ListEmptyComponent={
          tab === "about" ? <BusinessAbout business={business} /> : <CatalogEmpty hasProducts={data.products.length > 0} />
        }
      />
    </ScreenContainer>
  );
}

function LoadingState() {
  return <ScreenContainer edges={["top", "bottom", "left", "right"]}><View style={styles.state}><ActivityIndicator color="#FF9CB0" size="large" /><Text style={styles.stateTitle}>ბიზნესის პროფილი იტვირთება...</Text></View></ScreenContainer>;
}

function UnavailableState() {
  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={styles.state}>
        <View style={styles.stateIcon}><MaterialIcons name="storefront" size={38} color="#7057D9" /></View>
        <Text style={styles.stateTitle}>ბიზნესი მიუწვდომელია</Text>
        <Text style={styles.stateText}>ეს გვერდი ამჟამად არ არის საჯაროდ ხელმისაწვდომი.</Text>
        <PrimaryButton label="კატალოგში დაბრუნება" variant="secondary" onPress={() => router.replace("/(tabs)/discover" as never)} style={styles.stateButton} />
      </View>
    </ScreenContainer>
  );
}

function TabButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.tab, active && styles.tabActive, pressed && styles.pressed]}><Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text></Pressable>;
}

function FilterChip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return <Pressable onPress={() => { haptic.selection(); onPress(); }} style={({ pressed }) => [styles.filterChip, active && styles.filterChipActive, pressed && styles.pressed]}><Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text></Pressable>;
}

function ProfileSortOption({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.sortOption, pressed && styles.pressed]}><Text style={[styles.sortOptionText, active && styles.sortOptionTextActive]}>{label}</Text>{active ? <MaterialIcons name="check" size={18} color="#E94F6D" /> : null}</Pressable>;
}

function PublicProductCard({ product }: { product: GiftProduct }) {
  return (
    <Pressable onPress={() => router.push({ pathname: "/products/[id]", params: { id: product.id } } as never)} style={({ pressed }) => [styles.productCard, pressed && styles.pressed]}>
      <Image source={resolveAssetUrl(product.imageUrl)} contentFit="cover" transition={180} style={styles.productImage} />
      <View style={styles.productCopy}><Text style={styles.productName} numberOfLines={2}>{product.name}</Text><Text style={styles.productPrice}>{product.price} {product.currency}</Text></View>
    </Pressable>
  );
}

function CatalogEmpty({ hasProducts }: { hasProducts: boolean }) {
  return <View style={styles.empty}><View style={styles.emptyIcon}><MaterialIcons name={hasProducts ? "filter-list-off" : "inventory-2"} size={32} color="#7057D9" /></View><Text style={styles.emptyTitle}>{hasProducts ? "ამ ფილტრში პროდუქტი არ არის" : "პროდუქტები ჯერ არ დამატებულა"}</Text><Text style={styles.emptyText}>{hasProducts ? "სცადე სხვა შემთხვევის კატეგორია." : "ამ ბიზნესის შეთავაზებები მალე გამოჩნდება."}</Text></View>;
}

function BusinessAbout({ business }: { business: { category: string; city: string | null; description: string | null; contact: string } }) {
  return (
    <View style={styles.aboutSection}>
      <InfoCard icon="storefront" label="კატეგორია" value={business.category} />
      <InfoCard icon="location-on" label="ქალაქი" value={business.city ?? "საქართველო"} />
      <InfoCard icon="local-shipping" label="შეკვეთა და მიწოდება" value="დეტალები ხელმისაწვდომია თითოეული პროდუქტის გვერდზე." />
      <InfoCard icon="contact-support" label="კონტაქტი" value={business.contact} />
    </View>
  );
}

function InfoCard({ icon, label, value }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; value: string }) {
  return <View style={styles.infoCard}><View style={styles.infoIcon}><MaterialIcons name={icon} size={20} color="#7057D9" /></View><View style={styles.infoCopy}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View></View>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 34 },
  cover: { height: 174, marginHorizontal: 20, marginTop: 12, borderRadius: 25, overflow: "hidden", backgroundColor: "#32276E", position: "relative" },
  coverGlowOne: { position: "absolute", width: 190, height: 190, borderRadius: 95, backgroundColor: "#E94F6D", opacity: 0.72, top: -80, right: -38 },
  coverGlowTwo: { position: "absolute", width: 132, height: 132, borderRadius: 66, backgroundColor: "#7057D9", opacity: 0.9, bottom: -55, left: 38 },
  coverIcon: { position: "absolute", right: 24, bottom: 23 },
  topActions: { position: "absolute", left: 33, right: 33, top: 25, flexDirection: "row", justifyContent: "space-between" },
  circleButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.96)", alignItems: "center", justifyContent: "center", shadowColor: "#000000", shadowOpacity: 0.16, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  identityCard: { marginHorizontal: 20, marginTop: -29, backgroundColor: "#FFFFFF", borderRadius: 23, padding: 15, flexDirection: "row", alignItems: "center", gap: 13, borderWidth: 1, borderColor: "#EADFDA", shadowColor: "#000000", shadowOpacity: 0.2, shadowRadius: 13, shadowOffset: { width: 0, height: 7 }, elevation: 6 },
  logoFallback: { width: 64, height: 64, borderRadius: 21, backgroundColor: "#E94F6D", alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: "#FDEEF1" },
  logoInitial: { color: "#FFFFFF", fontSize: 29, lineHeight: 35, fontWeight: "900" },
  identityCopy: { flex: 1, gap: 3 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  businessName: { flexShrink: 1, color: "#251F24", fontSize: 18, lineHeight: 23, fontWeight: "900" },
  meta: { color: "#5F555A", fontSize: 12, lineHeight: 17, fontWeight: "600" },
  verifiedPill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#E7F5EF", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  verifiedText: { color: "#236B51", fontSize: 10, lineHeight: 14, fontWeight: "800" },
  introCard: { marginHorizontal: 20, marginTop: 12, borderRadius: 18, padding: 14, backgroundColor: "#112C5A", borderWidth: 1, borderColor: "#315685" },
  introText: { color: "#E2EAFF", fontSize: 14, lineHeight: 21 },
  tabs: { flexDirection: "row", marginTop: 21, marginHorizontal: 20, gap: 8, borderBottomWidth: 1, borderBottomColor: "#335681" },
  tab: { flex: 1, minHeight: 43, alignItems: "center", justifyContent: "center", borderBottomWidth: 3, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: "#FF9CB0" },
  tabText: { color: "#C5D5FF", fontSize: 13, lineHeight: 18, fontWeight: "800" },
  tabTextActive: { color: "#F7F9FF" },
  search: { height: 48, marginHorizontal: 20, marginTop: 14, paddingHorizontal: 13, gap: 8, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EADFDA", flexDirection: "row", alignItems: "center" },
  searchInput: { flex: 1, color: "#251F24", fontSize: 14, lineHeight: 19, paddingVertical: 0 },
  filters: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16, gap: 8 },
  priceFilter: { marginHorizontal: 20, marginBottom: 12 },
  filterChip: { minHeight: 36, justifyContent: "center", paddingHorizontal: 13, borderRadius: 18, backgroundColor: "#173661", borderWidth: 1, borderColor: "#3B5D89" },
  filterChipActive: { backgroundColor: "#E94F6D", borderColor: "#E94F6D" },
  filterText: { color: "#D8E3FF", fontSize: 12, lineHeight: 16, fontWeight: "800" },
  filterTextActive: { color: "#FFFFFF" },
  catalogActions: { paddingHorizontal: 20, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  catalogCount: { color: "#C5D5FF", fontSize: 12, lineHeight: 17, fontWeight: "800" },
  sortButton: { minHeight: 34, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, borderRadius: 12, backgroundColor: "#EEE8FF" },
  sortText: { color: "#5C4A9B", fontSize: 11, lineHeight: 15, fontWeight: "900" },
  sortMenu: { marginHorizontal: 20, marginBottom: 14, borderRadius: 16, overflow: "hidden", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EADFDA" },
  sortOption: { minHeight: 43, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#EFE6E2" },
  sortOptionText: { color: "#4C4247", fontSize: 13, lineHeight: 18, fontWeight: "700" },
  sortOptionTextActive: { color: "#C93B58" },
  productRow: { gap: 12, paddingHorizontal: 20 },
  productCard: { flex: 1, maxWidth: "48.5%", marginBottom: 13, overflow: "hidden", borderRadius: 19, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EADFDA", shadowColor: "#000000", shadowOpacity: 0.18, shadowRadius: 11, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  productImage: { width: "100%", aspectRatio: 0.78, backgroundColor: "#EEE8FF" },
  productCopy: { padding: 11, gap: 5 },
  productName: { color: "#2E2830", fontSize: 13, lineHeight: 18, fontWeight: "800", minHeight: 36 },
  productPrice: { color: "#C93B58", fontSize: 15, lineHeight: 20, fontWeight: "900" },
  empty: { alignItems: "center", paddingHorizontal: 38, paddingTop: 28, gap: 8 },
  emptyIcon: { width: 62, height: 62, borderRadius: 21, backgroundColor: "#EEE8FF", alignItems: "center", justifyContent: "center" },
  emptyTitle: { color: "#F7F9FF", fontSize: 16, lineHeight: 22, fontWeight: "900", textAlign: "center" },
  emptyText: { color: "#C5D5FF", fontSize: 13, lineHeight: 19, textAlign: "center" },
  aboutSection: { gap: 10, marginHorizontal: 20, paddingTop: 18 },
  infoCard: { padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 11, borderRadius: 18, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EADFDA" },
  infoIcon: { width: 36, height: 36, borderRadius: 13, backgroundColor: "#EEE8FF", alignItems: "center", justifyContent: "center" },
  infoCopy: { flex: 1, gap: 2 },
  infoLabel: { color: "#5F555A", fontSize: 11, lineHeight: 15, fontWeight: "800" },
  infoValue: { color: "#2E2830", fontSize: 14, lineHeight: 20, fontWeight: "700" },
  state: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30, gap: 12 },
  stateIcon: { width: 76, height: 76, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: "#EEE8FF" },
  stateTitle: { color: "#F7F9FF", fontSize: 19, lineHeight: 25, fontWeight: "900", textAlign: "center" },
  stateText: { color: "#C5D5FF", fontSize: 14, lineHeight: 21, textAlign: "center" },
  stateButton: { marginTop: 6, minWidth: 220 },
  pressed: { opacity: 0.68, transform: [{ scale: 0.97 }] },
});
