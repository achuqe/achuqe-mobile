import type { InterestId } from "./achuqe";
import type { ProductPriceSort } from "./product-search";

export type SavedCatalogFilter = {
  id: string;
  name: string;
  interest: InterestId | null;
  minimumPrice: string;
  maximumPrice: string;
  priceSort: ProductPriceSort;
  createdAt: number;
};

export type SavedCatalogFilterInput = Omit<SavedCatalogFilter, "id" | "createdAt">;

const VALID_PRICE_SORTS: ProductPriceSort[] = ["default", "price-asc", "price-desc"];

export function hasSavableCatalogFilter(filter: SavedCatalogFilterInput): boolean {
  return Boolean(filter.interest || filter.minimumPrice.trim() || filter.maximumPrice.trim() || filter.priceSort !== "default");
}

export function createSavedCatalogFilter(input: SavedCatalogFilterInput, now = Date.now(), id = `${now}-${Math.random().toString(36).slice(2, 8)}`): SavedCatalogFilter {
  return {
    id,
    name: input.name.trim().slice(0, 32),
    interest: input.interest,
    minimumPrice: input.minimumPrice.trim(),
    maximumPrice: input.maximumPrice.trim(),
    priceSort: input.priceSort,
    createdAt: now,
  };
}

export function parseSavedCatalogFilters(serialized: string | null): SavedCatalogFilter[] {
  if (!serialized) return [];
  try {
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is SavedCatalogFilter => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Record<string, unknown>;
      return typeof candidate.id === "string" && typeof candidate.name === "string" && candidate.name.trim().length > 0
        && (typeof candidate.interest === "string" || candidate.interest === null)
        && typeof candidate.minimumPrice === "string" && typeof candidate.maximumPrice === "string"
        && typeof candidate.priceSort === "string" && VALID_PRICE_SORTS.includes(candidate.priceSort as ProductPriceSort)
        && typeof candidate.createdAt === "number";
    }).slice(0, 8);
  } catch {
    return [];
  }
}

export function mergeSavedCatalogFilter(filters: SavedCatalogFilter[], next: SavedCatalogFilter): SavedCatalogFilter[] {
  const normalizedName = next.name.toLocaleLowerCase();
  return [next, ...filters.filter((filter) => filter.name.toLocaleLowerCase() !== normalizedName)].slice(0, 8);
}
