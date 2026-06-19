import express from 'express';
import cors from 'cors';
import './db/index.js';
import categoriesRouter from './routes/categories.js';
import transactionsRouter from './routes/transactions.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/categories', categoriesRouter);
app.use('/api/transactions', transactionsRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Finance Finder API listening on http://localhost:${port}`);
});

export default app;
