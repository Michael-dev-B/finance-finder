CREATE TABLE transactions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  type         TEXT    NOT NULL CHECK (type IN ('income', 'expense')),
  category_id  INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  occurred_on  TEXT    NOT NULL,
  note         TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);
