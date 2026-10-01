import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { exigirLogin } from './auth/middleware';
import type { UsuariosRepositorio } from './auth/tipos';
import type { PerfisRepositorio } from './perfil/tipos';
import { criarAuthRouter } from './routes/auth';
import { criarContaRouter } from './routes/conta';
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
  limiteGeralRequisicoes?: number; // por IP a cada 15 minutos (padrão: 600)
  custoBcrypt?: number; // só os testes trocam; produção usa o padrão (12)
  // Endereços (origens) do painel que podem chamar a API pelo navegador.
  // Vazio: só a mesma origem (em desenvolvimento o Vite repassa as chamadas, então não precisa).
  origensPermitidas?: string[];
  // Quantos proxies existem na frente da API (ex.: 1 no Render), para o limite por IP ver o IP real.
  proxiesConfiaveis?: number;
}

// O app fica separado do servidor (server.ts) para que os testes
// consigam usar a API sem precisar abrir uma porta de rede.
// As dependências (como os repositórios) chegam por parâmetro:
// em produção vem o banco real; nos testes, repositórios falsos.
export function criarApp(dependencias: Dependencias) {
  const app = express();
  if (dependencias.proxiesConfiaveis) app.set('trust proxy', dependencias.proxiesConfiaveis);

  // Cabeçalhos de segurança (ex.: impede o navegador de "adivinhar" o tipo do conteúdo,
  // bloqueia a API dentro de iframes) e remove o "X-Powered-By: Express".
  app.use(helmet());
  app.use(cors({ origin: dependencias.origensPermitidas ?? false }));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: dependencias.limiteGeralRequisicoes ?? 600,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { erro: 'Muitas requisições. Tente de novo em alguns minutos.' },
    }),
  );
  app.use(express.json({ limit: '100kb' }));

  const autenticar = exigirLogin(dependencias.segredoJwt, dependencias.usuariosRepositorio);

  app.use('/health', healthRouter);
  app.use(
    '/auth',
    criarAuthRouter(dependencias.usuariosRepositorio, autenticar, {
      segredoJwt: dependencias.segredoJwt,
      limiteTentativas: dependencias.limiteTentativasLogin,
      custoBcrypt: dependencias.custoBcrypt,
    }),
  );
  app.use('/catalogo', criarCatalogoRouter());
  app.use('/perfil', criarPerfilRouter(dependencias.perfisRepositorio, autenticar));
  app.use('/vagas', criarVagasRouter(dependencias.vagasRepositorio, dependencias.perfisRepositorio, autenticar));
  app.use(
    '/conta',
    criarContaRouter(
      dependencias.usuariosRepositorio,
      dependencias.perfisRepositorio,
      dependencias.vagasRepositorio,
      autenticar,
      dependencias.limiteTentativasLogin,
    ),
  );

  // Rota inexistente: responde em JSON, como o resto da API.
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ erro: 'Rota não encontrada' });
  });

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
