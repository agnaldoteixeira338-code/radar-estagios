import express, { type NextFunction, type Request, type Response } from 'express';
import { healthRouter } from './routes/health';
import { criarVagasRouter } from './routes/vagas';
import type { VagasRepositorio } from './vagas/tipos';

export interface Dependencias {
  vagasRepositorio: VagasRepositorio;
}

// O app fica separado do servidor (server.ts) para que os testes
// consigam usar a API sem precisar abrir uma porta de rede.
// As dependências (como o repositório de vagas) chegam por parâmetro:
// em produção vem o banco real; nos testes, um repositório falso.
export function criarApp(dependencias: Dependencias) {
  const app = express();
  app.use(express.json());

  app.use('/health', healthRouter);
  app.use('/vagas', criarVagasRouter(dependencias.vagasRepositorio));

  // Tratador de erros: registra o erro completo no terminal (para quem desenvolve)
  // e devolve ao cliente só uma mensagem genérica, sem expor detalhes internos.
  app.use((erro: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  });

  return app;
}
