import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

type ApprovalStatus = "active" | "rejected";
type BusinessStatus = "pending" | "active" | "rejected";

const STATUS_TABS: { id: BusinessStatus; label: string }[] = [
  { id: "pending", label: "მოლოდინში" },
  { id: "active", label: "აქტიური" },
  { id: "rejected", label: "უარყოფილი" },
];

function formatDate(value: Date | string | null) {
  if (!value) return "ახლახან";
  return new Date(value).toLocaleDateString("ka-GE", { day: "numeric", month: "long", year: "numeric" });
}

export default function AdminBusinessesScreen() {
  const { user, loading } = useAuth();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();
  const [selectedStatus, setSelectedStatus] = useState<BusinessStatus>("pending");
  const { data: businesses = [], isLoading: businessesLoading } = trpc.admin.businesses.useQuery(undefined, { enabled: isAdmin, retry: 1, staleTime: 15_000 });
  const { data: notifications = [], isLoading: notificationsLoading } = trpc.admin.notifications.useQuery(undefined, { enabled: isAdmin, retry: 1, staleTime: 15_000 });
  const approval = trpc.admin.setBusinessApproval.useMutation();
  const markRead = trpc.admin.markNotificationRead.useMutation();
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const statusCounts = useMemo(() => ({
    pending: businesses.filter((business) => business.status === "pending").length,
    active: businesses.filter((business) => business.status === "active").length,
    rejected: businesses.filter((business) => business.status === "rejected").length,
  }), [businesses]);
  const visibleBusinesses = useMemo(() => businesses.filter((business) => business.status === selectedStatus), [businesses, selectedStatus]);

  const setApproval = useCallback((id: number, status: ApprovalStatus) => {
    const action = status === "active" ? "დამტკიცება" : "უარყოფა";
    Alert.alert(`ბიზნესის ${action}`, status === "active" ? "დამტკიცების შემდეგ მისი აქტიური პროდუქტები მომხმარებლებისთვის გამოჩნდება." : "ბიზნესი უარყოფილ სტატუსში გადავა და მისი პროდუქტები მომხმარებლებისთვის არ გამოჩნდება.", [
      { text: "გაუქმება", style: "cancel" },
      {
        text: action,
        style: status === "active" ? "default" : "destructive",
          onPress: () => approval.mutate({ id, status }, {
            onSuccess: () => {
            void utils.admin.businesses.invalidate();
            void utils.admin.pendingBusinesses.invalidate();
            void utils.admin.notifications.invalidate();
            void utils.products.active.invalidate();
          },
          onError: () => Alert.alert("მოქმედება ვერ შესრულდა", "სტატუსი ახლა ვერ განახლდა. სცადე ხელახლა."),
        }),
      },
    ]);
  }, [approval, utils.admin.businesses, utils.admin.notifications, utils.admin.pendingBusinesses, utils.products.active]);

  const handleNotificationPress = useCallback((id: number, isRead: boolean) => {
    if (isRead) return;
    markRead.mutate({ id }, { onSuccess: () => void utils.admin.notifications.invalidate() });
  }, [markRead, utils.admin.notifications]);

  if (loading) {
    return <ScreenContainer><View style={styles.centered}><ActivityIndicator color="#7057D9" /><Text style={styles.loadingText}>ადმინისტრატორის წვდომა მოწმდება...</Text></View></ScreenContainer>;
  }

  if (!isAdmin) {
    return (
      <ScreenContainer>
        <View style={styles.lockedPage}>
          <View style={styles.lockedIcon}><MaterialIcons name="lock-outline" size={34} color="#7057D9" /></View>
          <Text style={styles.lockedTitle}>წვდომა შეზღუდულია</Text>
          <Text style={styles.lockedText}>ეს სივრცე მხოლოდ „აჩუქე“-ს ადმინისტრატორის ანგარიშისთვის არის ხელმისაწვდომი.</Text>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}><Text style={styles.backButtonText}>დაბრუნება</Text></Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={visibleBusinesses}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.topBar}>
              <Pressable onPress={() => router.back()} hitSlop={10} style={({ pressed }) => [styles.backIcon, pressed && styles.pressed]}><MaterialIcons name="arrow-back" size={22} color="#251F24" /></Pressable>
              <View style={styles.adminBadge}><MaterialIcons name="admin-panel-settings" size={16} color="#FFFFFF" /><Text style={styles.adminBadgeText}>ადმინისტრატორი</Text></View>
            </View>
            <Text style={styles.title}>ბიზნესების დამტკიცება</Text>
            <Text style={styles.subtitle}>ნახე ყველა ბიზნესის სტატუსი, გადახედე დეტალებს და მართე მათი საჯარო ხილვადობა.</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}><Text style={styles.summaryValue}>{statusCounts.pending}</Text><Text style={styles.summaryLabel}>მოლოდინში</Text></View>
              <View style={styles.summaryCard}><Text style={styles.summaryValue}>{statusCounts.active}</Text><Text style={styles.summaryLabel}>აქტიური</Text></View>
              <View style={styles.summaryCard}><Text style={styles.summaryValue}>{unreadCount}</Text><Text style={styles.summaryLabel}>შეტყობინება</Text></View>
            </View>
            <View style={styles.notificationSection}>
              <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>ადმინისტრატორის შეტყობინებები</Text><Text style={styles.sectionCount}>{notifications.length}</Text></View>
              {notificationsLoading ? <ActivityIndicator color="#7057D9" style={styles.notificationLoader} /> : notifications.slice(0, 5).map((notification) => (
                <Pressable key={notification.id} onPress={() => handleNotificationPress(notification.id, notification.isRead)} style={({ pressed }) => [styles.notificationRow, !notification.isRead && styles.notificationUnread, pressed && styles.pressed]}>
                  <View style={styles.notificationIcon}><MaterialIcons name="storefront" size={19} color="#7057D9" /></View>
                  <View style={styles.notificationCopy}><Text style={styles.notificationTitle}>{notification.title}</Text><Text numberOfLines={2} style={styles.notificationBody}>{notification.body}</Text><Text style={styles.notificationDate}>{formatDate(notification.createdAt)}</Text></View>
                  {!notification.isRead ? <View style={styles.unreadDot} /> : null}
                </Pressable>
              ))}
              {!notificationsLoading && notifications.length === 0 ? <Text style={styles.emptyNotifications}>ჯერ ახალი შეტყობინება არ არის.</Text> : null}
            </View>
            <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>ბიზნესების მართვა</Text>{businessesLoading ? <ActivityIndicator size="small" color="#7057D9" /> : null}</View>
            <View style={styles.statusTabs}>{STATUS_TABS.map((tab) => <Pressable key={tab.id} onPress={() => setSelectedStatus(tab.id)} style={({ pressed }) => [styles.statusTab, selectedStatus === tab.id && styles.statusTabActive, pressed && styles.pressed]}><Text style={[styles.statusTabText, selectedStatus === tab.id && styles.statusTabTextActive]}>{tab.label} ({statusCounts[tab.id]})</Text></Pressable>)}</View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.businessCard}>
            <View style={styles.businessTop}><View style={styles.businessAvatar}><Text style={styles.businessAvatarText}>{item.name.slice(0, 1)}</Text></View><View style={styles.businessCopy}><Text style={styles.businessName}>{item.name}</Text><Text style={styles.businessCategory}>{item.category}</Text></View><BusinessStatusPill status={item.status as BusinessStatus} /></View>
            {item.description ? <Text style={styles.businessDescription}>{item.description}</Text> : null}
            <View style={styles.detailRow}><MaterialIcons name="location-on" size={16} color="#8C7F85" /><Text style={styles.detailText}>{item.city ?? "ქალაქი მითითებული არ არის"}</Text></View>
            <View style={styles.detailRow}><MaterialIcons name="phone" size={16} color="#8C7F85" /><Text style={styles.detailText}>{item.contact}</Text></View>
            <Text style={styles.registrationDate}>რეგისტრაცია: {formatDate(item.createdAt)}</Text>
            <View style={styles.actionRow}>
              {item.status !== "rejected" ? <Pressable disabled={approval.isPending} onPress={() => setApproval(item.id, "rejected")} style={({ pressed }) => [styles.rejectButton, pressed && styles.pressed, approval.isPending && styles.disabled]}><Text style={styles.rejectText}>უარყოფა</Text></Pressable> : null}
              {item.status !== "active" ? <Pressable disabled={approval.isPending} onPress={() => setApproval(item.id, "active")} style={({ pressed }) => [styles.approveButton, pressed && styles.pressed, approval.isPending && styles.disabled]}>{approval.isPending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <><MaterialIcons name="check" size={18} color="#FFFFFF" /><Text style={styles.approveText}>დამტკიცება</Text></>}</Pressable> : null}
            </View>
          </View>
        )}
        ListEmptyComponent={!businessesLoading ? <View style={styles.emptyBusinesses}><View style={styles.emptyIcon}><MaterialIcons name="task-alt" size={34} color="#2E9D74" /></View><Text style={styles.emptyTitle}>{selectedStatus === "pending" ? "ყველა განაცხადი დამუშავებულია" : "ამ სტატუსის ბიზნესი არ არის"}</Text><Text style={styles.emptyText}>{selectedStatus === "pending" ? "ახალი ბიზნესის რეგისტრაციისას ის აქ გამოჩნდება შესამოწმებლად." : "სხვა სტატუსის სანახავად აირჩიე ზედა ფილტრი."}</Text></View> : null}
      />
    </ScreenContainer>
  );
}

function BusinessStatusPill({ status }: { status: BusinessStatus }) {
  const label = status === "active" ? "დამტკიცებული" : status === "rejected" ? "უარყოფილი" : "მოლოდინში";
  return <View style={[styles.pendingPill, status === "active" && styles.activePill, status === "rejected" && styles.rejectedPill]}><Text style={[styles.pendingPillText, status === "active" && styles.activePillText, status === "rejected" && styles.rejectedPillText]}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  header: { gap: 14, paddingBottom: 18 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backIcon: { width: 42, height: 42, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EADFDA" },
  adminBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, backgroundColor: "#7057D9" },
  adminBadgeText: { color: "#FFFFFF", fontSize: 11, lineHeight: 15, fontWeight: "800" },
  title: { color: "#F7F9FF", fontSize: 28, lineHeight: 35, fontWeight: "900", letterSpacing: -0.6 },
  subtitle: { color: "#C5D5FF", fontSize: 14, lineHeight: 20 },
  summaryRow: { flexDirection: "row", gap: 8 },
  summaryCard: { flex: 1, gap: 2, padding: 14, borderRadius: 18, backgroundColor: "#EEE8FF" },
  summaryValue: { color: "#3B2E6F", fontSize: 23, lineHeight: 29, fontWeight: "900" },
  summaryLabel: { color: "#6C6093", fontSize: 12, lineHeight: 17, fontWeight: "700" },
  notificationSection: { gap: 8, borderRadius: 20, padding: 13, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EADFDA" },
  sectionHeading: { minHeight: 25, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: "#3D353A", fontSize: 15, lineHeight: 21, fontWeight: "800" },
  sectionCount: { color: "#756B70", fontSize: 12, lineHeight: 17, fontWeight: "700" },
  notificationLoader: { paddingVertical: 15 },
  notificationRow: { flexDirection: "row", alignItems: "center", gap: 9, padding: 9, borderRadius: 14 },
  notificationUnread: { backgroundColor: "#F7F4FF" },
  notificationIcon: { width: 33, height: 33, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#EEE8FF" },
  notificationCopy: { flex: 1, gap: 1 },
  notificationTitle: { color: "#3D353A", fontSize: 12, lineHeight: 17, fontWeight: "800" },
  notificationBody: { color: "#8C7F85", fontSize: 11, lineHeight: 15 },
  notificationDate: { color: "#A79CA1", fontSize: 10, lineHeight: 14 },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#E94F6D" },
  emptyNotifications: { color: "#8C7F85", fontSize: 12, lineHeight: 17, paddingVertical: 5 },
  statusTabs: { flexDirection: "row", gap: 6 },
  statusTab: { flex: 1, minHeight: 35, paddingHorizontal: 7, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: "#173661", borderWidth: 1, borderColor: "#315685" },
  statusTabActive: { backgroundColor: "#7057D9", borderColor: "#7057D9" },
  statusTabText: { color: "#D8E3FF", fontSize: 10, lineHeight: 14, fontWeight: "800", textAlign: "center" },
  statusTabTextActive: { color: "#FFFFFF" },
  separator: { height: 12 },
  businessCard: { gap: 9, padding: 15, borderRadius: 22, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EADFDA" },
  businessTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  businessAvatar: { width: 43, height: 43, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#FBE2E8" },
  businessAvatarText: { color: "#C93B58", fontSize: 20, lineHeight: 25, fontWeight: "900" },
  businessCopy: { flex: 1, gap: 1 },
  businessName: { color: "#251F24", fontSize: 16, lineHeight: 22, fontWeight: "900" },
  businessCategory: { color: "#756B70", fontSize: 12, lineHeight: 17 },
  pendingPill: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10, backgroundColor: "#FFF3D8" },
  pendingPillText: { color: "#A66A00", fontSize: 10, lineHeight: 14, fontWeight: "800" },
  activePill: { backgroundColor: "#E3F6EE" },
  activePillText: { color: "#236B51" },
  rejectedPill: { backgroundColor: "#FBE2E8" },
  rejectedPillText: { color: "#A34962" },
  businessDescription: { color: "#5F555A", fontSize: 13, lineHeight: 19 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  detailText: { color: "#756B70", fontSize: 12, lineHeight: 17 },
  registrationDate: { color: "#A79CA1", fontSize: 11, lineHeight: 15 },
  actionRow: { flexDirection: "row", gap: 9, marginTop: 3 },
  rejectButton: { flex: 1, minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#FBE2E8" },
  rejectText: { color: "#C93B58", fontSize: 13, lineHeight: 18, fontWeight: "800" },
  approveButton: { flex: 1.3, minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 14, backgroundColor: "#2E9D74" },
  approveText: { color: "#FFFFFF", fontSize: 13, lineHeight: 18, fontWeight: "800" },
  emptyBusinesses: { alignItems: "center", paddingHorizontal: 32, paddingVertical: 52, gap: 8 },
  emptyIcon: { width: 62, height: 62, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "#E3F6EE" },
  emptyTitle: { color: "#F7F9FF", fontSize: 17, lineHeight: 23, fontWeight: "900", textAlign: "center" },
  emptyText: { color: "#C5D5FF", fontSize: 13, lineHeight: 19, textAlign: "center" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { color: "#C5D5FF", fontSize: 13, lineHeight: 18 },
  lockedPage: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 34, gap: 10 },
  lockedIcon: { width: 70, height: 70, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: "#EEE8FF" },
  lockedTitle: { color: "#F7F9FF", fontSize: 20, lineHeight: 26, fontWeight: "900" },
  lockedText: { color: "#C5D5FF", fontSize: 14, lineHeight: 20, textAlign: "center" },
  backButton: { marginTop: 7, minHeight: 44, paddingHorizontal: 19, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#7057D9" },
  backButtonText: { color: "#FFFFFF", fontSize: 14, lineHeight: 19, fontWeight: "800" },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.55 },
});
