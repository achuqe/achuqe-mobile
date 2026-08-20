import { afterEach, describe, expect, it, vi } from "vitest";

import * as db from "../server/db";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

function createContext(userId?: number): TrpcContext {
  const user = userId
    ? { id: userId, openId: `user-${userId}`, email: `user${userId}@example.com`, name: "Test User", loginMethod: "manus", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }
    : null;
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"] };
}

const orderInput = {
  productId: 5,
  quantity: 2,
  customerName: "ნინო ბერიძე",
  customerPhone: "+995 555 12 34 56",
  deliveryAddress: "თბილისი, ჭავჭავაძის გამზირი 10, ბინა 4",
  note: "დარეკეთ კართან მოსვლამდე",
};

afterEach(() => vi.restoreAllMocks());

describe("orders and business notifications authorization", () => {
  it("blocks anonymous visitors from creating or reading orders", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.orders.create(orderInput)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.orders.confirmTestPayment({ id: 4 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.orders.customerList()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.orders.businessList()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.orders.businessPayouts()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.notifications.businessList()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.notifications.registerPushToken({ token: "ExponentPushToken[anonymous-device]", platform: "ios" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("passes the authenticated buyer to the order creation helper", async () => {
    const createSpy = vi.spyOn(db, "createOrderForUser").mockResolvedValue({
      orderId: 12,
      grossAmountInTetri: 25_000,
      customerPaymentFeeInTetri: 750,
      customerTotalInTetri: 25_750,
      platformFeeInTetri: 1_500,
      businessPayoutInTetri: 23_500,
      platformRevenueInTetri: 2_250,
      paymentProvider: "test",
      paymentStatus: "awaiting_payment",
    });
    const caller = appRouter.createCaller(createContext(42));
    await caller.orders.create(orderInput);
    expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({ ...orderInput, customerUserId: 42 }));
  });

  it("uses the authenticated business owner for order status and notification read actions", async () => {
    const statusSpy = vi.spyOn(db, "updateOrderStatusForBusiness").mockResolvedValue({ success: true });
    const readSpy = vi.spyOn(db, "markBusinessNotificationRead").mockResolvedValue({ success: true });
    const caller = appRouter.createCaller(createContext(8));
    await caller.orders.updateStatus({ id: 14, status: "confirmed" });
    await caller.notifications.markRead({ id: 31 });
    expect(statusSpy).toHaveBeenCalledWith(8, 14, "confirmed");
    expect(readSpy).toHaveBeenCalledWith(8, 31);
  });

  it("passes the authenticated buyer id to test payment confirmation", async () => {
    const confirmSpy = vi.spyOn(db, "confirmTestPaymentForUser").mockResolvedValue({ orderId: 5, paymentReference: "TEST-5", alreadyPaid: false });
    const caller = appRouter.createCaller(createContext(19));

    await caller.orders.confirmTestPayment({ id: 5 });

    expect(confirmSpy).toHaveBeenCalledWith(19, 5);
  });

  it("returns customer history and links a push token only to the authenticated user", async () => {
    const historySpy = vi.spyOn(db, "getCustomerOrders").mockResolvedValue([]);
    const tokenSpy = vi.spyOn(db, "upsertPushTokenForUser").mockResolvedValue({ success: true });
    const caller = appRouter.createCaller(createContext(27));

    await caller.orders.customerList();
    await caller.notifications.registerPushToken({ token: "ExponentPushToken[user-27-device]", platform: "android" });

    expect(historySpy).toHaveBeenCalledWith(27);
    expect(tokenSpy).toHaveBeenCalledWith(27, "ExponentPushToken[user-27-device]", "android");
  });
});
