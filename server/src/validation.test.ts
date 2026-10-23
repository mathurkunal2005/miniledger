import { describe, it, expect } from "vitest";
import { phoneSchema } from "./routes/auth";
import { createLoanSchema } from "./routes/loans";

describe("phone validation", () => {
  it("accepts a valid 10-digit Indian number", () => {
    expect(phoneSchema.safeParse("9876543210").success).toBe(true);
  });

  it("rejects numbers that are too short", () => {
    expect(phoneSchema.safeParse("12345").success).toBe(false);
  });

  it("rejects numbers not starting with 6-9", () => {
    expect(phoneSchema.safeParse("1234567890").success).toBe(false);
  });

  it("rejects letters", () => {
    expect(phoneSchema.safeParse("98765abcde").success).toBe(false);
  });
});

describe("loan validation", () => {
  const valid = { friendName: "Rahul", amountPaise: 50000, dueDate: "2026-10-30" };

  it("accepts a valid loan", () => {
    expect(createLoanSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an empty or blank friend name", () => {
    expect(createLoanSchema.safeParse({ ...valid, friendName: "   " }).success).toBe(false);
  });

  it("rejects zero and negative amounts", () => {
    expect(createLoanSchema.safeParse({ ...valid, amountPaise: 0 }).success).toBe(false);
    expect(createLoanSchema.safeParse({ ...valid, amountPaise: -500 }).success).toBe(false);
  });

  it("rejects fractional paise", () => {
    expect(createLoanSchema.safeParse({ ...valid, amountPaise: 100.5 }).success).toBe(false);
  });

  it("rejects an invalid date", () => {
    expect(createLoanSchema.safeParse({ ...valid, dueDate: "banana" }).success).toBe(false);
  });
});
