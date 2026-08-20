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
        name: "Nino Beridze",
        loginMethod: "google",
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

afterEach(() => {
  vi.restoreAllMocks();
});

describe("personal profile consent", () => {
  it("blocks anonymous users from saving consent-based profile details", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.profile.savePersonalDetails({ firstName: "Nino", lastName: "Beridze", birthDate: "1995-04-12" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("blocks anonymous users from uploading a profile photo", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.profile.uploadAvatar({ base64: "aGVsbG8=", contentType: "image/jpeg", extension: "jpg" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects unsupported profile photo formats before storage", async () => {
    const caller = appRouter.createCaller(createContext(28));
    await expect(caller.profile.uploadAvatar({ base64: "aGVsbG8=", contentType: "image/gif" as never, extension: "jpg" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("saves personal details only for the authenticated user", async () => {
    const saveSpy = vi.spyOn(db, "savePersonalProfileForUser").mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext(28));

    await caller.profile.savePersonalDetails({ firstName: "Nino", lastName: "Beridze", birthDate: "1995-04-12" });

    expect(saveSpy).toHaveBeenCalledWith(28, { firstName: "Nino", lastName: "Beridze", birthDate: "1995-04-12" });
  });

  it("saves the phone number only with the authenticated user's personal profile", async () => {
    const saveSpy = vi.spyOn(db, "savePersonalProfileForUser").mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext(28));

    await caller.profile.savePersonalDetails({ firstName: "Nino", lastName: "Beridze", birthDate: "1995-04-12", phone: "+995 555 12 34 56" });

    expect(saveSpy).toHaveBeenCalledWith(28, { firstName: "Nino", lastName: "Beridze", birthDate: "1995-04-12", phone: "+995 555 12 34 56" });
  });

  it("rejects a future birth date", async () => {
    const caller = appRouter.createCaller(createContext(28));
    await expect(caller.profile.savePersonalDetails({ firstName: "Nino", lastName: "Beridze", birthDate: "2999-01-01" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
