import { describe, it, expect } from "vitest";
import { calculateSummary } from "./summary";

// Pretend "today" is Oct 20, 2026, so results never change with the real date
const now = new Date("2026-10-20T00:00:00Z");

describe("calculateSummary", () => {
  it("returns all zeros when there are no loans", () => {
    expect(calculateSummary([], now)).toEqual({
      totalLentPaise: 0,
      totalRepaidPaise: 0,
      overduePaise: 0,
      outstandingPaise: 0,
    });
  });

  it("adds up lent, repaid, overdue and outstanding", () => {
    const loans = [
      { amountPaise: 50000, dueDate: new Date("2026-10-30"), repaidAt: null }, // not due yet
      { amountPaise: 120000, dueDate: new Date("2026-10-15"), repaidAt: new Date("2026-10-16") }, // repaid
      { amountPaise: 30000, dueDate: new Date("2026-10-10"), repaidAt: null }, // overdue
    ];

    expect(calculateSummary(loans, now)).toEqual({
      totalLentPaise: 200000,
      totalRepaidPaise: 120000,
      overduePaise: 30000,
      outstandingPaise: 80000,
    });
  });

  it("does not count a repaid loan as overdue, even if it was past due", () => {
    const loans = [
      { amountPaise: 10000, dueDate: new Date("2026-10-01"), repaidAt: new Date("2026-10-18") },
    ];
    expect(calculateSummary(loans, now).overduePaise).toBe(0);
  });
});
