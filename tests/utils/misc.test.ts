import { describe, expect, it } from "vitest";
import { formatNaira, roundMoney } from "@/lib/utils/format-currency";
import { sanitizeNextPath } from "@/lib/utils/redirects";
import { isProtectedPath } from "@/lib/supabase/middleware";
import { parseProductFilters } from "@/lib/products/filters";
import { getStockStatus } from "@/types/product";

describe("formatNaira", () => {
  it("formats whole and fractional amounts", () => {
    expect(formatNaira(12500)).toBe("₦12,500");
    expect(formatNaira(12500.5)).toBe("₦12,500.50");
    expect(formatNaira(0)).toBe("₦0");
    expect(formatNaira(Number.NaN)).toBe("₦0");
  });
  it("roundMoney rounds to kobo", () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(roundMoney(18500 * 3)).toBe(55500);
  });
});

describe("sanitizeNextPath", () => {
  it("allows same-origin paths", () => {
    expect(sanitizeNextPath("/orders")).toBe("/orders");
    expect(sanitizeNextPath("/checkout?x=1")).toBe("/checkout?x=1");
  });
  it.each(["//evil.com", "https://evil.com", "javascript:alert(1)", "/javascript:x", "orders", "", null, undefined, "/\\evil"])("falls back for %j", (v) => {
    expect(sanitizeNextPath(v as string)).toBe("/account");
  });
});

describe("isProtectedPath", () => {
  it.each(["/checkout", "/checkout/confirmation/PC-1", "/orders", "/orders/abc", "/account"])("protects %s", (p) => {
    expect(isProtectedPath(p)).toBe(true);
  });
  it.each(["/", "/shop", "/products/x", "/login", "/ordersx", "/accounting"])("leaves %s public", (p) => {
    expect(isProtectedPath(p)).toBe(false);
  });
});

describe("parseProductFilters", () => {
  it("parses and validates query params", () => {
    expect(parseProductFilters({ q: " teal ", category: "interior", min: "1000", max: "50000", inStock: "1", sort: "price_desc" })).toEqual({
      query: "teal",
      category: "interior",
      minPrice: 1000,
      maxPrice: 50000,
      inStockOnly: true,
      sort: "price_desc",
    });
  });
  it("drops invalid values", () => {
    expect(parseProductFilters({ category: "weapons", min: "-5", max: "abc", sort: "random" })).toEqual({
      query: undefined,
      category: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      inStockOnly: false,
      sort: "featured",
    });
  });
});

describe("getStockStatus", () => {
  it("classifies stock levels", () => {
    expect(getStockStatus(0)).toBe("out_of_stock");
    expect(getStockStatus(5)).toBe("low_stock");
    expect(getStockStatus(6)).toBe("in_stock");
  });
});
