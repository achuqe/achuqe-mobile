import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const checkoutSource = readFileSync(resolve(process.cwd(), "app/order-checkout.tsx"), "utf8");
const businessOrdersSource = readFileSync(resolve(process.cwd(), "app/business/orders.tsx"), "utf8");

describe("hidden commission interfaces", () => {
  it("shows the customer payment fee and final price without business platform-fee details", () => {
    expect(checkoutSource).toContain("საბოლოო გადასახდელი თანხა");
    expect(checkoutSource).toContain("გადახდის მომსახურება");
    expect(checkoutSource).toContain("3% ერთჯერადი საკომისიო");
    expect(checkoutSource).not.toContain("„აჩუქე“-ს საკომისიო");
    expect(checkoutSource).not.toContain("ბიზნესისთვის დასარიცხი");
    expect(checkoutSource).not.toContain("platformFeeInTetri");
  });

  it("shows a business its own payout without exposing platform fee details", () => {
    expect(businessOrdersSource).toContain("შენთვის დასარიცხი");
    expect(businessOrdersSource).not.toContain("platformFeeInTetri");
    expect(businessOrdersSource).not.toContain("საკომისიო (6%)");
  });
});
