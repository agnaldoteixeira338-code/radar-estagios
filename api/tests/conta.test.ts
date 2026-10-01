import request from 'supertest';
import { criarAppTeste, criarPerfisFalso, criarUsuariosFalso } from './appTeste';
import { criarRepositorioFalso, vagaExemplo } from './repositorioFalso';

const SENHA = 'senha-forte-123';

function montar(limiteTentativasLogin = 1000) {
  const usuarios = criarUsuariosFalso();
  const perfis = criarPerfisFalso();
  const vagas = criarRepositorioFalso([vagaExemplo({ id: 7, titulo: 'Estágio Dev', empresa: 'Empresa X' })]);
  const app = criarAppTeste({
    usuariosRepositorio: usuarios.repositorio,
    perfisRepositorio: perfis.repositorio,
    vagasRepositorio: vagas.repositorio,
    limiteTentativasLogin,
  });
  const entrar = async (email = 'a@exemplo.com') => {
    const { body } = await request(app).post('/auth/cadastro').send({ email, senha: SENHA });
    return `Bearer ${body.token}`;
  };
  return { app, entrar, usuarios };
}

describe('GET /conta/dados', () => {
  it('exige login', async () => {
    const { app } = montar();
    expect((await request(app).get('/conta/dados')).status).toBe(401);
  });

  it('devolve conta, perfil e candidaturas como arquivo para baixar, sem a senha', async () => {
    const { app, entrar } = montar();
    const token = await entrar();
    await request(app)
      .put('/perfil')
      .set('Authorization', token)
      .send({ habilidades: ['react'], formatura: '2028-01', nivelIngles: 'intermediario', modalidades: ['presencial'] });
    await request(app).patch('/vagas/7/status').set('Authorization', token).send({ status: 'enviada' });

    const resposta = await request(app).get('/conta/dados').set('Authorization', token);

    expect(resposta.status).toBe(200);
    expect(resposta.headers['content-disposition']).toMatch(/attachment; filename="meus-dados-radar-de-estagios.json"/);
    expect(resposta.body.conta).toEqual({ id: 1, nome: null, email: 'a@exemplo.com' });
    expect(resposta.body.perfil.habilidades).toEqual(['react']);
    expect(resposta.body.candidaturas).toEqual([
      expect.objectContaining({ vagaId: 7, titulo: 'Estágio Dev', empresa: 'Empresa X', status: 'enviada' }),
    ]);
    expect(JSON.stringify(resposta.body)).not.toMatch(/\$2[aby]\$|senha-forte/);
  });
});

describe('DELETE /conta', () => {
  it('exige login', async () => {
    const { app } = montar();
    expect((await request(app).delete('/conta').send({ senha: SENHA })).status).toBe(401);
  });

  it('exige a senha para confirmar', async () => {
    const { app, entrar, usuarios } = montar();
    const token = await entrar();

    const resposta = await request(app).delete('/conta').set('Authorization', token).send({});

    expect(resposta.status).toBe(400);
    expect(usuarios.usuarios).toHaveLength(1);
  });

  it('recusa senha errada e não apaga nada', async () => {
    const { app, entrar, usuarios } = montar();
    const token = await entrar();

    const resposta = await request(app).delete('/conta').set('Authorization', token).send({ senha: 'senha-errada-1' });

    expect(resposta.status).toBe(403);
    expect(usuarios.usuarios).toHaveLength(1);
  });

  it('com a senha certa apaga a conta, e o token antigo para de funcionar em todas as rotas', async () => {
    const { app, entrar, usuarios } = montar();
    const token = await entrar();

    const resposta = await request(app).delete('/conta').set('Authorization', token).send({ senha: SENHA });

    expect(resposta.status).toBe(204);
    expect(usuarios.usuarios).toHaveLength(0);
    for (const [metodo, caminho] of [
      ['get', '/auth/eu'],
      ['get', '/perfil'],
      ['get', '/vagas'],
      ['get', '/conta/dados'],
    ] as const) {
      expect((await request(app)[metodo](caminho).set('Authorization', token)).status).toBe(401);
    }
    const putPerfil = await request(app)
      .put('/perfil')
      .set('Authorization', token)
      .send({ habilidades: [], formatura: null, nivelIngles: 'basico', modalidades: ['remoto'] });
    expect(putPerfil.status).toBe(401);
  });

  it('apaga só a conta de quem pediu', async () => {
    const { app, entrar, usuarios } = montar();
    const tokenA = await entrar('a@exemplo.com');
    const tokenB = await entrar('b@exemplo.com');

    await request(app).delete('/conta').set('Authorization', tokenA).send({ senha: SENHA });

    expect(usuarios.usuarios.map((u) => u.email)).toEqual(['b@exemplo.com']);
    expect((await request(app).get('/auth/eu').set('Authorization', tokenB)).status).toBe(200);
  });

  it('limita tentativas de senha na exclusão (contra adivinhação com token roubado)', async () => {
    const { app, entrar } = montar(3);
    const token = await entrar();

    const status = [];
    for (let i = 0; i < 4; i++) {
      status.push((await request(app).delete('/conta').set('Authorization', token).send({ senha: `errada-${i}-123` })).status);
    }

    expect(status).toEqual([403, 403, 403, 429]);
  });
});

describe('proteções gerais', () => {
  it('envia cabeçalhos de segurança e esconde que é Express', async () => {
    const resposta = await request(criarAppTeste()).get('/health');

    expect(resposta.headers['x-content-type-options']).toBe('nosniff');
    expect(resposta.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(resposta.headers['x-powered-by']).toBeUndefined();
  });

  it('por padrão não libera CORS para outros sites', async () => {
    const resposta = await request(criarAppTeste()).get('/health').set('Origin', 'https://site-malicioso.com');
    expect(resposta.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('libera CORS só para as origens configuradas', async () => {
    const app = criarAppTeste({ origensPermitidas: ['https://radar.exemplo.com'] });

    const permitida = await request(app).get('/health').set('Origin', 'https://radar.exemplo.com');
    const outra = await request(app).get('/health').set('Origin', 'https://site-malicioso.com');

    expect(permitida.headers['access-control-allow-origin']).toBe('https://radar.exemplo.com');
    expect(outra.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('responde 404 em JSON para rota inexistente', async () => {
    const resposta = await request(criarAppTeste()).get('/nao-existe');

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({ erro: 'Rota não encontrada' });
  });

  it('limita o total de requisições por IP', async () => {
    const app = criarAppTeste({ limiteGeralRequisicoes: 2 });

    const status = [];
    for (let i = 0; i < 3; i++) status.push((await request(app).get('/health')).status);

    expect(status).toEqual([200, 200, 429]);
  });
});
