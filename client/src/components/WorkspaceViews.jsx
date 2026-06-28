import MonthlySummary from './MonthlySummary.jsx';
import CategoryChart from './CategoryChart.jsx';
import UpcomingProjection from './UpcomingProjection.jsx';
import TransactionForm from './TransactionForm.jsx';
import TransactionList from './TransactionList.jsx';
import CategoryManager from './CategoryManager.jsx';
import TagManager from './TagManager.jsx';
import RecurringForm from './RecurringForm.jsx';
import RecurringList from './RecurringList.jsx';
import IncomeDashboard from './IncomeDashboard.jsx';
import TrendsChart from './TrendsChart.jsx';
import AnalyticsPanel from './AnalyticsPanel.jsx';
import BudgetManager from './BudgetManager.jsx';

// Each Act II view, extracted from App's old renderView() switch and made self-contained:
// its own centered container so it drops straight into a scroll section. Editing state for
// transactions/recurring lives in App (survives a lazy-section remount) and arrives as props.

function Container({ children }) {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-16 sm:px-6">{children}</div>
  );
}

function ViewHeading({ children }) {
  return <h2 className="text-lg font-semibold text-ink">{children}</h2>;
}

export function DashboardView() {
  return (
    <Container>
      <div className="grid gap-6 md:grid-cols-2">
        <MonthlySummary />
        <CategoryChart />
      </div>
      <UpcomingProjection />
    </Container>
  );
}

export function TransactionsView({ editing, onEdit, onDone }) {
  return (
    <Container>
      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
          {editing ? 'Edit transaction' : 'Add transaction'}
        </h2>
        <TransactionForm editing={editing} onDone={onDone} />
      </section>
      <div className="rounded-lg border border-border bg-surface p-5">
        <TransactionList onEdit={onEdit} />
      </div>
    </Container>
  );
}

export function IncomeView() {
  return (
    <Container>
      <ViewHeading>Income</ViewHeading>
      <IncomeDashboard />
    </Container>
  );
}

export function TrendsView() {
  return (
    <Container>
      <ViewHeading>Trends</ViewHeading>
      <TrendsChart />
    </Container>
  );
}

export function AnalyticsView() {
  return (
    <Container>
      <ViewHeading>Analytics</ViewHeading>
      <AnalyticsPanel />
    </Container>
  );
}

export function CategoriesView() {
  return (
    <Container>
      <ViewHeading>Categories</ViewHeading>
      <div className="rounded-lg border border-border bg-surface p-5">
        <CategoryManager />
      </div>
    </Container>
  );
}

export function TagsView() {
  return (
    <Container>
      <ViewHeading>Tags</ViewHeading>
      <div className="rounded-lg border border-border bg-surface p-5">
        <TagManager />
      </div>
    </Container>
  );
}

export function RecurringView({ editing, onEdit, onDone }) {
  return (
    <Container>
      <ViewHeading>Recurring</ViewHeading>
      <div className="space-y-6 rounded-lg border border-border bg-surface p-5">
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            {editing ? 'Edit recurring item' : 'Add recurring item'}
          </h3>
          <RecurringForm editing={editing} onDone={onDone} />
        </div>
        <div className="border-t border-border pt-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Recurring items
          </h3>
          <RecurringList onEdit={onEdit} />
        </div>
      </div>
    </Container>
  );
}

export function BudgetView() {
  return (
    <Container>
      <ViewHeading>Budget</ViewHeading>
      <div className="rounded-lg border border-border bg-surface p-5">
        <BudgetManager />
      </div>
    </Container>
  );
}
