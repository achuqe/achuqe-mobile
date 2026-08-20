import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandMark } from "@/components/brand-mark";
import { BusinessProductCard } from "@/components/business-product-card";
import { ProductCard } from "@/components/product-card";
import { ScreenContainer } from "@/components/screen-container";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SectionHeader } from "@/components/ui/section-header";
import { OCCASIONS } from "@/data/catalog";
import { useApp } from "@/lib/app-context";
import { haptic } from "@/lib/haptics";
import { useBusinessProductActions } from "@/hooks/use-business-product-actions";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

export default function HomeScreen() {
  const { role } = useApp();
  if (role === "business") {
    return <BusinessDashboard />;
  }
  return <ConsumerHome />;
}

function ConsumerHome() {
  const { allProducts, favoriteIds, toggleFavorite, chooseRole } = useApp();
  const insets = useSafeAreaInsets();
  const featured = allProducts.filter((product) => product.featured || product.status === "active").slice(0, 5);

  return (
    <ScreenContainer>
      <FlatList
        data={[]}
        keyExtractor={(_, index) => String(index)}
        renderItem={() => null}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top > 0 ? 82 : 68, 68) }]}
        ListHeaderComponent={
          <View style={styles.page}>
            <View style={styles.topBar}>
              <BrandMark />
              <Pressable
                onPress={() => router.push({ pathname: "/settings", params: { section: "notifications" } } as never)}
                style={({ pressed }) => [styles.notification, pressed && styles.pressed]}
              >
                <MaterialIcons name="notifications-none" size={24} color="#251F24" />
                <View style={styles.notificationDot} />
              </Pressable>
            </View>

            <View style={styles.greeting}>
              <Text style={styles.kicker}>გამარჯობა</Text>
              <Text style={styles.title}>ვის ვახარებთ დღეს?</Text>
            </View>

            <View style={styles.heroCard}>
              <View style={styles.heroDecorationOne} />
              <View style={styles.heroDecorationTwo} />
              <View style={styles.heroCopy}>
                <View style={styles.aiPill}>
                  <MaterialIcons name="auto-awesome" size={15} color="#FFFFFF" />
                  <Text style={styles.aiPillText}>ჭკვიანი შერჩევა</Text>
                </View>
                <Text style={styles.heroTitle}>საჩუქარი, რომელიც ზუსტად მოერგება</Text>
                <Text style={styles.heroSubtitle}>უპასუხე 6 მარტივ კითხვას და მიიღე პერსონალური იდეები.</Text>
                <PrimaryButton
                  label="იპოვე საჩუქარი"
                  icon="redeem"
                  variant="dark"
                  onPress={() => router.push("/gift-finder" as never)}
                  style={styles.heroButton}
                />
              </View>
              <View style={styles.giftOrb}>
                <MaterialIcons name="redeem" size={52} color="#E94F6D" />
              </View>
            </View>

            <SectionHeader title="რა აღვნიშნოთ?" subtitle="აირჩიე შემთხვევა და დაიწყე სწრაფად" />
            <FlatList
              horizontal
              data={OCCASIONS}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.occasionList}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => router.push({ pathname: "/gift-finder", params: { occasion: item.id } } as never)}
                  style={({ pressed }) => [styles.occasionCard, { backgroundColor: item.tint }, pressed && styles.pressed]}
                >
                  <MaterialIcons name={item.icon as keyof typeof MaterialIcons.glyphMap} size={25} color="#7057D9" />
                  <Text style={styles.occasionLabel}>{item.label}</Text>
                </Pressable>
              )}
            />

            <SectionHeader
              title="შენთვის შერჩეული"
              subtitle="პოპულარული იდეები ქართული ბიზნესებისგან"
              actionLabel="ყველა"
              onAction={() => router.push("/(tabs)/discover" as never)}
            />
            <FlatList
              horizontal
              data={featured}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productList}
              renderItem={({ item }) => (
                <ProductCard
                  product={item}
                  favorite={favoriteIds.includes(item.id)}
                  onToggleFavorite={() => toggleFavorite(item.id)}
                  onPress={() => router.push({ pathname: "/products/[id]", params: { id: item.id } } as never)}
                />
              )}
            />

            <Pressable
              onPress={() => {
                haptic.medium();
                chooseRole("business");
                router.push("/business/profile-form" as never);
              }}
              style={({ pressed }) => [styles.businessBanner, pressed && styles.pressed]}
            >
              <View style={styles.businessIcon}>
                <MaterialIcons name="storefront" size={27} color="#7057D9" />
              </View>
              <View style={styles.businessCopy}>
                <Text style={styles.businessTitle}>გაქვს ბიზნესი?</Text>
                <Text style={styles.businessText}>დაამატე პროდუქტები და გახდი ჩვენი რეკომენდაციების ნაწილი.</Text>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={17} color="#7057D9" />
            </Pressable>
          </View>
        }
      />
    </ScreenContainer>
  );
}

function BusinessDashboard() {
  const { businessProfile, businessProducts } = useApp();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const { changeStatus, deleteProduct, changingProductId, deletingProductId } = useBusinessProductActions();
  const { data: profileData } = trpc.profile.me.useQuery(undefined, { enabled: isAuthenticated, retry: 1, staleTime: 30_000 });
  const { data: businessOrders = [] } = trpc.orders.businessList.useQuery(undefined, { enabled: isAuthenticated, retry: 1, staleTime: 15_000 });
  const { data: revenue } = trpc.orders.businessRevenue.useQuery(undefined, { enabled: isAuthenticated, retry: 1, staleTime: 15_000 });
  const { data: businessNotifications = [] } = trpc.notifications.businessList.useQuery(undefined, { enabled: isAuthenticated, retry: 1, staleTime: 15_000 });
  const activeCount = businessProducts.filter((product) => product.status === "active").length;
  const draftCount = businessProducts.filter((product) => product.status === "draft").length;
  const pendingOrderCount = businessOrders.filter((order) => order.status === "pending").length;
  const unreadNotificationCount = businessNotifications.filter((notification) => !notification.isRead).length;
  const businessStatus = profileData?.business?.status;
  const openProductForm = () => router.push((profileData?.business ? "/business/product-form" : "/business/profile-form") as never);

  return (
    <ScreenContainer>
      <FlatList
        data={businessProducts.slice(0, 4)}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.businessContent, { paddingTop: Math.max(insets.top > 0 ? 82 : 68, 68) }]}
        ItemSeparatorComponent={() => <View style={styles.businessSeparator} />}
        ListHeaderComponent={
          <View style={styles.businessPage}>
            <View style={styles.topBar}>
              <BrandMark />
              <View style={styles.businessTopActions}>
                <Pressable onPress={() => router.push("/business/notifications" as never)} style={({ pressed }) => [styles.businessNotification, pressed && styles.pressed]}>
                  <MaterialIcons name="notifications-none" size={23} color="#251F24" />
                  {unreadNotificationCount ? <View style={styles.businessNotificationDot}><Text style={styles.businessNotificationText}>{unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}</Text></View> : null}
                </Pressable>
                <Pressable onPress={() => router.push("/(tabs)/profile" as never)} style={({ pressed }) => [styles.businessAvatar, pressed && styles.pressed]}>
                  <Text style={styles.businessAvatarText}>{businessProfile.name.slice(0, 1)}</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.greeting}>
              <Text style={styles.kicker}>ბიზნესის სივრცე</Text>
              <Text style={styles.title}>{businessProfile.name}</Text>
            </View>

            {!profileData?.business ? (
              <Pressable onPress={() => router.push("/business/profile-form" as never)} style={({ pressed }) => [styles.registrationBanner, pressed && styles.pressed]}>
                <View style={styles.registrationIcon}><MaterialIcons name="assignment" size={22} color="#7057D9" /></View>
                <View style={styles.approvalCopy}>
                  <Text style={styles.registrationTitle}>ბიზნესის განაცხადი ჯერ არ გაგიგზავნია</Text>
                  <Text style={styles.approvalText}>შეავსე ბიზნეს-პროფილი, რათა ადმინისტრატორმა გადაამოწმოს და დაადასტუროს შენი ანგარიში.</Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color="#7057D9" />
              </Pressable>
            ) : null}

            {businessStatus === "pending" ? (
              <View style={styles.approvalBanner}>
                <View style={styles.approvalIcon}><MaterialIcons name="hourglass-top" size={22} color="#A66A00" /></View>
                <View style={styles.approvalCopy}>
                  <Text style={styles.approvalTitle}>დამტკიცებას ელოდება</Text>
                  <Text style={styles.approvalText}>შენი ბიზნესი გადამოწმების პროცესშია. პროდუქტები მომხმარებლებისთვის დამტკიცების შემდეგ გამოჩნდება.</Text>
                </View>
              </View>
            ) : null}

            <View style={styles.statsCard}>
              <View style={styles.statsHeader}>
                <View>
                  <Text style={styles.statsKicker}>კატალოგის მდგომარეობა</Text>
                  <Text style={styles.statsTitle}>{businessProducts.length} პროდუქტი</Text>
                </View>
                <View style={styles.statsIcon}><MaterialIcons name="insights" size={25} color="#FFFFFF" /></View>
              </View>
              <View style={styles.statsGrid}>
                <StatItem label="აქტიური" value={String(activeCount)} />
                <View style={styles.statsDivider} />
                <StatItem label="მონახაზი" value={String(draftCount)} />
                <View style={styles.statsDivider} />
                <StatItem label="ახალი შეკვეთა" value={String(pendingOrderCount)} />
              </View>
            </View>

            <Pressable onPress={() => router.push("/business/finance" as never)} style={({ pressed }) => [styles.revenueCard, pressed && styles.pressed]}>
              <View style={styles.revenueIcon}><MaterialIcons name="account-balance-wallet" size={25} color="#2E9D74" /></View>
              <View style={styles.revenueCopy}>
                <Text style={styles.revenueKicker}>ბიზნესისთვის დასარიცხი თანხა</Text>
                <Text style={styles.revenueValue}>{((revenue?.availableInTetri ?? 0) / 100).toFixed(2)} ₾</Text>
                <Text style={styles.revenueHint}>{revenue?.paidOrderCount ?? 0} გადახდილი შეკვეთა · თანხა settlement ბალანსშია</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#8BB8A5" />
            </Pressable>

            <View style={styles.quickActions}>
              <Pressable onPress={openProductForm} style={({ pressed }) => [styles.quickActionPrimary, pressed && styles.pressed]}>
                <View style={styles.quickIconPrimary}><MaterialIcons name="add" size={26} color="#E94F6D" /></View>
                <Text style={styles.quickTitlePrimary}>პროდუქტის დამატება</Text>
                <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
              </Pressable>
              <Pressable onPress={() => router.push("/business/orders" as never)} style={({ pressed }) => [styles.quickActionSecondary, pressed && styles.pressed]}>
                <MaterialIcons name="shopping-bag" size={25} color="#7057D9" />
                <Text style={styles.quickTitleSecondary}>შეკვეთები</Text>
              </Pressable>
            </View>

            <SectionHeader
              title="ბოლო პროდუქტები"
              subtitle={businessProducts.length ? "მართე სტატუსი ან შეცვალე ინფორმაცია" : "პირველი პროდუქტის დამატებით დაიწყე"}
              actionLabel={businessProducts.length ? "ყველა" : undefined}
              onAction={businessProducts.length ? () => router.push("/(tabs)/discover" as never) : undefined}
            />
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
          <View style={styles.businessEmpty}>
            <View style={styles.businessEmptyIcon}><MaterialIcons name="inventory-2" size={33} color="#7057D9" /></View>
            <Text style={styles.businessEmptyTitle}>კატალოგი ჯერ ცარიელია</Text>
            <Text style={styles.businessEmptyText}>დაამატე პროდუქტი და მიუთითე, ვის და რა შემთხვევას შეეფერება.</Text>
            <PrimaryButton label="პირველი პროდუქტის დამატება" icon="add" variant="secondary" onPress={openProductForm} style={styles.businessEmptyButton} />
          </View>
        }
      />
    </ScreenContainer>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return <View style={styles.statItem}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 30 },
  page: { paddingHorizontal: 20, gap: 22 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  notification: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#EADFDA" },
  notificationDot: { position: "absolute", top: 10, right: 10, width: 7, height: 7, borderRadius: 4, backgroundColor: "#E94F6D", borderWidth: 1, borderColor: "#FFFFFF" },
  pressed: { opacity: 0.7 },
  greeting: { gap: 2 },
  kicker: { color: "#C5D5FF", fontSize: 14, lineHeight: 20, fontWeight: "700" },
  title: { color: "#F7F9FF", fontSize: 29, lineHeight: 36, fontWeight: "900", letterSpacing: -0.7 },
  heroCard: { minHeight: 248, borderRadius: 28, backgroundColor: "#E94F6D", overflow: "hidden", padding: 22, position: "relative" },
  heroDecorationOne: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.10)", right: -48, top: -54 },
  heroDecorationTwo: { position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(112,87,217,0.16)", left: -42, bottom: -42 },
  heroCopy: { width: "72%", alignItems: "flex-start", zIndex: 2, gap: 10 },
  aiPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: "rgba(37,31,36,0.18)" },
  aiPillText: { color: "#FFFFFF", fontSize: 11, lineHeight: 15, fontWeight: "800" },
  heroTitle: { color: "#FFFFFF", fontSize: 23, lineHeight: 29, fontWeight: "900", letterSpacing: -0.4 },
  heroSubtitle: { color: "rgba(255,255,255,0.86)", fontSize: 13, lineHeight: 19 },
  heroButton: { marginTop: 4, minHeight: 48, paddingHorizontal: 15 },
  giftOrb: { position: "absolute", width: 102, height: 102, borderRadius: 51, backgroundColor: "#FFF8F5", right: -2, bottom: 23, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-8deg" }] },
  occasionList: { gap: 10, paddingRight: 20 },
  occasionCard: { width: 114, height: 100, borderRadius: 20, padding: 13, justifyContent: "space-between" },
  occasionLabel: { color: "#3D353A", fontSize: 13, lineHeight: 17, fontWeight: "700" },
  productList: { gap: 14, paddingRight: 20, paddingBottom: 10 },
  businessBanner: { flexDirection: "row", alignItems: "center", gap: 13, backgroundColor: "#EEE8FF", borderRadius: 22, padding: 16 },
  businessIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  businessCopy: { flex: 1, gap: 3 },
  businessTitle: { color: "#3B2E6F", fontSize: 16, lineHeight: 21, fontWeight: "800" },
  businessText: { color: "#6C6093", fontSize: 12, lineHeight: 17 },
  businessContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 30 },
  businessPage: { gap: 22, paddingBottom: 17 },
  approvalBanner: { flexDirection: "row", gap: 11, borderRadius: 18, padding: 14, backgroundColor: "#FFF3D8", borderWidth: 1, borderColor: "#F3D191" },
  registrationBanner: { flexDirection: "row", alignItems: "center", gap: 11, borderRadius: 18, padding: 14, backgroundColor: "#EEE8FF", borderWidth: 1, borderColor: "#D8CCFF" },
  registrationIcon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  registrationTitle: { color: "#3B2E6F", fontSize: 14, lineHeight: 19, fontWeight: "800" },
  approvalIcon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  approvalCopy: { flex: 1, gap: 2 },
  approvalTitle: { color: "#7C5100", fontSize: 14, lineHeight: 19, fontWeight: "800" },
  approvalText: { color: "#8C6A2F", fontSize: 12, lineHeight: 17 },
  businessSeparator: { height: 12 },
  businessAvatar: { width: 44, height: 44, borderRadius: 16, backgroundColor: "#7057D9", alignItems: "center", justifyContent: "center" },
  businessAvatarText: { color: "#FFFFFF", fontSize: 18, lineHeight: 23, fontWeight: "900" },
  businessTopActions: { flexDirection: "row", alignItems: "center", gap: 9 },
  businessNotification: { width: 44, height: 44, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EADFDA", alignItems: "center", justifyContent: "center" },
  businessNotificationDot: { position: "absolute", right: -4, top: -4, minWidth: 17, height: 17, borderRadius: 9, paddingHorizontal: 3, backgroundColor: "#E94F6D", borderWidth: 1.5, borderColor: "#FFF8F5", alignItems: "center", justifyContent: "center" },
  businessNotificationText: { color: "#FFFFFF", fontSize: 8, lineHeight: 10, fontWeight: "900" },
  statsCard: { borderRadius: 26, backgroundColor: "#7057D9", padding: 19, gap: 20, overflow: "hidden" },
  statsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statsKicker: { color: "rgba(255,255,255,0.72)", fontSize: 12, lineHeight: 17, fontWeight: "700" },
  statsTitle: { color: "#FFFFFF", fontSize: 25, lineHeight: 31, fontWeight: "900" },
  statsIcon: { width: 48, height: 48, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" },
  statsGrid: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.10)", borderRadius: 18, paddingVertical: 12 },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { color: "#FFFFFF", fontSize: 20, lineHeight: 26, fontWeight: "900" },
  statLabel: { color: "rgba(255,255,255,0.72)", fontSize: 10, lineHeight: 14, fontWeight: "600" },
  statsDivider: { width: StyleSheet.hairlineWidth, height: 34, backgroundColor: "rgba(255,255,255,0.24)" },
  revenueCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#E7F5EF", borderRadius: 22, padding: 15 },
  revenueIcon: { width: 47, height: 47, borderRadius: 16, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  revenueCopy: { flex: 1, gap: 1 },
  revenueKicker: { color: "#39745D", fontSize: 11, lineHeight: 15, fontWeight: "700" },
  revenueValue: { color: "#236B51", fontSize: 23, lineHeight: 29, fontWeight: "900" },
  revenueHint: { color: "#5F8B77", fontSize: 10, lineHeight: 14 },
  quickActions: { flexDirection: "row", gap: 10 },
  quickActionPrimary: { flex: 1.3, minHeight: 118, borderRadius: 22, backgroundColor: "#E94F6D", padding: 15, justifyContent: "space-between", alignItems: "flex-start" },
  quickIconPrimary: { width: 40, height: 40, borderRadius: 14, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  quickTitlePrimary: { color: "#FFFFFF", fontSize: 15, lineHeight: 20, fontWeight: "800" },
  quickActionSecondary: { flex: 1, minHeight: 118, borderRadius: 22, backgroundColor: "#EEE8FF", padding: 15, justifyContent: "space-between", alignItems: "flex-start" },
  quickTitleSecondary: { color: "#3B2E6F", fontSize: 14, lineHeight: 19, fontWeight: "800" },
  businessEmpty: { alignItems: "center", paddingHorizontal: 25, paddingVertical: 34, gap: 8, backgroundColor: "#FFFFFF", borderRadius: 22, borderWidth: 1, borderColor: "#EADFDA" },
  businessEmptyIcon: { width: 66, height: 66, borderRadius: 22, backgroundColor: "#EEE8FF", alignItems: "center", justifyContent: "center", marginBottom: 3 },
  businessEmptyTitle: { color: "#251F24", fontSize: 18, lineHeight: 24, fontWeight: "800", textAlign: "center" },
  businessEmptyText: { color: "#756B70", fontSize: 13, lineHeight: 19, textAlign: "center" },
  businessEmptyButton: { marginTop: 8 },
});
