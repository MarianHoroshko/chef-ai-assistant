import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger';
import sessionRouter from './api/session';
import formRouter from './api/form';
import agentRouter from './api/agent';
import dotenv from 'dotenv';
import cors from 'cors';
import { errorHandler } from './middlewares/errors';

dotenv.config();

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Required if you are sending cookies/sessions
    optionsSuccessStatus: 200,
  }),
);

const apiPrefix = '/api';

// register routes
// Swagger UI
app.use(apiPrefix + '/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(apiPrefix + '/session', sessionRouter);
app.use(apiPrefix + '/form', formRouter);
app.use(apiPrefix + '/agent', agentRouter);

app.use(errorHandler);

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
