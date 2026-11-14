import { useEffect, useState } from "react";
import { CATEGORIES, makeId, todayString } from "../utils/format.js";

const emptyForm = () => ({
  type: "expense",
  amount: "",
  category: CATEGORIES.expense[0],
  date: todayString(),
  note: "",
});

export default function TransactionForm({ editing, onSave, onCancel }) {
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState("");

  useEffect(() => {
    if (editing) {
      setForm({ ...editing, amount: String(editing.amount) });
    } else {
      setForm(emptyForm());
    }
    setError("");
  }, [editing]);

  function change(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function changeType(type) {
    setForm((prev) => ({ ...prev, type, category: CATEGORIES[type][0] }));
  }

  function submit(e) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      setError("Enter an amount greater than 0");
      return;
    }
    if (!form.date) {
      setError("Pick a date");
      return;
    }
    onSave({
      id: editing ? editing.id : makeId(),
      type: form.type,
      amount,
      category: form.category,
      date: form.date,
      note: form.note.trim(),
    });
    if (!editing) setForm(emptyForm());
    setError("");
  }

  return (
    <form className="panel form" onSubmit={submit}>
      <h2>{editing ? "Edit transaction" : "Add transaction"}</h2>

      <div className="toggle">
        <button type="button" className={form.type === "expense" ? "active" : ""} onClick={() => changeType("expense")}>
          Expense
        </button>
        <button type="button" className={form.type === "income" ? "active" : ""} onClick={() => changeType("income")}>
          Income
        </button>
      </div>

      <label>
        Amount (₹)
        <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => change("amount", e.target.value)} placeholder="0.00" />
      </label>

      <label>
        Category
        <select value={form.category} onChange={(e) => change("category", e.target.value)}>
          {CATEGORIES[form.type].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>

      <label>
        Date
        <input type="date" value={form.date} onChange={(e) => change("date", e.target.value)} />
      </label>

      <label>
        Note
        <input type="text" value={form.note} onChange={(e) => change("note", e.target.value)} placeholder="Optional" />
      </label>

      {error && <p className="error">{error}</p>}

      <div className="row">
        <button type="submit" className="primary">{editing ? "Update" : "Add"}</button>
        {editing && (
          <button type="button" onClick={onCancel}>Cancel</button>
        )}
      </div>
    </form>
  );
}
