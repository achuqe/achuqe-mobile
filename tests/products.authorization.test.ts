import { afterEach, describe, expect, it, vi } from "vitest";

import * as db from "../server/db";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

function createContext(userId?: number): TrpcContext {
  const user = userId
    ? {
        id: userId,
        openId: `user-${userId}`,
        email: `user${userId}@example.com`,
        name: "Test User",
        loginMethod: "manus",
        role: "user" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      }
    : null;

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const productInput = {
  name: "Test Gift",
  description: "A sufficiently detailed product description",
  price: 100,
  imageUrl: "/gift.png",
  occasions: ["birthday" as const],
  interests: ["music" as const],
  ageRanges: ["25-34" as const],
  genders: ["any" as const],
  relationships: ["friend" as const],
  deliveryLabel: "Delivery tomorrow",
  city: "Tbilisi",
  status: "active" as const,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("products authorization", () => {
  it("blocks anonymous users from business product data", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.products.mine()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("passes the authenticated user id into the ownership-checked update helper", async () => {
    const updateSpy = vi.spyOn(db, "updateProductForUser").mockResolvedValue({ success: true });
    const caller = appRouter.createCaller(createContext(42));

    await caller.products.update({ id: 7, product: productInput });

    expect(updateSpy).toHaveBeenCalledWith(
      42,
      7,
      expect.objectContaining({ name: "Test Gift", priceInTetri: 10_000 }),
    );
  });

  it("passes the authenticated user id when changing product status", async () => {
    const statusSpy = vi.spyOn(db, "setProductStatusForUser").mockResolvedValue({ success: true });
    const caller = appRouter.createCaller(createContext(9));

    await caller.products.setStatus({ id: 3, status: "paused" });

    expect(statusSpy).toHaveBeenCalledWith(9, 3, "paused");
  });

  it("passes the authenticated user id into the ownership-checked soft-delete helper", async () => {
    const deleteSpy = vi.spyOn(db, "deleteProductForUser").mockResolvedValue({ success: true });
    const caller = appRouter.createCaller(createContext(31));

    await caller.products.delete({ id: 8 });

    expect(deleteSpy).toHaveBeenCalledWith(31, 8);
  });
});
