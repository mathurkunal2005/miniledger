// 50000 paise -> "₹500", 123456 -> "₹1,234.56"
export function formatRupees(paise: number): string {
  return "₹" + (paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

// "2026-10-30T00:00:00.000Z" -> "30 Oct 2026"
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
