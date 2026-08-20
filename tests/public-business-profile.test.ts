import { afterEach, describe, expect, it, vi } from "vitest";

import * as db from "../server/db";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

function createContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("public business profile", () => {
  it("allows a visitor to load an approved public business profile", async () => {
    const expected = {
      business: {
        id: 18,
        name: "საჩუქრების სახლი",
        category: "დეკორი",
        description: "ხელნაკეთი საჩუქრები ყველა შემთხვევისთვის.",
        city: "თბილისი",
        contact: "@giftshouse",
        createdAt: new Date(),
      },
      products: [],
    };
    const getSpy = vi.spyOn(db, "getPublicBusinessProfile").mockResolvedValue(expected as never);
    const caller = appRouter.createCaller(createContext());

    await expect(caller.businesses.publicProfile({ id: 18 })).resolves.toEqual(expected);
    expect(getSpy).toHaveBeenCalledWith(18);
  });

  it("returns no public data when the business is not publicly available", async () => {
    vi.spyOn(db, "getPublicBusinessProfile").mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext());

    await expect(caller.businesses.publicProfile({ id: 18 })).resolves.toBeUndefined();
  });

  it("rejects an invalid business id before requesting profile data", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.businesses.publicProfile({ id: 0 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
