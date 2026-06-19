export function selectMonthlyTotals(state) {
  let incomeCents = 0;
  let expenseCents = 0;
  for (const t of state.transactions) {
    if (t.type === 'income') incomeCents += t.amount_cents;
    else expenseCents += t.amount_cents;
  }
  return { incomeCents, expenseCents, netCents: incomeCents - expenseCents };
}

export function selectCategorySpend(state) {
  const spend = new Map();
  for (const t of state.transactions) {
    if (t.type !== 'expense' || t.category_id == null) continue;
    spend.set(t.category_id, (spend.get(t.category_id) ?? 0) + t.amount_cents);
  }
  return spend;
}

export function selectBudgetRemaining(state) {
  const spend = selectCategorySpend(state);
  return state.categories
    .filter((c) => c.monthly_budget_cents != null)
    .map((c) => ({
      category: c,
      spentCents: spend.get(c.id) ?? 0,
      remainingCents: c.monthly_budget_cents - (spend.get(c.id) ?? 0),
    }));
}
