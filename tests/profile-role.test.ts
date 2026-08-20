import { describe, expect, it } from "vitest";

import { getProfileRolePresentation } from "../lib/profile-role";

describe("profile role presentation", () => {
  it("shows an administrator role before any selected app mode", () => {
    expect(getProfileRolePresentation({ authenticated: true, systemRole: "admin", appRole: "consumer" })).toMatchObject({ tone: "admin", label: "ადმინისტრატორი" });
  });

  it("shows a business account role for a signed-in business user", () => {
    expect(getProfileRolePresentation({ authenticated: true, systemRole: "user", appRole: "business" })).toMatchObject({ tone: "business", label: "ბიზნეს-ანგარიში" });
  });

  it("shows the ordinary member role for a signed-in consumer", () => {
    expect(getProfileRolePresentation({ authenticated: true, systemRole: "user", appRole: "consumer" })).toMatchObject({ tone: "member", label: "მომხმარებელი" });
  });

  it("shows a guest role before authentication", () => {
    expect(getProfileRolePresentation({ authenticated: false, appRole: "consumer" })).toMatchObject({ tone: "guest", label: "სტუმარი" });
  });
});
