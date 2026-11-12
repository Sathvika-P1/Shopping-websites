import Fastify, { type FastifyInstance } from 'fastify';
import type pg from 'pg';
import { authRoutes } from './routes/auth.js';
import { healthRoutes } from './routes/health.js';

export function buildApp(opts: { pool?: pg.Pool } = {}): FastifyInstance {
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' });
  app.register(healthRoutes);
  app.register(authRoutes, { prefix: '/api/auth', pool: opts.pool });
  return app;
}
