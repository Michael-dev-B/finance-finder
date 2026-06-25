import express from 'express';
import cors from 'cors';
import './db/index.js';
import categoriesRouter from './routes/categories.js';
import transactionsRouter from './routes/transactions.js';
import tagsRouter from './routes/tags.js';
import categoryGroupsRouter from './routes/categoryGroups.js';
import recurringRouter  from './routes/recurring.js';
import incomeRouter     from './routes/income.js';
import analyticsRouter  from './routes/analytics.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/categories', categoriesRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/category-groups', categoryGroupsRouter);
app.use('/api/recurring',  recurringRouter);
app.use('/api/income',    incomeRouter);
app.use('/api/analytics', analyticsRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Finance Finder API listening on http://localhost:${port}`);
});

export default app;
