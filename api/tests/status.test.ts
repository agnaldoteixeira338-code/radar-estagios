import request from 'supertest';
import { criarAppTeste as criarApp } from './appTeste';
import { criarRepositorioFalso, vagaExemplo } from './repositorioFalso';

describe('PATCH /vagas/:id/status', () => {
  it('atualiza o status e devolve a vaga', async () => {
    const { repositorio } = criarRepositorioFalso([vagaExemplo({ id: 7 })]);

    const resposta = await request(criarApp({ vagasRepositorio: repositorio }))
      .patch('/vagas/7/status')
      .send({ status: 'enviada' });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({ id: 7, status: 'enviada' });
  });

  it('responde 404 quando a vaga não existe', async () => {
    const { repositorio } = criarRepositorioFalso([]);

    const resposta = await request(criarApp({ vagasRepositorio: repositorio }))
      .patch('/vagas/99/status')
      .send({ status: 'enviada' });

    expect(resposta.status).toBe(404);
  });

  it.each([undefined, '', 'aprovado', 'ENVIADA', 123])('recusa status inválido %p com 400', async (status) => {
    const { repositorio } = criarRepositorioFalso([vagaExemplo({ id: 1 })]);

    const resposta = await request(criarApp({ vagasRepositorio: repositorio }))
      .patch('/vagas/1/status')
      .send({ status });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toMatch(/status/);
  });

  it.each(['abc', '0', '-3', '1.5'])('recusa id inválido "%s" com 400', async (id) => {
    const { repositorio } = criarRepositorioFalso([vagaExemplo({ id: 1 })]);

    const resposta = await request(criarApp({ vagasRepositorio: repositorio }))
      .patch(`/vagas/${id}/status`)
      .send({ status: 'enviada' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toMatch(/id/);
  });

  it('recusa corpo sem JSON com 400', async () => {
    const { repositorio } = criarRepositorioFalso([vagaExemplo({ id: 1 })]);

    const resposta = await request(criarApp({ vagasRepositorio: repositorio })).patch('/vagas/1/status');

    expect(resposta.status).toBe(400);
  });
});
