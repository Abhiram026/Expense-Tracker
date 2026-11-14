import { money } from "../utils/format.js";

const COLORS = ["#4f46e5", "#ef4444", "#f59e0b", "#10b981", "#06b6d4", "#ec4899", "#8b5cf6", "#84cc16", "#64748b"];

// Donut chart drawn with SVG circles. Radius 15.9155 makes the circumference exactly 100,
// so each slice's length is simply its percentage.
export default function CategoryChart({ totals }) {
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const sum = entries.reduce((s, [, v]) => s + v, 0);

  if (sum === 0) {
    return (
      <div className="panel">
        <h2>Spending by category</h2>
        <p className="empty">No expenses in this view.</p>
      </div>
    );
  }

  let used = 0;
  return (
    <div className="panel">
      <h2>Spending by category</h2>
      <div className="donut-wrap">
        <svg viewBox="0 0 42 42" className="donut">
          <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#e5e7eb" strokeWidth="6" />
          {entries.map(([name, value], i) => {
            const pct = (value / sum) * 100;
            const circle = (
              <circle
                key={name}
                cx="21"
                cy="21"
                r="15.9155"
                fill="none"
                stroke={COLORS[i % COLORS.length]}
                strokeWidth="6"
                strokeDasharray={`${pct} ${100 - pct}`}
                strokeDashoffset={25 - used}
              />
            );
            used += pct;
            return circle;
          })}
        </svg>
        <ul className="legend">
          {entries.map(([name, value], i) => (
            <li key={name}>
              <span className="dot" style={{ background: COLORS[i % COLORS.length] }} />
              {name} <em>{money(value)} ({Math.round((value / sum) * 100)}%)</em>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
