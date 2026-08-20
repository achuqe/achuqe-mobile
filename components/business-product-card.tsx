import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { resolveAssetUrl } from "@/lib/assets";
import type { GiftProduct, ProductStatus } from "@/shared/achuqe";

const statusCopy: Record<ProductStatus, { label: string; color: string; tint: string }> = {
  active: { label: "აქტიური", color: "#2E9D74", tint: "#E7F5EF" },
  paused: { label: "დაპაუზებული", color: "#9A6811", tint: "#FFF2D9" },
  draft: { label: "მონახაზი", color: "#756B70", tint: "#F2ECE9" },
  deleted: { label: "წაშლილი", color: "#9A4B5B", tint: "#FBE2E8" },
};

type ManageableProductStatus = Exclude<ProductStatus, "deleted">;

interface BusinessProductCardProps {
  product: GiftProduct;
  onEdit: () => void;
  onChangeStatus: (status: ManageableProductStatus) => void | Promise<void>;
  onDelete: () => void | Promise<void>;
  changingStatus?: boolean;
  deleting?: boolean;
}

export function BusinessProductCard({ product, onEdit, onChangeStatus, onDelete, changingStatus = false, deleting = false }: BusinessProductCardProps) {
  const status = statusCopy[product.status];
  const nextStatus: ManageableProductStatus = product.status === "active" ? "paused" : "active";
  const requestDelete = () => {
    const message = `ნამდვილად გინდა „${product.name}“-ს წაშლა? პროდუქტი მომხმარებლებისთვის აღარ გამოჩნდება.`;
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(message)) void onDelete();
      return;
    }
    Alert.alert("პროდუქტის წაშლა", message, [
      { text: "გაუქმება", style: "cancel" },
      { text: "წაშლა", style: "destructive", onPress: () => void onDelete() },
    ]);
  };

  return (
    <View style={styles.card}>
      <Image
        pointerEvents="none"
        source={resolveAssetUrl(product.imageUrl)}
        contentFit="cover"
        transition={180}
        cachePolicy="memory-disk"
        style={styles.image}
      />
      <View style={styles.body}>
        <View style={styles.statusRow}>
          <View style={[styles.status, { backgroundColor: status.tint }]}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
          <View style={styles.actions}>
            <Pressable disabled={changingStatus || deleting} onPress={onEdit} hitSlop={8} style={({ pressed }) => [styles.editButton, pressed && styles.pressed, (changingStatus || deleting) && styles.disabled]}>
              <MaterialIcons name="edit" size={18} color="#7057D9" />
            </Pressable>
            <Pressable
              disabled={changingStatus || deleting}
              onPress={requestDelete}
              hitSlop={8}
              style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed, (changingStatus || deleting) && styles.disabled]}
            >
              {deleting ? <ActivityIndicator size="small" color="#C93B58" /> : <MaterialIcons name="delete-outline" size={19} color="#C93B58" />}
            </Pressable>
          </View>
        </View>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.price}>{product.price} {product.currency}</Text>
        {product.status !== "deleted" ? <Pressable
          disabled={changingStatus}
          onPress={() => void onChangeStatus(nextStatus)}
          style={({ pressed }) => [styles.statusAction, pressed && styles.pressed, changingStatus && styles.disabled]}
        >
          {changingStatus ? <ActivityIndicator size="small" color="#7057D9" /> : <MaterialIcons name={product.status === "active" ? "pause-circle-outline" : "play-circle-outline"} size={18} color="#7057D9" />}
          <Text style={styles.statusActionText}>{changingStatus ? "ინახება..." : product.status === "active" ? "დაპაუზება" : "გააქტიურება"}</Text>
        </Pressable> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderRadius: 20, borderWidth: 1, borderColor: "#EADFDA", overflow: "hidden", flexDirection: "row", minHeight: 142 },
  image: { width: 122, backgroundColor: "#F8ECE8" },
  body: { flex: 1, padding: 13, gap: 6 },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  actions: { flexDirection: "row", alignItems: "center", gap: 6 },
  status: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 11, paddingHorizontal: 8, paddingVertical: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, lineHeight: 14, fontWeight: "800" },
  editButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#EEE8FF", alignItems: "center", justifyContent: "center" },
  deleteButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#FBE2E8", alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.62 },
  disabled: { opacity: 0.55 },
  name: { color: "#251F24", fontSize: 15, lineHeight: 20, fontWeight: "800" },
  price: { color: "#E94F6D", fontSize: 16, lineHeight: 21, fontWeight: "800" },
  statusAction: { marginTop: "auto", flexDirection: "row", alignItems: "center", gap: 5 },
  statusActionText: { color: "#7057D9", fontSize: 12, lineHeight: 16, fontWeight: "700" },
});
