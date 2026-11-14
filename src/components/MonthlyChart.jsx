import { lastMonths, monthLabel } from "../utils/format.js";

export default function MonthlyChart({ transactions }) {
  const months = lastMonths(6);
  const data = months.map((key) => {
    let income = 0;
    let expense = 0;
    transactions.forEach((t) => {
      if (t.date.slice(0, 7) === key) {
        if (t.type === "income") income += t.amount;
        else expense += t.amount;
      }
    });
    return { key, income, expense };
  });

  const max = Math.max(1, ...data.map((d) => Math.max(d.income, d.expense)));
  const chartHeight = 120;
  const slot = 50;

  return (
    <div className="panel">
      <h2>Last 6 months</h2>
      <svg viewBox={`0 0 ${slot * 6} ${chartHeight + 22}`} className="bars">
        {data.map((d, i) => {
          const incomeH = (d.income / max) * chartHeight;
          const expenseH = (d.expense / max) * chartHeight;
          const x = i * slot;
          return (
            <g key={d.key}>
              <rect x={x + 8} y={chartHeight - incomeH} width="14" height={incomeH} fill="#10b981" rx="2">
                <title>Income: {d.income}</title>
              </rect>
              <rect x={x + 26} y={chartHeight - expenseH} width="14" height={expenseH} fill="#ef4444" rx="2">
                <title>Expenses: {d.expense}</title>
              </rect>
              <text x={x + slot / 2} y={chartHeight + 14} textAnchor="middle" fontSize="8" fill="#6b7280">
                {monthLabel(d.key).split(" ")[0]}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="hint"><span className="dot" style={{ background: "#10b981" }} /> Income <span className="dot" style={{ background: "#ef4444" }} /> Expenses</p>
    </div>
  );
}
