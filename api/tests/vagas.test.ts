import request from 'supertest';
import { criarAppTeste as criarApp } from './appTeste';
import type { VagasRepositorio } from '../src/vagas/tipos';
import { criarRepositorioFalso, vagaExemplo } from './repositorioFalso';

describe('GET /vagas', () => {
  it('lista as vagas com o total', async () => {
    const { repositorio } = criarRepositorioFalso([vagaExemplo({ id: 1 }), vagaExemplo({ id: 2 })]);

    const resposta = await request(criarApp({ vagasRepositorio: repositorio })).get('/vagas');

    expect(resposta.status).toBe(200);
    expect(resposta.body.total).toBe(2);
    expect(resposta.body.vagas).toHaveLength(2);
  });

  it('usa limite 20 quando nenhum limite é informado', async () => {
    const { repositorio, chamadas } = criarRepositorioFalso();

    await request(criarApp({ vagasRepositorio: repositorio })).get('/vagas');

    expect(chamadas[0]).toEqual({ modalidade: undefined, limite: 20 });
  });

  it('filtra por modalidade', async () => {
    const { repositorio } = criarRepositorioFalso([
      vagaExemplo({ id: 1, modalidade: 'presencial' }),
      vagaExemplo({ id: 2, modalidade: 'remoto' }),
    ]);

    const resposta = await request(criarApp({ vagasRepositorio: repositorio })).get(
      '/vagas?modalidade=remoto',
    );

    expect(resposta.status).toBe(200);
    expect(resposta.body.vagas.map((v: { id: number }) => v.id)).toEqual([2]);
  });

  it('recusa modalidade inválida com 400', async () => {
    const { repositorio, chamadas } = criarRepositorioFalso();

    const resposta = await request(criarApp({ vagasRepositorio: repositorio })).get(
      '/vagas?modalidade=lua',
    );

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toMatch(/modalidade/);
    expect(chamadas).toHaveLength(0); // nem chegou a consultar o banco
  });

  it.each(['0', '101', 'abc', '2.5'])('recusa limite inválido "%s" com 400', async (limite) => {
    const { repositorio } = criarRepositorioFalso();

    const resposta = await request(criarApp({ vagasRepositorio: repositorio })).get(
      `/vagas?limite=${limite}`,
    );

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toMatch(/limite/);
  });

  it('responde 500 sem expor detalhes quando o banco falha', async () => {
    const repositorioQuebrado: VagasRepositorio = {
      async listar() {
        throw new Error('conexão recusada em postgresql://usuario:senha@host');
      },
      async atualizarStatus() {
        throw new Error('conexão recusada em postgresql://usuario:senha@host');
      },
    };

    const resposta = await request(criarApp({ vagasRepositorio: repositorioQuebrado })).get('/vagas');

    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({ erro: 'Erro interno no servidor' });
    expect(JSON.stringify(resposta.body)).not.toContain('senha');
  });
});
