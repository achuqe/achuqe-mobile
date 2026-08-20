import { describe, expect, it } from "vitest";

import { formatGeorgianMobile } from "../lib/phone";

describe("formatGeorgianMobile", () => {
  it("formats a complete local mobile number as 598-90-08-49", () => {
    expect(formatGeorgianMobile("598900849")).toBe("598-90-08-49");
  });

  it("keeps the final ninth digit when formatting a complete number", () => {
    expect(formatGeorgianMobile("555123456")).toBe("555-12-34-56");
  });

  it("formats partial input as the user types", () => {
    expect(formatGeorgianMobile("59890")).toBe("598-90");
  });

  it("normalizes an optional 995 country prefix before formatting", () => {
    expect(formatGeorgianMobile("+995598900849")).toBe("598-90-08-49");
  });
});
