import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";

import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export function PushNotificationSync() {
  const { isAuthenticated } = useAuth();
  const register = trpc.notifications.registerPushToken.useMutation();

  useEffect(() => {
    if (!isAuthenticated || Platform.OS === "web") return;
    let cancelled = false;
    const setup = async () => {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("order-updates", { name: "შეკვეთების განახლებები", importance: Notifications.AndroidImportance.HIGH, vibrationPattern: [0, 180, 80, 180], lightColor: "#E94F6D" });
      }
      const current = await Notifications.getPermissionsAsync();
      const permission = current.status === "granted" ? current : await Notifications.requestPermissionsAsync();
      if (permission.status !== "granted" || cancelled) return;
      const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) return;
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      if (!cancelled && (Platform.OS === "ios" || Platform.OS === "android")) {
        await register.mutateAsync({ token, platform: Platform.OS });
      }
    };
    void setup().catch((error) => console.warn("[Push] Registration unavailable", error));
    return () => { cancelled = true; };
  }, [isAuthenticated, register]);

  return null;
}
