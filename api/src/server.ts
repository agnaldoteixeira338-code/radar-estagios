import 'dotenv/config';
import { criarApp } from './app';
import { obterPool } from './db';
import { criarVagasRepositorio } from './vagas/repositorio';

const porta = Number(process.env.PORT) || 4000;

const app = criarApp({
  vagasRepositorio: criarVagasRepositorio(obterPool()),
});

app.listen(porta, () => {
  console.log(`API do Radar de Estágios rodando em http://localhost:${porta}`);
});
