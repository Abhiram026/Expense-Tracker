import { useState } from "react";
import { CATEGORIES, money } from "../utils/format.js";

export default function BudgetPanel({ budgets, setBudgets, spent, monthText }) {
  const [category, setCategory] = useState(CATEGORIES.expense[0]);
  const [limit, setLimit] = useState("");

  function addBudget(e) {
    e.preventDefault();
    const value = parseFloat(limit);
    if (!value || value <= 0) return;
    setBudgets((prev) => ({ ...prev, [category]: value }));
    setLimit("");
  }

  function removeBudget(name) {
    setBudgets((prev) => {
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  }

  const names = Object.keys(budgets);

  return (
    <div className="panel">
      <h2>Monthly budgets <small>({monthText})</small></h2>

      <form className="row budget-form" onSubmit={addBudget}>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.expense.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input type="number" min="0" placeholder="Limit ₹" value={limit} onChange={(e) => setLimit(e.target.value)} />
        <button type="submit" className="primary">Set</button>
      </form>

      {names.length === 0 && <p className="empty">No budgets set.</p>}

      {names.map((name) => {
        const used = spent[name] || 0;
        const pct = Math.min(100, (used / budgets[name]) * 100);
        const over = used > budgets[name];
        return (
          <div key={name} className="budget">
            <div className="budget-head">
              <span>{name}</span>
              <span className={over ? "over" : ""}>
                {money(used)} / {money(budgets[name])}
              </span>
              <button type="button" className="link" onClick={() => removeBudget(name)}>remove</button>
            </div>
            <div className="track">
              <div className={"fill " + (over ? "over" : pct > 80 ? "warn" : "")} style={{ width: pct + "%" }} />
            </div>
            {over && <small className="over">Over budget by {money(used - budgets[name])}</small>}
          </div>
        );
      })}
    </div>
  );
}
