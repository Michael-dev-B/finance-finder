// Demo seed — fills the database with ~12 months of realistic ZAR data so the whole app
// (dashboard, transactions, income, trends, analytics, categories, tags, recurring, budget)
// has something rich to show. Run with:  npm --prefix server run seed
//
// It is DESTRUCTIVE and idempotent: it wipes every table first, then re-seeds. Dates are
// generated relative to *today*, so "This Month" and the trend window are always current no
// matter when you run it. Money is integer cents end-to-end (CLAUDE.md non-negotiable).
//
// Importing ./index.js opens the DB and applies any pending migrations before we touch it.
import db from './index.js';

// ── deterministic RNG (mulberry32) so reseeds are stable ─────────────────────────────────
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(0x20260628);
const rand = (min, max) => min + (max - min) * rng();
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (arr) => arr[Math.floor(rng() * arr.length)];

// ── date helpers (everything relative to now) ────────────────────────────────────────────
const NOW = new Date();
const MONTHS_BACK = 12; // current month + 11 prior

function monthKey(offset) {
  // offset 0 = current month, 1 = last month, …
  const d = new Date(NOW.getFullYear(), NOW.getMonth() - offset, 1);
  return { year: d.getFullYear(), m0: d.getMonth() };
}
// Cap days at 28 to stay valid in every month (incl. February).
function maxDay() {
  return 28;
}
function ymd(year, m0, day) {
  return `${year}-${String(m0 + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Split a monthly total into `n` realistic line items (rounded to whole Rand, exact sum).
function splitAmount(total, n) {
  if (n <= 1) return [total];
  const weights = Array.from({ length: n }, () => rand(0.6, 1.4));
  const sum = weights.reduce((a, b) => a + b, 0);
  const parts = weights.map((w) => Math.max(1000, Math.round((total * w) / sum / 100) * 100));
  parts[n - 1] += total - parts.reduce((a, b) => a + b, 0); // last item absorbs rounding drift
  if (parts[n - 1] < 1000) parts[n - 1] = 1000;
  return parts;
}

// ── reference data ───────────────────────────────────────────────────────────────────────
const GROUPS = ['Essentials', 'Lifestyle', 'Financial'];

// `cur` = engineered current-month total (cents) to produce a spread of budget states;
// `base`/`variance` drive the natural month-to-month spend for the prior 11 months.
const EXPENSE_CATS = [
  // groceries `cur` is 507000 here; the +125000 split parent below brings the month to 632000 (≈105% of budget → over)
  { key: 'groceries',     name: 'Groceries',     colour: '#22c55e', group: 'Essentials', budget: 600000,  cur: 507000,  base: 560000, variance: 60000, txns: 5, merchants: ['Woolworths', 'Checkers', 'Pick n Pay', 'SPAR', "Food Lover's Market"] },
  { key: 'rent',          name: 'Rent',          colour: '#6366f1', group: 'Essentials', budget: 1250000, cur: 1200000, base: 1200000, variance: 0, txns: 1, merchants: ['Monthly rent'] },
  { key: 'utilities',     name: 'Utilities',     colour: '#0ea5e9', group: 'Essentials', budget: 220000,  cur: 140000,  base: 195000, variance: 25000, txns: 2, merchants: ['Eskom prepaid', 'City of Joburg', 'Water & rates'] },
  { key: 'transport',     name: 'Transport',     colour: '#f59e0b', group: 'Essentials', budget: 300000,  cur: 178000,  base: 210000, variance: 50000, txns: 4, merchants: ['Engen', 'Shell', 'Sasol', 'Uber', 'Bolt'] },
  { key: 'eatingout',     name: 'Eating Out',    colour: '#ef4444', group: 'Lifestyle',  budget: 250000,  cur: 221000,  base: 190000, variance: 60000, txns: 5, merchants: ["Nando's", 'Kauai', 'Uber Eats', 'Mr D Food', 'Tashas', 'Ocean Basket'] },
  { key: 'entertainment', name: 'Entertainment', colour: '#a855f7', group: 'Lifestyle',  budget: 150000,  cur: 94000,   base: 110000, variance: 40000, txns: 2, merchants: ['Ster-Kinekor', 'Steam', 'PlayStation Store', 'Computicket'] },
  { key: 'shopping',      name: 'Shopping',      colour: '#ec4899', group: 'Lifestyle',  budget: 200000,  cur: 268000,  base: 160000, variance: 90000, txns: 3, merchants: ['Takealot', 'Mr Price', 'Zara', 'Cotton On', 'Superbalist'] },
  { key: 'health',        name: 'Health',        colour: '#14b8a6', group: 'Essentials', budget: 120000,  cur: 58000,   base: 80000,  variance: 40000, txns: 2, merchants: ['Dis-Chem', 'Clicks', 'Netcare', 'Dr visit'] },
  { key: 'subscriptions', name: 'Subscriptions', colour: '#8b5cf6', group: 'Lifestyle',  budget: 80000,   cur: 75800,   base: 75800,  variance: 0, txns: 3, merchants: ['Netflix', 'Spotify', 'Vodacom'] },
  { key: 'household',     name: 'Household',     colour: '#f97316', group: 'Essentials', budget: 100000,  cur: 62000,   base: 85000,  variance: 30000, txns: 2, merchants: ['Builders Warehouse', '@home', 'Game', 'Sheet Street'] },
  { key: 'savings',       name: 'Savings',       colour: '#3b82f6', group: 'Financial',  budget: null,    cur: 300000,  base: 300000, variance: 0, txns: 1, merchants: ['Transfer to savings'] },
];

const INCOME_CATS = [
  { key: 'salary',    name: 'Salary',    colour: '#10b981', group: 'Financial' },
  { key: 'freelance', name: 'Freelance', colour: '#84cc16', group: 'Financial' },
];

const TAGS = [
  { key: 'work',      name: 'Work',          colour: '#0ea5e9' },
  { key: 'subs',      name: 'Subscriptions', colour: '#8b5cf6' },
  { key: 'eatingout', name: 'Eating out',    colour: '#ef4444' },
  { key: 'health',    name: 'Health',        colour: '#14b8a6' },
  { key: 'holiday',   name: 'Holiday',       colour: '#f59e0b' },
];

// ── run it all in one transaction ────────────────────────────────────────────────────────
const seed = db.transaction(() => {
  // wipe (FK-safe order) and reset autoincrement counters
  for (const t of ['transaction_tags', 'transactions', 'recurring_items', 'tags', 'categories', 'category_groups']) {
    db.prepare(`DELETE FROM ${t}`).run();
  }
  db.prepare('DELETE FROM sqlite_sequence').run();

  // groups
  const insGroup = db.prepare('INSERT INTO category_groups (name) VALUES (?)');
  const groupId = {};
  for (const g of GROUPS) groupId[g] = insGroup.run(g).lastInsertRowid;

  // categories
  const insCat = db.prepare(
    'INSERT INTO categories (name, colour, monthly_budget_cents, group_id) VALUES (?, ?, ?, ?)',
  );
  const catId = {};
  for (const c of [...EXPENSE_CATS, ...INCOME_CATS]) {
    catId[c.key] = insCat.run(c.name, c.colour, c.budget ?? null, groupId[c.group]).lastInsertRowid;
  }

  // tags
  const insTag = db.prepare('INSERT INTO tags (name, colour) VALUES (?, ?)');
  const tagId = {};
  for (const t of TAGS) tagId[t.key] = insTag.run(t.name, t.colour).lastInsertRowid;

  // transactions
  const insTxn = db.prepare(
    `INSERT INTO transactions (amount_cents, type, category_id, occurred_on, note, split_of, is_reviewed)
     VALUES (@amount_cents, @type, @category_id, @occurred_on, @note, @split_of, @is_reviewed)`,
  );
  const linkTag = db.prepare(
    'INSERT OR IGNORE INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)',
  );

  function addTxn({ amount, type, catKey, year, m0, day, note, reviewed = 1, splitOf = null, tags = [] }) {
    const id = insTxn.run({
      amount_cents: amount,
      type,
      category_id: catKey ? catId[catKey] : null,
      occurred_on: ymd(year, m0, day),
      note,
      split_of: splitOf,
      is_reviewed: reviewed,
    }).lastInsertRowid;
    for (const tk of tags) linkTag.run(id, tagId[tk]);
    return id;
  }

  let txnCount = 0;
  for (let offset = 0; offset < MONTHS_BACK; offset++) {
    const { year, m0 } = monthKey(offset);
    const md = maxDay();

    // income — salary every month (a raise kicked in 6 months ago), freelance some months
    addTxn({
      amount: offset >= 6 ? 3600000 : 3800000,
      type: 'income', catKey: 'salary', year, m0, day: 25, note: 'Salary', reviewed: 1,
    });
    txnCount++;
    if ([0, 2, 5, 8, 11].includes(offset)) {
      addTxn({
        amount: 250000 + randInt(0, 350) * 1000,
        type: 'income', catKey: 'freelance', year, m0, day: randInt(8, 20),
        note: pick(['Design project', 'Consulting', 'Logo commission', 'Website build']),
        reviewed: 1, tags: ['work'],
      });
      txnCount++;
    }

    // expenses — engineered total for the current month, natural variation for prior months
    for (const c of EXPENSE_CATS) {
      const target = offset === 0
        ? c.cur
        : Math.max(20000, Math.round((c.base + (rng() * 2 - 1) * c.variance) / 100) * 100);
      const parts = splitAmount(target, c.txns);
      for (const amount of parts) {
        const tags = [];
        if (c.key === 'eatingout') tags.push('eatingout');
        if (c.key === 'subscriptions') tags.push('subs');
        if (c.key === 'health') tags.push('health');
        addTxn({
          amount, type: 'expense', catKey: c.key, year, m0, day: randInt(1, md),
          note: pick(c.merchants),
          // a few of THIS month's items are still unreviewed, to show the review state
          reviewed: offset === 0 && rng() < 0.3 ? 0 : 1,
          tags,
        });
        txnCount++;
      }
    }
  }

  // a split transaction in the current month: one Woolworths shop split across two categories.
  // The parent keeps the full amount (analytics counts split_of IS NULL); the children are the
  // display breakdown and are marked reviewed, mirroring the /split route.
  const cur = monthKey(0);
  const splitDay = 15;
  const parentId = addTxn({
    amount: 125000, type: 'expense', catKey: 'groceries', year: cur.year, m0: cur.m0,
    day: splitDay, note: 'Woolworths (split)', reviewed: 1, tags: ['holiday'],
  });
  txnCount++;
  const insChild = db.prepare(
    `INSERT INTO transactions (amount_cents, type, category_id, occurred_on, note, split_of, is_reviewed)
     VALUES (?, 'expense', ?, ?, ?, ?, 1)`,
  );
  insChild.run(90000, catId.groceries, ymd(cur.year, cur.m0, splitDay), 'Food', parentId);
  insChild.run(35000, catId.household, ymd(cur.year, cur.m0, splitDay), 'Homeware', parentId);

  // recurring items — monthly / biweekly / annual, one inactive (cancelled) for variety
  const start = ymd(monthKey(11).year, monthKey(11).m0, 1);
  const cancelledEnd = ymd(monthKey(3).year, monthKey(3).m0, 1);
  const insRec = db.prepare(
    `INSERT INTO recurring_items
       (name, amount_cents, type, category_id, frequency, day_of_month, day_of_week, start_date, end_date, active, note)
     VALUES (@name, @amount_cents, @type, @category_id, @frequency, @day_of_month, @day_of_week, @start_date, @end_date, @active, @note)`,
  );
  const RECURRING = [
    { name: 'Salary',           amount: 3800000, type: 'income',  cat: 'salary',        freq: 'monthly',  dom: 25,  dow: null, active: 1, end: null,         note: 'Monthly salary' },
    { name: 'Rent',             amount: 1200000, type: 'expense', cat: 'rent',          freq: 'monthly',  dom: 1,   dow: null, active: 1, end: null,         note: null },
    { name: 'Medical Aid',      amount: 280000,  type: 'expense', cat: 'health',        freq: 'monthly',  dom: 1,   dow: null, active: 1, end: null,         note: 'Discovery Health' },
    { name: 'Car Insurance',    amount: 89000,   type: 'expense', cat: 'transport',     freq: 'monthly',  dom: 7,   dow: null, active: 1, end: null,         note: null },
    { name: 'Cellphone',        amount: 49900,   type: 'expense', cat: 'subscriptions', freq: 'monthly',  dom: 2,   dow: null, active: 1, end: null,         note: 'Vodacom contract' },
    { name: 'Netflix',          amount: 19900,   type: 'expense', cat: 'subscriptions', freq: 'monthly',  dom: 5,   dow: null, active: 1, end: null,         note: null },
    { name: 'Spotify',          amount: 5999,    type: 'expense', cat: 'subscriptions', freq: 'monthly',  dom: 5,   dow: null, active: 1, end: null,         note: null },
    { name: 'Gym',              amount: 45000,   type: 'expense', cat: 'health',        freq: 'monthly',  dom: 3,   dow: null, active: 1, end: null,         note: 'Virgin Active' },
    { name: 'Cleaner',          amount: 60000,   type: 'expense', cat: 'household',     freq: 'biweekly', dom: null, dow: 4,   active: 1, end: null,         note: 'Every second Friday' },
    { name: 'TV License',       amount: 26500,   type: 'expense', cat: 'household',     freq: 'annual',   dom: 15,  dow: null, active: 1, end: null,         note: null },
    { name: 'DStv (cancelled)', amount: 92900,   type: 'expense', cat: 'subscriptions', freq: 'monthly',  dom: 1,   dow: null, active: 0, end: cancelledEnd, note: 'Cancelled' },
  ];
  for (const r of RECURRING) {
    insRec.run({
      name: r.name, amount_cents: r.amount, type: r.type, category_id: catId[r.cat],
      frequency: r.freq, day_of_month: r.dom, day_of_week: r.dow,
      start_date: start, end_date: r.end, active: r.active, note: r.note,
    });
  }

  return {
    groups: GROUPS.length,
    categories: EXPENSE_CATS.length + INCOME_CATS.length,
    tags: TAGS.length,
    transactions: txnCount + 2, // + the 2 split children
    recurring: RECURRING.length,
  };
});

const counts = seed();
console.log('Seed complete:', counts);
console.log(
  `Range: ${ymd(monthKey(11).year, monthKey(11).m0, 1)} … ${ymd(monthKey(0).year, monthKey(0).m0, 28)} (relative to today).`,
);
