import 'dotenv/config';
import { criarApp } from './app';
import { criarUsuariosRepositorio } from './auth/repositorio';
import { lerOrigensPermitidas } from './config';
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

// Opcional (usado na publicação): origens do painel que podem chamar a API, e nº de proxies na frente dela.
const origensPermitidas = lerOrigensPermitidas(process.env.CORS_ORIGENS);
const proxiesConfiaveis = Number(process.env.PROXIES_CONFIAVEIS) || 0;

const pool = obterPool();
const app = criarApp({
  vagasRepositorio: criarVagasRepositorio(pool),
  usuariosRepositorio: criarUsuariosRepositorio(pool),
  perfisRepositorio: criarPerfisRepositorio(pool),
  segredoJwt,
  origensPermitidas,
  proxiesConfiaveis,
});

app.listen(porta, () => {
  console.log(`API do Radar de Estágios rodando em http://localhost:${porta}`);
});
