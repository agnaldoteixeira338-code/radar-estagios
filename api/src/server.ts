import 'dotenv/config';
import { criarApp } from './app';

const porta = Number(process.env.PORT) || 4000;

criarApp().listen(porta, () => {
  console.log(`API do Radar de Estágios rodando em http://localhost:${porta}`);
});
