import { Redirect } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAuth } from "@/hooks/use-auth";
import { useApp } from "@/lib/app-context";

export default function EntryScreen() {
  const { isHydrated, onboardingComplete, completeOnboarding } = useApp();
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !onboardingComplete) {
      completeOnboarding();
    }
  }, [completeOnboarding, isAuthenticated, onboardingComplete]);

  if (!isHydrated || authLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#E94F6D" />
      </View>
    );
  }

  return <Redirect href={onboardingComplete || isAuthenticated ? "/(tabs)" : "/onboarding"} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF8F5",
  },
});
