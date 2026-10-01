import request from 'supertest';
import { criarAppTeste, criarUsuariosFalso } from './appTeste';
import { criarRepositorioFalso, vagaExemplo } from './repositorioFalso';

async function montar() {
  const vagas = criarRepositorioFalso([vagaExemplo({ id: 7 })]);
  const app = criarAppTeste({ vagasRepositorio: vagas.repositorio, usuariosRepositorio: criarUsuariosFalso().repositorio });
  const entrar = async (email: string) => {
    const { body } = await request(app).post('/auth/cadastro').send({ email, senha: 'senha-forte-123' });
    return `Bearer ${body.token}`;
  };
  return { app, entrar };
}

describe('PATCH /vagas/:id/status', () => {
  it('exige login', async () => {
    const { app } = await montar();
    expect((await request(app).patch('/vagas/7/status').send({ status: 'enviada' })).status).toBe(401);
  });

  it('salva o status de quem está logado', async () => {
    const { app, entrar } = await montar();
    const token = await entrar('a@exemplo.com');

    const resposta = await request(app).patch('/vagas/7/status').set('Authorization', token).send({ status: 'enviada' });
    const lista = await request(app).get('/vagas').set('Authorization', token);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ vagaId: 7, status: 'enviada' });
    expect(lista.body.vagas[0].status).toBe('enviada');
  });

  it('o status de uma pessoa não aparece para outra', async () => {
    const { app, entrar } = await montar();
    const tokenA = await entrar('a@exemplo.com');
    const tokenB = await entrar('b@exemplo.com');

    await request(app).patch('/vagas/7/status').set('Authorization', tokenA).send({ status: 'entrevista' });
    const listaB = await request(app).get('/vagas').set('Authorization', tokenB);

    expect(listaB.body.vagas[0].status).toBe('pendente');
  });

  it('responde 404 quando a vaga não existe', async () => {
    const { app, entrar } = await montar();
    const token = await entrar('a@exemplo.com');

    const resposta = await request(app).patch('/vagas/99/status').set('Authorization', token).send({ status: 'enviada' });

    expect(resposta.status).toBe(404);
  });

  it.each([undefined, '', 'aprovado', 'ENVIADA', 123])('recusa status inválido %p com 400', async (status) => {
    const { app, entrar } = await montar();
    const token = await entrar('a@exemplo.com');

    const resposta = await request(app).patch('/vagas/7/status').set('Authorization', token).send({ status });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toMatch(/status/);
  });

  it.each(['abc', '0', '-3', '1.5'])('recusa id inválido "%s" com 400', async (id) => {
    const { app, entrar } = await montar();
    const token = await entrar('a@exemplo.com');

    const resposta = await request(app).patch(`/vagas/${id}/status`).set('Authorization', token).send({ status: 'enviada' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toMatch(/id/);
  });

  it('recusa corpo sem JSON com 400', async () => {
    const { app, entrar } = await montar();
    const token = await entrar('a@exemplo.com');

    const resposta = await request(app).patch('/vagas/7/status').set('Authorization', token);

    expect(resposta.status).toBe(400);
  });
});
