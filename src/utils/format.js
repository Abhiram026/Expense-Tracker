export const CATEGORIES = {
  expense: ["Food", "Rent", "Travel", "Shopping", "Bills", "Health", "Education", "Entertainment", "Other"],
  income: ["Salary", "Freelance", "Gift", "Interest", "Other"],
};

export function money(n) {
  return "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function todayString() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export function currentMonthKey() {
  return todayString().slice(0, 7);
}

export function monthLabel(key) {
  const [year, month] = key.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

// returns the last `count` month keys, oldest first, e.g. ["2026-06", ..., "2026-11"]
export function lastMonths(count) {
  const keys = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

export function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function exportCsv(rows) {
  const header = ["Date", "Type", "Category", "Amount", "Note"];
  const lines = rows.map((t) =>
    [t.date, t.type, t.category, t.amount, `"${(t.note || "").replace(/"/g, '""')}"`].join(",")
  );
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "expenses.csv";
  link.click();
  URL.revokeObjectURL(url);
}
