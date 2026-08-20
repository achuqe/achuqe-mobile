import type { GiftProduct } from "./achuqe";

export type ProductPriceSort = "default" | "price-asc" | "price-desc";

export function searchAndSortProducts<T extends Pick<GiftProduct, "name" | "price">>(
  products: T[],
  query: string,
  priceSort: ProductPriceSort = "default",
): T[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const searched = normalizedQuery
    ? products.filter((product) => product.name.toLocaleLowerCase().includes(normalizedQuery))
    : [...products];

  if (priceSort === "default") return searched;
  return searched.sort((first, second) => priceSort === "price-asc" ? first.price - second.price : second.price - first.price);
}

export function parsePriceInput(value: string): number | undefined {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export function filterProductsByPrice<T extends Pick<GiftProduct, "price">>(products: T[], minimumInput: string, maximumInput: string): T[] {
  const minimum = parsePriceInput(minimumInput);
  const maximum = parsePriceInput(maximumInput);
  if (minimum !== undefined && maximum !== undefined && minimum > maximum) return [];
  return products.filter((product) => (minimum === undefined || product.price >= minimum) && (maximum === undefined || product.price <= maximum));
}
