CREATE TABLE recurring_items (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  amount_cents  INTEGER NOT NULL CHECK (amount_cents > 0),
  type          TEXT    NOT NULL CHECK (type IN ('income', 'expense')),
  category_id   INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  frequency     TEXT    NOT NULL CHECK (frequency IN ('weekly','biweekly','monthly','quarterly','annual')),
  day_of_month  INTEGER CHECK (day_of_month IS NULL OR (day_of_month >= 1 AND day_of_month <= 31)),
  day_of_week   INTEGER CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)),
  start_date    TEXT    NOT NULL,
  end_date      TEXT,
  active        INTEGER NOT NULL DEFAULT 1,
  note          TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
