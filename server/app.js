import cors from 'cors';
import express from 'express';
import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';
import authRoutes from './routes/authRoutes.js';
import leaveRequestRoutes from './routes/leaveRequestRoutes.js';
import leaveTypeRoutes from './routes/leaveTypeRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'leave-management-system-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/leaves', leaveRequestRoutes);
app.use('/api/leave-types', leaveTypeRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
