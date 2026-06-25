const NAV = [
  { id: 'dashboard',    label: 'Dashboard' },
  { id: 'transactions', label: 'Transactions' },
  { type: 'group', label: 'Analysis' },
  { id: 'income',       label: 'Income' },
  { id: 'trends',       label: 'Trends' },
  { id: 'analytics',    label: 'Analytics' },
  { type: 'group', label: 'Manage' },
  { id: 'categories',   label: 'Categories' },
  { id: 'tags',         label: 'Tags' },
  { id: 'recurring',    label: 'Recurring' },
  { type: 'sep' },
  { id: 'budget',       label: 'Budget' },
];

export default function Sidebar({ activeView, onNavigate }) {
  return (
    <nav className="flex w-48 shrink-0 flex-col border-r border-border bg-bg py-3">
      <div className="px-2">
        {NAV.map((item, i) => {
          if (item.type === 'sep') {
            return <div key={i} className="my-2 h-px bg-border" />;
          }
          if (item.type === 'group') {
            return (
              <p
                key={i}
                className="mb-0.5 mt-3 px-2 text-xs font-medium uppercase tracking-wide text-muted"
              >
                {item.label}
              </p>
            );
          }
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full rounded px-2 py-1.5 text-left text-sm transition-colors duration-150 ${
                active ? 'bg-accent font-semibold text-ink' : 'font-medium text-muted hover:text-ink'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
