import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { haptic } from "@/lib/haptics";
import { trpc } from "@/lib/trpc";

const shellText = StyleSheet.create({
  title: { color: "#F7F9FF" },
  body: { color: "#C5D5FF" },
});

export default function BusinessNotificationsScreen() {
  const { isAuthenticated, startLogin } = useAuth();
  const utils = trpc.useUtils();
  const { data: notifications = [], isLoading } = trpc.notifications.businessList.useQuery(undefined, { enabled: isAuthenticated, retry: 1, staleTime: 10_000 });
  const markRead = trpc.notifications.markRead.useMutation();

  const openNotification = async (notification: { id: number; isRead: boolean }) => {
    try {
      if (!notification.isRead) {
        await markRead.mutateAsync({ id: notification.id });
        await utils.notifications.businessList.invalidate();
      }
      haptic.selection();
      router.push("/business/orders" as never);
    } catch (error) {
      Alert.alert("შეტყობინება ვერ განახლდა", error instanceof Error ? error.message : "სცადე ხელახლა.");
    }
  };

  if (!isAuthenticated) return <ScreenContainer><View style={styles.empty}><MaterialIcons name="lock-outline" size={44} color="#7057D9" /><Text style={[styles.emptyTitle, shellText.title]}>შეტყობინებები ანგარიშით იხსნება</Text><Text style={[styles.emptyText, shellText.body]}>შედი ბიზნეს-ანგარიშში, რათა ახალი შეკვეთები ნახო.</Text><Pressable onPress={() => void startLogin()} style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}><Text style={styles.loginText}>რეგისტრაცია ან შესვლა</Text></Pressable></View></ScreenContainer>;

  return <ScreenContainer><FlatList data={notifications} keyExtractor={(item) => String(item.id)} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} ItemSeparatorComponent={() => <View style={styles.separator} />} ListHeaderComponent={<View style={styles.header}><View style={styles.headerTop}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><MaterialIcons name="arrow-back-ios-new" size={20} color="#251F24" /></Pressable><Text style={[styles.title, shellText.title]}>შეტყობინებები</Text><View style={styles.spacer} /></View><Text style={[styles.subtitle, shellText.body]}>შეკვეთების ახალი მოთხოვნები და მნიშვნელოვანი განახლებები.</Text></View>} renderItem={({ item }) => <Pressable onPress={() => void openNotification(item)} style={({ pressed }) => [styles.notification, !item.isRead && styles.unread, pressed && styles.pressed]}><View style={[styles.icon, !item.isRead && styles.iconUnread]}><MaterialIcons name={item.type === "new_order" ? "shopping-bag" : "update"} size={23} color={item.isRead ? "#7057D9" : "#E94F6D"} /></View><View style={styles.copy}><View style={styles.titleRow}><Text style={styles.notificationTitle}>{item.title}</Text>{!item.isRead ? <View style={styles.dot} /> : null}</View><Text style={styles.body}>{item.body}</Text><Text style={styles.time}>{new Date(item.createdAt).toLocaleDateString("ka-GE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</Text></View><MaterialIcons name="chevron-right" size={22} color="#B0A4AA" /></Pressable>} ListEmptyComponent={isLoading ? <ActivityIndicator color="#E94F6D" style={styles.loader} /> : <View style={styles.empty}><View style={styles.emptyIcon}><MaterialIcons name="notifications-none" size={40} color="#7057D9" /></View><Text style={[styles.emptyTitle, shellText.title]}>ჯერ ახალი არაფერია</Text><Text style={[styles.emptyText, shellText.body]}>როცა მომხმარებელი შეკვეთას შექმნის, შეტყობინება აქ გამოჩნდება.</Text></View>} /></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 30 }, header: { gap: 8, paddingBottom: 20 }, headerTop: { height: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, back: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EADFDA", alignItems: "center", justifyContent: "center" }, title: { color: "#251F24", fontSize: 18, lineHeight: 24, fontWeight: "900" }, spacer: { width: 42 }, subtitle: { color: "#756B70", fontSize: 13, lineHeight: 19 }, separator: { height: 10 }, notification: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EADFDA" }, unread: { borderColor: "#F3B5C1", backgroundColor: "#FFF9F9" }, icon: { width: 44, height: 44, borderRadius: 15, backgroundColor: "#EEE8FF", alignItems: "center", justifyContent: "center" }, iconUnread: { backgroundColor: "#FBE2E8" }, copy: { flex: 1, gap: 3 }, titleRow: { flexDirection: "row", alignItems: "center", gap: 6 }, notificationTitle: { color: "#3D353A", fontSize: 14, lineHeight: 19, fontWeight: "800" }, body: { color: "#756B70", fontSize: 12, lineHeight: 17 }, time: { color: "#A79CA1", fontSize: 10, lineHeight: 14, fontWeight: "600" }, dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#E94F6D" }, empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, paddingVertical: 60, gap: 9 }, emptyIcon: { width: 82, height: 82, borderRadius: 27, backgroundColor: "#EEE8FF", alignItems: "center", justifyContent: "center", marginBottom: 4 }, emptyTitle: { color: "#251F24", fontSize: 20, lineHeight: 26, fontWeight: "800", textAlign: "center" }, emptyText: { color: "#756B70", fontSize: 13, lineHeight: 20, textAlign: "center" }, loader: { marginTop: 60 }, loginButton: { marginTop: 8, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, backgroundColor: "#E94F6D" }, loginText: { color: "#FFFFFF", fontSize: 14, lineHeight: 19, fontWeight: "800" }, pressed: { opacity: 0.65 } });
