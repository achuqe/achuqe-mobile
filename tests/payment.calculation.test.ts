import { describe, expect, it } from "vitest";

import { calculatePaymentAmounts, CUSTOMER_PAYMENT_FEE_BPS, PLATFORM_FEE_BPS } from "../shared/payment";

describe("platform and customer payment commission calculation", () => {
  it("adds 3% to the customer total while preserving 6% platform fee and 94% business payout", () => {
    const result = calculatePaymentAmounts(10_000);

    expect(PLATFORM_FEE_BPS).toBe(600);
    expect(CUSTOMER_PAYMENT_FEE_BPS).toBe(300);
    expect(result).toEqual({
      grossAmountInTetri: 10_000,
      customerPaymentFeeInTetri: 300,
      customerTotalInTetri: 10_300,
      platformFeeInTetri: 600,
      businessPayoutInTetri: 9_400,
      platformRevenueInTetri: 900,
    });
  });

  it("uses tetri-level rounding while preserving the full order total", () => {
    const result = calculatePaymentAmounts(999);

    expect(result.platformFeeInTetri).toBe(60);
    expect(result.customerPaymentFeeInTetri).toBe(30);
    expect(result.customerTotalInTetri).toBe(1_029);
    expect(result.businessPayoutInTetri).toBe(939);
    expect(result.platformFeeInTetri + result.businessPayoutInTetri).toBe(result.grossAmountInTetri);
  });

  it("rejects invalid negative and fractional tetri values", () => {
    expect(() => calculatePaymentAmounts(-1)).toThrow();
    expect(() => calculatePaymentAmounts(10.5)).toThrow();
  });
});
