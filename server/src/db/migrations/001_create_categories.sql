CREATE TABLE categories (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  name                 TEXT    NOT NULL,
  colour               TEXT    NOT NULL,
  monthly_budget_cents INTEGER CHECK (monthly_budget_cents IS NULL OR monthly_budget_cents > 0),
  created_at           TEXT    NOT NULL DEFAULT (datetime('now'))
);
