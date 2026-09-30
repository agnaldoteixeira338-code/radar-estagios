import { Router } from 'express';

// Rota de "saúde": responde se a API está no ar.
// Serviços de deploy (como o Render) usam esse tipo de rota para monitorar a aplicação.
export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({ status: 'ok', servico: 'radar-estagios-api' });
});
