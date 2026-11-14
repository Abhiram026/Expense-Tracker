import { money } from "../utils/format.js";

export default function Summary({ income, expense }) {
  const balance = income - expense;
  return (
    <div className="summary">
      <div className="card income">
        <span>Income</span>
        <strong>{money(income)}</strong>
      </div>
      <div className="card expense">
        <span>Expenses</span>
        <strong>{money(expense)}</strong>
      </div>
      <div className={"card " + (balance >= 0 ? "balance" : "negative")}>
        <span>Balance</span>
        <strong>{money(balance)}</strong>
      </div>
    </div>
  );
}
