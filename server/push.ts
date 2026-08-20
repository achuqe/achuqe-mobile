import { getActivePushTokensForUser } from "./db";

const statusLabels: Record<string, string> = {
  pending: "მოლოდინშია",
  confirmed: "დადასტურდა",
  preparing: "მზადდება",
  shipped: "გაგზავნილია",
  delivered: "ჩაბარდა",
  cancelled: "გაუქმდა",
};

/** Sends an order update through Expo Push Service. Delivery failures never block order status updates. */
export async function sendOrderStatusPush(userId: number, orderId: number, productName: string, status: string) {
  const tokens = await getActivePushTokensForUser(userId);
  if (!tokens.length) return;
  const body = `„${productName}“ — შეკვეთა ${statusLabels[status] ?? "განახლდა"}.`;
  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(tokens.map(({ token }) => ({ to: token, sound: "default", title: "შეკვეთის სტატუსი", body, data: { url: "/orders", orderId } }))),
    });
    if (!response.ok) console.warn("[Push] Expo push request failed", response.status);
  } catch (error) {
    console.warn("[Push] Unable to send order update", error);
  }
}
