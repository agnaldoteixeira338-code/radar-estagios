import 'dotenv/config';
import { criarApp } from './app';
import { criarUsuariosRepositorio } from './auth/repositorio';
import { obterPool } from './db';
import { criarPerfisRepositorio } from './perfil/repositorio';
import { criarVagasRepositorio } from './vagas/repositorio';

const porta = Number(process.env.PORT) || 4000;

// Segredo que assina os tokens de login. Sem ele (ou fraco), qualquer um poderia forjar tokens.
const segredoJwt = process.env.JWT_SECRET;
if (!segredoJwt || segredoJwt.length < 32) {
  console.error('JWT_SECRET ausente ou curto (mínimo 32 caracteres). Configure no arquivo api/.env.');
  process.exit(1);
}

// Opcional (usado na publicação): origens do painel separadas por vírgula, e nº de proxies na frente da API.
const origensPermitidas = (process.env.CORS_ORIGENS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const proxiesConfiaveis = Number(process.env.PROXIES_CONFIAVEIS) || 0;

const pool = obterPool();
const app = criarApp({
  vagasRepositorio: criarVagasRepositorio(pool),
  usuariosRepositorio: criarUsuariosRepositorio(pool),
  perfisRepositorio: criarPerfisRepositorio(pool),
  segredoJwt,
  origensPermitidas: origensPermitidas.length > 0 ? origensPermitidas : undefined,
  proxiesConfiaveis,
});

app.listen(porta, () => {
  console.log(`API do Radar de Estágios rodando em http://localhost:${porta}`);
});
