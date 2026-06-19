export default function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3">
      <h1 className="text-3xl font-semibold text-primary">Finance Finder</h1>
      <p className="text-muted">ZAR-first budget tracker — brand tokens active.</p>
      <div className="flex gap-4 text-sm">
        <span className="font-medium text-income">R 1 234,56 income</span>
        <span className="font-medium text-expense">R 890,00 expense</span>
      </div>
    </main>
  );
}
