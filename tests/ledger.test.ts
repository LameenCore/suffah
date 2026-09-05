import { describe, it, expect } from "vitest";
import { summariseLedgerEntries, type LedgerEntry } from "@/lib/db/ledger-queries";

const e = (
  entryType: LedgerEntry["entryType"],
  amount: number,
  createdAt = "2026-01-01",
): LedgerEntry => ({ entryType, amount, createdAt, note: null });

describe("summariseLedgerEntries", () => {
  const entries: LedgerEntry[] = [
    e("principal_deposit", 250_000, "2025-01-01"),
    e("return_disbursed", -3_000, "2025-04-01"),
    e("return_disbursed", -3_200, "2025-07-01"),
    e("sadaqah_received", 5_000, "2025-05-01"),
    e("scholarship_allocated", -1_200, "2025-09-01"),
  ];
  const s = summariseLedgerEntries(entries);

  it("keeps the principal on its own line", () => {
    expect(s.principal).toBe(250_000);
  });

  it("NEVER folds the principal into totalOut", () => {
    // totalOut is only operating draws + scholarships
    expect(s.totalOut).toBe(3_000 + 3_200 + 1_200);
    expect(s.totalOut).toBeLessThan(s.principal);
  });

  it("sums returns and scholarships as positive magnitudes", () => {
    expect(s.returnsDisbursed).toBe(6_200);
    expect(s.scholarshipsAllocated).toBe(1_200);
  });

  it("sadaqah is tracked separately from returns and from principal", () => {
    expect(s.sadaqahReceived).toBe(5_000);
  });

  it("spendSeries is cumulative and monotonic, and excludes principal + sadaqah", () => {
    expect(s.spendSeries.map((p) => p.cumulativeOut)).toEqual([3_000, 6_200, 7_400]);
    for (let i = 1; i < s.spendSeries.length; i++) {
      expect(s.spendSeries[i].cumulativeOut).toBeGreaterThanOrEqual(
        s.spendSeries[i - 1].cumulativeOut,
      );
    }
  });

  it("an all-principal ledger has zero spend", () => {
    const only = summariseLedgerEntries([e("principal_deposit", 100_000)]);
    expect(only.totalOut).toBe(0);
    expect(only.spendSeries).toHaveLength(0);
  });

  it("an empty ledger is all zeros, not NaN", () => {
    const z = summariseLedgerEntries([]);
    expect(z).toMatchObject({
      principal: 0,
      returnsDisbursed: 0,
      sadaqahReceived: 0,
      scholarshipsAllocated: 0,
      totalOut: 0,
    });
  });
});
