export const PLATFORM_FEE_BPS = 600;
export const CUSTOMER_PAYMENT_FEE_BPS = 300;

export type PaymentProvider = "test" | "tbc" | "bog";
export type PaymentStatus = "awaiting_payment" | "paid" | "failed" | "refunded";

export interface PaymentAmounts {
  grossAmountInTetri: number;
  customerPaymentFeeInTetri: number;
  customerTotalInTetri: number;
  platformFeeInTetri: number;
  businessPayoutInTetri: number;
  platformRevenueInTetri: number;
}

export function calculatePaymentAmounts(grossAmountInTetri: number): PaymentAmounts {
  if (!Number.isInteger(grossAmountInTetri) || grossAmountInTetri < 0) {
    throw new Error("Gross amount must be a non-negative integer in tetri");
  }
  const platformFeeInTetri = Math.round((grossAmountInTetri * PLATFORM_FEE_BPS) / 10_000);
  const customerPaymentFeeInTetri = Math.round((grossAmountInTetri * CUSTOMER_PAYMENT_FEE_BPS) / 10_000);
  return {
    grossAmountInTetri,
    customerPaymentFeeInTetri,
    customerTotalInTetri: grossAmountInTetri + customerPaymentFeeInTetri,
    platformFeeInTetri,
    businessPayoutInTetri: grossAmountInTetri - platformFeeInTetri,
    platformRevenueInTetri: platformFeeInTetri + customerPaymentFeeInTetri,
  };
}
