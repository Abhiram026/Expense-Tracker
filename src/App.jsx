import { useMemo, useState } from "react";
import { useLocalStorage } from "./utils/storage.js";
import { currentMonthKey, exportCsv, monthLabel } from "./utils/format.js";
import Summary from "./components/Summary.jsx";
import TransactionForm from "./components/TransactionForm.jsx";
import TransactionList from "./components/TransactionList.jsx";
import Filters from "./components/Filters.jsx";
import CategoryChart from "./components/CategoryChart.jsx";
import MonthlyChart from "./components/MonthlyChart.jsx";
import BudgetPanel from "./components/BudgetPanel.jsx";

export default function App() {
  const [transactions, setTransactions] = useLocalStorage("et_transactions", []);
  const [budgets, setBudgets] = useLocalStorage("et_budgets", {});
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({ month: currentMonthKey(), type: "all", search: "" });

  function saveTransaction(t) {
    setTransactions((prev) => {
      const exists = prev.some((x) => x.id === t.id);
      return exists ? prev.map((x) => (x.id === t.id ? t : x)) : [t, ...prev];
    });
    setEditing(null);
  }

  function deleteTransaction(id) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    if (editing && editing.id === id) setEditing(null);
  }

  // months that actually have data, plus the current one
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
      .filter((t) => !term || t.category.toLowerCase().includes(term) || t.note.toLowerCase().includes(term))
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

  // budgets are always compared against one month: the selected one, or the current month if "all" is chosen
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

  return (
    <div className="app">
      <header>
        <h1>Expense Tracker</h1>
        <p>Record, categorize and monitor your income and expenses.</p>
      </header>

      <Summary income={income} expense={expense} />

      <div className="layout">
        <aside>
          <TransactionForm editing={editing} onSave={saveTransaction} onCancel={() => setEditing(null)} />
          <BudgetPanel budgets={budgets} setBudgets={setBudgets} spent={budgetSpent} monthText={monthLabel(budgetMonth)} />
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
