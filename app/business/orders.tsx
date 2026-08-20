import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, Alert, Animated, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { resolveAssetUrl } from "@/lib/assets";
import { haptic } from "@/lib/haptics";
import { trpc } from "@/lib/trpc";
import type { OrderStatus } from "@/shared/achuqe";

const statusMeta: Record<OrderStatus, { label: string; color: string; tint: string }> = {
  pending: { label: "ახალი", color: "#A85C00", tint: "#FFF0D4" },
  confirmed: { label: "დადასტურებული", color: "#7057D9", tint: "#EEE8FF" },
  preparing: { label: "მზადდება", color: "#286D9D", tint: "#E6F4FE" },
  shipped: { label: "გაგზავნილია", color: "#236B51", tint: "#E7F5EF" },
  delivered: { label: "ჩაბარებულია", color: "#39745D", tint: "#E7F5EF" },
  cancelled: { label: "გაუქმებულია", color: "#9A4B5B", tint: "#FBE2E8" },
};

const nextStep: Partial<Record<OrderStatus, { status: OrderStatus; label: string; icon: keyof typeof MaterialIcons.glyphMap }>> = {
  pending: { status: "confirmed", label: "დადასტურება", icon: "check-circle" },
  confirmed: { status: "preparing", label: "მომზადება", icon: "inventory" },
  preparing: { status: "shipped", label: "გაგზავნა", icon: "local-shipping" },
  shipped: { status: "delivered", label: "ჩაბარება", icon: "task-alt" },
};

const shellText = StyleSheet.create({
  title: { color: "#F7F9FF" },
  body: { color: "#C5D5FF" },
});

export default function BusinessOrdersScreen() {
  const { isAuthenticated, startLogin } = useAuth();
  const utils = trpc.useUtils();
  const { data: orders = [], isLoading } = trpc.orders.businessList.useQuery(undefined, { enabled: isAuthenticated, retry: 1, staleTime: 10_000 });
  const updateStatus = trpc.orders.updateStatus.useMutation();
  const pendingCount = useMemo(() => orders.filter((order) => order.status === "pending").length, [orders]);

  const applyStatus = async (orderId: number, status: OrderStatus) => {
    try {
      await updateStatus.mutateAsync({ id: orderId, status });
      haptic.success();
      await Promise.all([utils.orders.businessList.invalidate(), utils.notifications.businessList.invalidate()]);
    } catch (error) {
      haptic.error();
      Alert.alert("სტატუსი ვერ განახლდა", error instanceof Error ? error.message : "სცადე ხელახლა.");
    }
  };

  if (!isAuthenticated) {
    return <AuthRequired title="შეკვეთები" onLogin={() => void startLogin()} />;
  }

  return (
    <ScreenContainer>
      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={<View style={styles.header}><View style={styles.headerTop}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><MaterialIcons name="arrow-back-ios-new" size={20} color="#251F24" /></Pressable><Text style={[styles.title, shellText.title]}>შეკვეთები</Text><View style={styles.spacer} /></View><View style={styles.summary}><View style={styles.summaryIcon}><MaterialIcons name="shopping-bag" size={25} color="#E94F6D" /></View><View style={styles.summaryCopy}><Text style={styles.summaryTitle}>{pendingCount ? `${pendingCount} ახალი შეკვეთა` : "ყველა შეკვეთა დამუშავებულია"}</Text><Text style={styles.summaryText}>შეცვალე სტატუსი, როცა შეკვეთა მომდევნო ეტაპზე გადავა.</Text></View></View></View>}
        renderItem={({ item }) => <OrderCard order={item} loading={updateStatus.isPending} onAdvance={() => { const step = nextStep[item.status as OrderStatus]; if (step) void applyStatus(item.id, step.status); }} />}
        ListEmptyComponent={isLoading ? <ActivityIndicator color="#E94F6D" style={styles.loader} /> : <View style={styles.empty}><View style={styles.emptyIcon}><MaterialIcons name="shopping-bag" size={38} color="#7057D9" /></View><Text style={[styles.emptyTitle, shellText.title]}>შეკვეთები ჯერ არ გაქვს</Text><Text style={[styles.emptyText, shellText.body]}>როცა მომხმარებელი გამოქვეყნებულ პროდუქტზე მოთხოვნას შექმნის, ის აქ გამოჩნდება.</Text></View>}
      />
    </ScreenContainer>
  );
}

function OrderCard({ order, loading, onAdvance }: { order: { id: number; productName: string; productImageUrl: string; quantity: number; totalPriceInTetri: number; businessPayoutInTetri: number; payoutStatus: string; customerName: string; customerPhone: string; deliveryAddress: string; note: string | null; status: string; createdAt: Date | string }; loading: boolean; onAdvance: () => void }) {
  const meta = statusMeta[order.status as OrderStatus];
  const step = nextStep[order.status as OrderStatus];
  const transition = useRef(new Animated.Value(0)).current;
  const previousStatus = useRef(order.status);
  useEffect(() => {
    if (previousStatus.current === order.status) return;
    previousStatus.current = order.status;
    transition.setValue(0);
    Animated.sequence([
      Animated.timing(transition, { toValue: 1, duration: 180, useNativeDriver: false }),
      Animated.timing(transition, { toValue: 0, duration: 300, useNativeDriver: false }),
    ]).start();
  }, [order.status, transition]);
  const statusStyle = {
    backgroundColor: transition.interpolate({ inputRange: [0, 1], outputRange: [meta.tint, "#FFFFFF"] }),
    transform: [{ scale: transition.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
  };
  return <View style={styles.orderCard}><View style={styles.cardHeader}><View style={styles.orderId}><Text style={styles.orderIdText}>შეკვეთა #{order.id}</Text><Text style={styles.orderTime}>{new Date(order.createdAt).toLocaleDateString("ka-GE", { month: "short", day: "numeric" })}</Text></View><Animated.View style={[styles.status, statusStyle]}><Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text></Animated.View></View><View style={styles.productRow}><Image source={resolveAssetUrl(order.productImageUrl)} contentFit="cover" style={styles.productImage} /><View style={styles.productCopy}><Text style={styles.productName}>{order.productName}</Text><Text style={styles.productDetail}>{order.quantity} ერთეული · {(order.totalPriceInTetri / 100).toFixed(2)} ₾</Text></View></View><View style={styles.payoutCard}><View style={styles.payoutRow}><Text style={styles.payoutStrong}>შენთვის დასარიცხი</Text><Text style={styles.payoutStrong}>{(order.businessPayoutInTetri / 100).toFixed(2)} ₾</Text></View><Text style={styles.payoutHint}>{payoutStatusLabel(order.payoutStatus)}</Text></View><View style={styles.customerBlock}><InfoLine icon="person-outline" text={order.customerName} /><InfoLine icon="phone" text={order.customerPhone} /><InfoLine icon="location-on" text={order.deliveryAddress} />{order.note ? <InfoLine icon="sticky-note-2" text={order.note} /> : null}</View>{step ? <Pressable disabled={loading} onPress={onAdvance} style={({ pressed }) => [styles.advanceButton, pressed && styles.pressed, loading && styles.disabled]}>{loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <MaterialIcons name={step.icon} size={19} color="#FFFFFF" />}<Text style={styles.advanceText}>{loading ? "ინახება..." : step.label}</Text></Pressable> : null}</View>;
}

function InfoLine({ icon, text }: { icon: keyof typeof MaterialIcons.glyphMap; text: string }) { return <View style={styles.infoLine}><MaterialIcons name={icon} size={17} color="#756B70" /><Text style={styles.infoText}>{text}</Text></View>; }
function payoutStatusLabel(status: string) { return status === "paid" ? "თანხა ჩაირიცხა" : status === "processing" ? "გადარიცხვა მუშავდება" : status === "on_hold" ? "გადარიცხვა დროებით შეჩერებულია" : "თანხა settlement ბალანსშია"; }
function AuthRequired({ title, onLogin }: { title: string; onLogin: () => void }) { return <ScreenContainer><View style={styles.auth}><MaterialIcons name="lock-outline" size={44} color="#7057D9" /><Text style={[styles.emptyTitle, shellText.title]}>{title} ანგარიშით იხსნება</Text><Text style={[styles.emptyText, shellText.body]}>ბიზნესის შეკვეთებისა და მომხმარებლის მონაცემების სანახავად შედი ანგარიშში.</Text><Pressable onPress={onLogin} style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}><Text style={styles.loginText}>რეგისტრაცია ან შესვლა</Text></Pressable></View></ScreenContainer>; }

const styles = StyleSheet.create({ content: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 30 }, header: { gap: 18, paddingBottom: 19 }, headerTop: { height: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, back: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EADFDA", alignItems: "center", justifyContent: "center" }, title: { color: "#251F24", fontSize: 18, lineHeight: 24, fontWeight: "900" }, spacer: { width: 42 }, summary: { flexDirection: "row", gap: 13, backgroundColor: "#FBE2E8", borderRadius: 21, padding: 15, alignItems: "center" }, summaryIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" }, summaryCopy: { flex: 1, gap: 3 }, summaryTitle: { color: "#813C4E", fontSize: 15, lineHeight: 20, fontWeight: "800" }, summaryText: { color: "#9C6673", fontSize: 12, lineHeight: 17 }, separator: { height: 12 }, orderCard: { borderRadius: 22, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EADFDA", padding: 15, gap: 13 }, cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }, orderId: { gap: 1 }, orderIdText: { color: "#251F24", fontSize: 13, lineHeight: 18, fontWeight: "800" }, orderTime: { color: "#8C7F85", fontSize: 11, lineHeight: 15 }, status: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 }, statusText: { fontSize: 11, lineHeight: 15, fontWeight: "800" }, productRow: { flexDirection: "row", gap: 11 }, productImage: { width: 58, height: 58, borderRadius: 14, backgroundColor: "#F7EAE5" }, productCopy: { flex: 1, justifyContent: "center", gap: 3 }, productName: { color: "#3D353A", fontSize: 15, lineHeight: 20, fontWeight: "800" }, productDetail: { color: "#E94F6D", fontSize: 13, lineHeight: 18, fontWeight: "800" }, payoutCard: { backgroundColor: "#E7F5EF", borderRadius: 16, padding: 12, gap: 6 }, payoutRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 }, payoutLabel: { color: "#4D826D", fontSize: 11, lineHeight: 16 }, payoutText: { color: "#39745D", fontSize: 11, lineHeight: 16, fontWeight: "700" }, feeText: { color: "#7057D9", fontSize: 11, lineHeight: 16, fontWeight: "700" }, payoutDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "#B9DDCD" }, payoutStrong: { color: "#236B51", fontSize: 12, lineHeight: 17, fontWeight: "900" }, payoutHint: { color: "#5F8B77", fontSize: 10, lineHeight: 14, marginTop: 2 }, customerBlock: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#EFE6E2", paddingTop: 10, gap: 6 }, infoLine: { flexDirection: "row", alignItems: "flex-start", gap: 7 }, infoText: { flex: 1, color: "#62585D", fontSize: 12, lineHeight: 17 }, advanceButton: { minHeight: 43, backgroundColor: "#7057D9", borderRadius: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 }, advanceText: { color: "#FFFFFF", fontSize: 13, lineHeight: 18, fontWeight: "800" }, empty: { alignItems: "center", paddingVertical: 62, paddingHorizontal: 28, gap: 9 }, emptyIcon: { width: 78, height: 78, borderRadius: 25, backgroundColor: "#EEE8FF", alignItems: "center", justifyContent: "center", marginBottom: 4 }, emptyTitle: { color: "#251F24", fontSize: 20, lineHeight: 26, fontWeight: "800", textAlign: "center" }, emptyText: { color: "#756B70", fontSize: 13, lineHeight: 20, textAlign: "center" }, loader: { marginTop: 60 }, auth: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, gap: 10 }, loginButton: { marginTop: 8, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, backgroundColor: "#E94F6D" }, loginText: { color: "#FFFFFF", fontSize: 14, lineHeight: 19, fontWeight: "800" }, pressed: { opacity: 0.65 }, disabled: { opacity: 0.55 } });
