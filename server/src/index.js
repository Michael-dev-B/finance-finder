import 'dotenv/config';
import express from 'express';

const app = express();
app.use(express.json());

// Health check — confirms the API is up. Resource routers are added in later tasks.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Finance Finder API listening on http://localhost:${port}`);
});

export default app;
