import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

function run(effect: () => Promise<void>) {
  if (Platform.OS !== "web") {
    void effect();
  }
}

export const haptic = {
  light: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  selection: () => run(() => Haptics.selectionAsync()),
  success: () => {
    run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    if (Platform.OS !== "web") {
      setTimeout(() => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)), 90);
    }
  },
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
