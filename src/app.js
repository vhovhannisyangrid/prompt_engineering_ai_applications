import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import chatRoutes from './controllers/chatController.js';
import dataRoutes from './controllers/dataController.js';
import pagesRoutes from './controllers/pagesController.js';

import { errorHandler } from './middleware/errorHandler.js';
import { guardrailsMiddleware } from './middleware/guardrails.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(express.static(path.join(__dirname, '../public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(guardrailsMiddleware);

app.use('/', pagesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api', dataRoutes);

app.use(errorHandler);

app.use('*', (req, res) => {
  res.status(404).render('404', { 
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.'
  });
});

app.listen(PORT, () => {
  console.log(`AI Data Assistant running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
