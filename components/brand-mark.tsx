import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

interface BrandMarkProps {
  compact?: boolean;
  inverse?: boolean;
}

export function BrandMark({ compact = false, inverse = false }: BrandMarkProps) {
  return (
    <View style={styles.row}>
      <Image
        accessibilityLabel="აჩუქე"
        source={require("../assets/images/icon.png")}
        contentFit="cover"
        transition={180}
        cachePolicy="memory-disk"
        style={[styles.logo, compact && styles.logoCompact]}
      />
      {!compact ? <Text style={[styles.name, inverse && styles.nameInverse]}>აჩუქე</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#E94F6D",
  },
  logoCompact: {
    width: 36,
    height: 36,
    borderRadius: 11,
  },
  name: {
    color: "#F7F9FF",
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "800",
    letterSpacing: -0.5,
    textShadowColor: "rgba(0,0,0,0.26)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  nameInverse: {
    color: "#FFFFFF",
  },
});
