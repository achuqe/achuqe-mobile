import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { resolveAssetUrl } from "@/lib/assets";
import { haptic } from "@/lib/haptics";
import type { GiftProduct } from "@/shared/achuqe";

interface ProductCardProps {
  product: GiftProduct;
  onPress: () => void;
  favorite: boolean;
  onToggleFavorite: () => void;
  score?: number;
  compact?: boolean;
}

export function ProductCard({
  product,
  onPress,
  favorite,
  onToggleFavorite,
  score,
  compact = false,
}: ProductCardProps) {
  const handleFavorite = (event: { stopPropagation?: () => void }) => {
    event.stopPropagation?.();
    haptic.selection();
    onToggleFavorite();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${product.price} ლარი`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, compact && styles.cardCompact, pressed && styles.pressed]}
    >
      <View style={[styles.imageWrap, compact && styles.imageWrapCompact]}>
        <Image
          source={resolveAssetUrl(product.imageUrl)}
          contentFit="cover"
          transition={220}
          cachePolicy="memory-disk"
          recyclingKey={product.id}
          style={styles.image}
        />
        {typeof score === "number" ? (
          <View style={styles.scoreBadge}>
            <MaterialIcons name="auto-awesome" size={13} color="#7057D9" />
            <Text style={styles.scoreText}>{score}%</Text>
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={favorite ? "რჩეულებიდან ამოშლა" : "რჩეულებში დამატება"}
          onPress={handleFavorite}
          hitSlop={10}
          style={({ pressed }) => [styles.favoriteButton, pressed && styles.favoritePressed]}
        >
          <MaterialIcons name={favorite ? "favorite" : "favorite-border"} size={20} color="#E94F6D" />
        </Pressable>
      </View>
      <View style={styles.body}>
        <Text style={styles.business} numberOfLines={1}>{product.businessName}</Text>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <View style={styles.footer}>
          <Text style={styles.price}>{product.price} {product.currency}</Text>
          <View style={styles.delivery}>
            <MaterialIcons name="local-shipping" size={14} color="#756B70" />
            <Text style={styles.deliveryText} numberOfLines={1}>{product.deliveryLabel}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 218,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#F0E7E3",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 7,
  },
  cardCompact: {
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  imageWrap: {
    height: 192,
    backgroundColor: "#F9EEEA",
    position: "relative",
  },
  imageWrapCompact: {
    width: 120,
    height: 142,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  favoriteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
  },
  favoritePressed: {
    opacity: 0.62,
    transform: [{ scale: 0.94 }],
  },
  scoreBadge: {
    position: "absolute",
    left: 12,
    top: 12,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.94)",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  scoreText: {
    color: "#7057D9",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
  },
  body: {
    flex: 1,
    padding: 14,
    gap: 5,
  },
  business: {
    color: "#8C7F85",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  name: {
    color: "#251F24",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
    minHeight: 42,
  },
  footer: {
    marginTop: "auto",
    gap: 7,
  },
  price: {
    color: "#E94F6D",
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "800",
  },
  delivery: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  deliveryText: {
    flex: 1,
    color: "#756B70",
    fontSize: 11,
    lineHeight: 15,
  },
});
