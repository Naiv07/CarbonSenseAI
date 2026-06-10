import { describe, it, expect } from "vitest";
import { getCurrencySymbol, getCurrencyCode } from "../src/utils/currency";

describe("getCurrencySymbol", () => {
  it("India → ₹", () => {
    expect(getCurrencySymbol("India")).toBe("₹");
  });

  it("United Kingdom → £", () => {
    expect(getCurrencySymbol("United Kingdom")).toBe("£");
  });

  it("United States → $", () => {
    expect(getCurrencySymbol("United States")).toBe("$");
  });

  it("Japan → ¥", () => {
    expect(getCurrencySymbol("Japan")).toBe("¥");
  });

  it("Germany → € (eurozone)", () => {
    expect(getCurrencySymbol("Germany")).toBe("€");
  });

  it("unknown country → falls back to $", () => {
    expect(getCurrencySymbol("Atlantis")).toBe("$");
  });

  it("empty string → falls back to $", () => {
    expect(getCurrencySymbol("")).toBe("$");
  });
});

describe("getCurrencyCode", () => {
  it("India → INR", () => {
    expect(getCurrencyCode("India")).toBe("INR");
  });

  it("United Kingdom → GBP", () => {
    expect(getCurrencyCode("United Kingdom")).toBe("GBP");
  });

  it("United States → USD", () => {
    expect(getCurrencyCode("United States")).toBe("USD");
  });

  it("South Korea → KRW", () => {
    expect(getCurrencyCode("South Korea")).toBe("KRW");
  });

  it("unknown country → falls back to USD", () => {
    expect(getCurrencyCode("Narnia")).toBe("USD");
  });
});
