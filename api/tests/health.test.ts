import request from 'supertest';
import { criarApp } from '../src/app';

describe('GET /health', () => {
  it('responde 200 informando que a API está no ar', async () => {
    const resposta = await request(criarApp()).get('/health');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ status: 'ok', servico: 'radar-estagios-api' });
  });
});
