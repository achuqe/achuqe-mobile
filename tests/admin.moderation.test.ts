import { afterEach, describe, expect, it, vi } from "vitest";

import * as db from "../server/db";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

function createContext(userId: number, role: "user" | "admin"): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `${role}-${userId}`,
      email: `${role}${userId}@example.com`,
      name: "Test Admin",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("admin business moderation", () => {
  it("blocks a regular user from reading the full business moderation list", async () => {
    const caller = appRouter.createCaller(createContext(5, "user"));
    await expect(caller.admin.businesses()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows an admin to filter the business moderation list by status", async () => {
    const businessesSpy = vi.spyOn(db, "getBusinessesForAdmin").mockResolvedValue([]);
    const caller = appRouter.createCaller(createContext(1, "admin"));

    await caller.admin.businesses({ status: "rejected" });

    expect(businessesSpy).toHaveBeenCalledWith("rejected");
  });

  it("blocks a regular user from reading pending business applications", async () => {
    const caller = appRouter.createCaller(createContext(5, "user"));
    await expect(caller.admin.pendingBusinesses()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows an admin to read pending business applications", async () => {
    const pendingSpy = vi.spyOn(db, "getPendingBusinessesForAdmin").mockResolvedValue([]);
    const caller = appRouter.createCaller(createContext(1, "admin"));

    await caller.admin.pendingBusinesses();

    expect(pendingSpy).toHaveBeenCalledOnce();
  });

  it("passes only an admin-approved status transition to the moderation helper", async () => {
    const approvalSpy = vi.spyOn(db, "setBusinessApprovalForAdmin").mockResolvedValue({ success: true });
    const caller = appRouter.createCaller(createContext(1, "admin"));

    await caller.admin.setBusinessApproval({ id: 14, status: "active" });

    expect(approvalSpy).toHaveBeenCalledWith(14, "active");
  });

  it("marks an admin notification as read only through the protected admin route", async () => {
    const readSpy = vi.spyOn(db, "markAdminNotificationRead").mockResolvedValue({ success: true });
    const caller = appRouter.createCaller(createContext(1, "admin"));

    await caller.admin.markNotificationRead({ id: 22 });

    expect(readSpy).toHaveBeenCalledWith(22);
  });
});
