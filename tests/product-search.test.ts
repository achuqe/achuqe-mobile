import { describe, expect, it } from "vitest";

import { filterProductsByPrice, searchAndSortProducts } from "../shared/product-search";

const products = [
  { name: "არომატული სანთელი", price: 42 },
  { name: "უსადენო ყურსასმენები", price: 189 },
  { name: "კერამიკის ჭიქა", price: 65 },
];

describe("product search and price sorting", () => {
  it("filters products by a partial name without changing the default order", () => {
    expect(searchAndSortProducts(products, "ყურსასმენ")).toEqual([{ name: "უსადენო ყურსასმენები", price: 189 }]);
  });

  it("sorts searched products from the lowest price to the highest", () => {
    expect(searchAndSortProducts(products, "", "price-asc").map((product) => product.price)).toEqual([42, 65, 189]);
  });

  it("sorts searched products from the highest price to the lowest", () => {
    expect(searchAndSortProducts(products, "", "price-desc").map((product) => product.price)).toEqual([189, 65, 42]);
  });

  it("keeps only products within the selected minimum and maximum price", () => {
    expect(filterProductsByPrice(products, "50", "100")).toEqual([{ name: "კერამიკის ჭიქა", price: 65 }]);
  });

  it("returns no products when the minimum price is higher than the maximum price", () => {
    expect(filterProductsByPrice(products, "200", "100")).toEqual([]);
  });
});
