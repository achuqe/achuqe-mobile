import { describe, expect, it } from "vitest";

import { rankGiftProducts } from "../shared/recommendations";
import type { GiftAnswers, GiftProduct } from "../shared/achuqe";

const matchingGift: GiftProduct = {
  id: "matching",
  businessId: "business-1",
  businessName: "Test Studio",
  name: "Music Gift",
  description: "A matching music gift",
  price: 120,
  currency: "₾",
  imageUrl: "/gift.png",
  occasions: ["birthday"],
  interests: ["music", "technology"],
  ageRanges: ["25-34"],
  genders: ["any"],
  relationships: ["friend"],
  deliveryLabel: "Tomorrow",
  city: "Tbilisi",
  status: "active",
};

const unrelatedGift: GiftProduct = {
  ...matchingGift,
  id: "unrelated",
  name: "Home Gift",
  interests: ["home"],
  occasions: ["housewarming"],
  relationships: ["colleague"],
  price: 90,
};

const answers: GiftAnswers = {
  occasion: "birthday",
  gender: "woman",
  ageRange: "25-34",
  relationship: "friend",
  interests: ["music", "technology"],
  minBudget: 100,
  maxBudget: 180,
};

describe("rankGiftProducts", () => {
  it("ranks the strongest match first and explains the result", () => {
    const result = rankGiftProducts([unrelatedGift, matchingGift], answers);

    expect(result[0].id).toBe("matching");
    expect(result[0].score).toBeGreaterThan(result[1].score);
    expect(result[0].matchReasons).toContain("ზუსტად თქვენს ბიუჯეტშია");
  });

  it("filters out products above the selected maximum budget", () => {
    const expensiveGift: GiftProduct = { ...matchingGift, id: "expensive", price: 500 };
    const result = rankGiftProducts([matchingGift, expensiveGift], answers);

    expect(result.map((item) => item.id)).toEqual(["matching"]);
  });

  it("does not return paused products", () => {
    const pausedGift: GiftProduct = { ...matchingGift, id: "paused", status: "paused" };
    expect(rankGiftProducts([pausedGift], answers)).toEqual([]);
  });
});
