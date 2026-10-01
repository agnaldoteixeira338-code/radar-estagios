import express, { type NextFunction, type Request, type Response } from 'express';
import type { UsuariosRepositorio } from './auth/tipos';
import type { PerfisRepositorio } from './perfil/tipos';
import { criarAuthRouter } from './routes/auth';
import { healthRouter } from './routes/health';
import { criarCatalogoRouter, criarPerfilRouter } from './routes/perfil';
import { criarVagasRouter } from './routes/vagas';
import type { VagasRepositorio } from './vagas/tipos';

export interface Dependencias {
  vagasRepositorio: VagasRepositorio;
  usuariosRepositorio: UsuariosRepositorio;
  perfisRepositorio: PerfisRepositorio;
  segredoJwt: string;
  limiteTentativasLogin?: number;
  custoBcrypt?: number; // só os testes trocam; produção usa o padrão (12)
}

// O app fica separado do servidor (server.ts) para que os testes
// consigam usar a API sem precisar abrir uma porta de rede.
// As dependências (como os repositórios) chegam por parâmetro:
// em produção vem o banco real; nos testes, repositórios falsos.
export function criarApp(dependencias: Dependencias) {
  const app = express();
  app.use(express.json({ limit: '100kb' }));

  app.use('/health', healthRouter);
  app.use(
    '/auth',
    criarAuthRouter(dependencias.usuariosRepositorio, {
      segredoJwt: dependencias.segredoJwt,
      limiteTentativas: dependencias.limiteTentativasLogin,
      custoBcrypt: dependencias.custoBcrypt,
    }),
  );
  app.use('/catalogo', criarCatalogoRouter());
  app.use('/perfil', criarPerfilRouter(dependencias.perfisRepositorio, dependencias.segredoJwt));
  app.use('/vagas', criarVagasRouter(dependencias.vagasRepositorio, dependencias.perfisRepositorio, dependencias.segredoJwt));

  // Tratador de erros: registra o erro completo no terminal (para quem desenvolve)
  // e devolve ao cliente só uma mensagem genérica, sem expor detalhes internos.
  app.use((erro: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
    // Erros do próprio cliente (ex.: JSON malformado, corpo grande demais) viram 4xx.
    if (erro.status && erro.status >= 400 && erro.status < 500) {
      res.status(erro.status).json({ erro: 'Requisição inválida' });
      return;
    }
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  });

  return app;
}
