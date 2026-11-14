import { monthLabel } from "../utils/format.js";

export default function Filters({ months, filters, setFilters, onExport }) {
  function update(field, value) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="filters">
      <select value={filters.month} onChange={(e) => update("month", e.target.value)}>
        <option value="all">All months</option>
        {months.map((m) => (
          <option key={m} value={m}>{monthLabel(m)}</option>
        ))}
      </select>

      <select value={filters.type} onChange={(e) => update("type", e.target.value)}>
        <option value="all">Income + Expense</option>
        <option value="expense">Expenses only</option>
        <option value="income">Income only</option>
      </select>

      <input
        type="text"
        placeholder="Search category or note"
        value={filters.search}
        onChange={(e) => update("search", e.target.value)}
      />

      <button type="button" onClick={onExport}>Export CSV</button>
    </div>
  );
}
