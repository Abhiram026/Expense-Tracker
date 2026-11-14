import { money } from "../utils/format.js";

export default function Summary({ income, expense }) {
  const balance = income - expense;
  return (
    <div className="summary">
      <div className="card income">
        <div className="icon">💰</div>
        <span>Income</span>
        <strong>{money(income)}</strong>
      </div>
      <div className="card expense">
        <div className="icon">🛍️</div>
        <span>Expenses</span>
        <strong>{money(expense)}</strong>
      </div>
      <div className={"card " + (balance >= 0 ? "balance" : "negative")}>
        <div className="icon">🏦</div>
        <span>Balance</span>
        <strong>{money(balance)}</strong>
      </div>
    </div>
  );
}
