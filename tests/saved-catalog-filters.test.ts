import { describe, expect, it } from "vitest";

import { createSavedCatalogFilter, hasSavableCatalogFilter, mergeSavedCatalogFilter, parseSavedCatalogFilters } from "../shared/saved-catalog-filters";

const baseFilter = {
  name: "დაბადების დღე",
  interest: "art" as const,
  minimumPrice: "30",
  maximumPrice: "90",
  priceSort: "price-asc" as const,
};

describe("saved catalog filters", () => {
  it("creates a normalized named filter from the user's current selection", () => {
    const filter = createSavedCatalogFilter({ ...baseFilter, name: "  ბიუჯეტური საჩუქრები  " }, 10, "filter-1");
    expect(filter).toEqual({ ...baseFilter, name: "ბიუჯეტური საჩუქრები", id: "filter-1", createdAt: 10 });
  });

  it("recognizes when the current state contains a filter worth saving", () => {
    expect(hasSavableCatalogFilter({ ...baseFilter, name: "" })).toBe(true);
    expect(hasSavableCatalogFilter({ name: "", interest: null, minimumPrice: "", maximumPrice: "", priceSort: "default" })).toBe(false);
  });

  it("rejects malformed stored content and retains valid saved filters", () => {
    expect(parseSavedCatalogFilters("not-json")).toEqual([]);
    const valid = createSavedCatalogFilter(baseFilter, 10, "filter-1");
    const serialized = JSON.stringify([valid, { id: 3, name: "invalid" }]);
    expect(parseSavedCatalogFilters(serialized)).toEqual([valid]);
  });

  it("updates a saved filter with the same name instead of creating duplicates", () => {
    const first = createSavedCatalogFilter(baseFilter, 10, "filter-1");
    const replacement = createSavedCatalogFilter({ ...baseFilter, minimumPrice: "50", name: "დაბადების დღე" }, 20, "filter-2");
    expect(mergeSavedCatalogFilter([first], replacement)).toEqual([replacement]);
  });
});
