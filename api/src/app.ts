import express from 'express';
import { healthRouter } from './routes/health';

// O app fica separado do servidor (server.ts) para que os testes
// consigam usar a API sem precisar abrir uma porta de rede.
export function criarApp() {
  const app = express();
  app.use(express.json());

  app.use('/health', healthRouter);

  return app;
}
