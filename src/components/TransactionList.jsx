import { money } from "../utils/format.js";

export default function TransactionList({ items, onEdit, onDelete }) {
  if (items.length === 0) {
    return <p className="empty">No transactions to show yet.</p>;
  }

  return (
    <ul className="list">
      {items.map((t) => (
        <li key={t.id}>
          <div className="info">
            <strong>{t.category}</strong>
            <small>{t.date}{t.note ? " · " + t.note : ""}</small>
          </div>
          <span className={"amount " + t.type}>
            {t.type === "income" ? "+" : "-"}{money(t.amount)}
          </span>
          <div className="actions">
            <button type="button" onClick={() => onEdit(t)}>Edit</button>
            <button
              type="button"
              className="danger"
              onClick={() => {
                if (window.confirm("Delete this transaction?")) onDelete(t.id);
              }}
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
