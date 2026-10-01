import request from 'supertest';
import { criarAppTeste as criarApp } from './appTeste';
import { criarRepositorioFalso } from './repositorioFalso';

describe('GET /health', () => {
  it('responde 200 informando que a API está no ar', async () => {
    const app = criarApp({ vagasRepositorio: criarRepositorioFalso().repositorio });

    const resposta = await request(app).get('/health');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ status: 'ok', servico: 'radar-estagios-api' });
  });
});
