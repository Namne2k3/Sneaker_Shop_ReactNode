import express from 'express';
import sizeRoutes from './routes/sizeRoutes.js';
import colorRoutes from './routes/colorRoutes.js';

// ...existing code...

const app = express();

// ...existing code...

// Routes
app.use('/api/sizes', sizeRoutes);
app.use('/api/colors', colorRoutes);

// ...existing code...

export default app;