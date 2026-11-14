import { useEffect, useMemo, useState } from "react";
import { api } from "./utils/api.js";
import { currentMonthKey, exportCsv, monthLabel } from "./utils/format.js";
import Summary from "./components/Summary.jsx";
import TransactionForm from "./components/TransactionForm.jsx";
import TransactionList from "./components/TransactionList.jsx";
import Filters from "./components/Filters.jsx";
import CategoryChart from "./components/CategoryChart.jsx";
import MonthlyChart from "./components/MonthlyChart.jsx";
import BudgetPanel from "./components/BudgetPanel.jsx";

// the server sends _id, the components use id
const fix = (t) => ({ ...t, id: t._id });

export default function Tracker({ user, onLogout }) {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({ month: currentMonthKey(), type: "all", search: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [tx, bd] = await Promise.all([api("/api/transactions"), api("/api/budgets")]);
        setTransactions(tx.map(fix));
        setBudgets(bd);
      } catch (err) {
        if (err.status === 401) onLogout();
        else setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function saveTransaction(t) {
    setError("");
    const body = { type: t.type, amount: t.amount, category: t.category, date: t.date, note: t.note };
    try {
      if (editing) {
        const updated = await api("/api/transactions/" + editing.id, { method: "PUT", body });
        setTransactions((prev) => prev.map((x) => (x.id === editing.id ? fix(updated) : x)));
      } else {
        const created = await api("/api/transactions", { method: "POST", body });
        setTransactions((prev) => [fix(created), ...prev]);
      }
      setEditing(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteTransaction(id) {
    setError("");
    try {
      await api("/api/transactions/" + id, { method: "DELETE" });
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      if (editing && editing.id === id) setEditing(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function setBudget(category, limit) {
    setError("");
    try {
      await api("/api/budgets/" + encodeURIComponent(category), { method: "PUT", body: { limit } });
      setBudgets((prev) => ({ ...prev, [category]: limit }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeBudget(category) {
    setError("");
    try {
      await api("/api/budgets/" + encodeURIComponent(category), { method: "DELETE" });
      setBudgets((prev) => {
        const copy = { ...prev };
        delete copy[category];
        return copy;
      });
    } catch (err) {
      setError(err.message);
    }
  }

  const months = useMemo(() => {
    const set = new Set(transactions.map((t) => t.date.slice(0, 7)));
    set.add(currentMonthKey());
    return [...set].sort().reverse();
  }, [transactions]);

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return transactions
      .filter((t) => filters.month === "all" || t.date.slice(0, 7) === filters.month)
      .filter((t) => filters.type === "all" || t.type === filters.type)
      .filter((t) => !term || t.category.toLowerCase().includes(term) || (t.note || "").toLowerCase().includes(term))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [transactions, filters]);

  const income = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const categoryTotals = useMemo(() => {
    const totals = {};
    filtered.forEach((t) => {
      if (t.type === "expense") totals[t.category] = (totals[t.category] || 0) + t.amount;
    });
    return totals;
  }, [filtered]);

  const budgetMonth = filters.month === "all" ? currentMonthKey() : filters.month;
  const budgetSpent = useMemo(() => {
    const totals = {};
    transactions.forEach((t) => {
      if (t.type === "expense" && t.date.slice(0, 7) === budgetMonth) {
        totals[t.category] = (totals[t.category] || 0) + t.amount;
      }
    });
    return totals;
  }, [transactions, budgetMonth]);

  if (loading) {
    return (
      <div className="app">
        <p className="empty">Loading your data... the free server can take up to a minute to wake up.</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="top">
        <div>
          <h1>Expense Tracker</h1>
          <p>Hi, {user.name}</p>
        </div>
        <button type="button" onClick={onLogout}>Log out</button>
      </header>

      {error && <p className="error banner">{error}</p>}

      <Summary income={income} expense={expense} />

      <div className="layout">
        <aside>
          <TransactionForm editing={editing} onSave={saveTransaction} onCancel={() => setEditing(null)} />
          <BudgetPanel budgets={budgets} onSet={setBudget} onRemove={removeBudget} spent={budgetSpent} monthText={monthLabel(budgetMonth)} />
        </aside>

        <main>
          <div className="charts">
            <CategoryChart totals={categoryTotals} />
            <MonthlyChart transactions={transactions} />
          </div>

          <div className="panel">
            <h2>Transactions</h2>
            <Filters months={months} filters={filters} setFilters={setFilters} onExport={() => exportCsv(filtered)} />
            <TransactionList items={filtered} onEdit={setEditing} onDelete={deleteTransaction} />
          </div>
        </main>
      </div>
    </div>
  );
}