import jwt from 'jsonwebtoken';
import request from 'supertest';
import { criarAppTeste, criarUsuariosFalso, SEGREDO_TESTE } from './appTeste';

const CADASTRO = { nome: 'Agnaldo', email: 'agnaldo@exemplo.com', senha: 'senha-forte-123' };

function appComUsuarios() {
  const usuarios = criarUsuariosFalso();
  return { app: criarAppTeste({ usuariosRepositorio: usuarios.repositorio }), usuarios };
}

describe('POST /auth/cadastro', () => {
  it('cria a conta, devolve token e nunca devolve a senha', async () => {
    const { app, usuarios } = appComUsuarios();

    const resposta = await request(app).post('/auth/cadastro').send(CADASTRO);

    expect(resposta.status).toBe(201);
    expect(resposta.body.usuario).toEqual({ id: 1, nome: 'Agnaldo', email: 'agnaldo@exemplo.com' });
    expect(typeof resposta.body.token).toBe('string');
    expect(JSON.stringify(resposta.body)).not.toMatch(/senha|hash/i);
    // A senha é guardada só como hash bcrypt.
    expect(usuarios.usuarios[0].senhaHash).toMatch(/^\$2[aby]\$\d\d\$/);
    expect(usuarios.usuarios[0].senhaHash).not.toContain(CADASTRO.senha);
  });

  it('em produção (sem trocar o custo) usa bcrypt com custo 12', async () => {
    const usuarios = criarUsuariosFalso();
    const app = criarAppTeste({ usuariosRepositorio: usuarios.repositorio, custoBcrypt: undefined });

    await request(app).post('/auth/cadastro').send(CADASTRO);

    expect(usuarios.usuarios[0].senhaHash).toMatch(/^\$2[aby]\$12\$/);
  });

  it('guarda o e-mail em minúsculas e sem espaços', async () => {
    const { app } = appComUsuarios();

    const resposta = await request(app)
      .post('/auth/cadastro')
      .send({ ...CADASTRO, email: '  Agnaldo@Exemplo.COM ' });

    expect(resposta.body.usuario.email).toBe('agnaldo@exemplo.com');
  });

  it('recusa e-mail já cadastrado, mesmo com maiúsculas diferentes', async () => {
    const { app } = appComUsuarios();
    await request(app).post('/auth/cadastro').send(CADASTRO);

    const resposta = await request(app)
      .post('/auth/cadastro')
      .send({ ...CADASTRO, email: 'AGNALDO@exemplo.com' });

    expect(resposta.status).toBe(409);
  });

  it('aceita cadastro só com e-mail e senha (nome é opcional)', async () => {
    const { app } = appComUsuarios();

    const resposta = await request(app)
      .post('/auth/cadastro')
      .send({ email: 'sem-nome@exemplo.com', senha: 'senha-forte-123' });

    expect(resposta.status).toBe(201);
    expect(resposta.body.usuario).toEqual({ id: 1, nome: null, email: 'sem-nome@exemplo.com' });
  });

  it('trata nome vazio como "sem nome"', async () => {
    const { app } = appComUsuarios();

    const resposta = await request(app).post('/auth/cadastro').send({ ...CADASTRO, nome: '   ' });

    expect(resposta.status).toBe(201);
    expect(resposta.body.usuario.nome).toBeNull();
  });

  it.each([
    [{ ...CADASTRO, nome: 'A' }, /nome/],
    [{ ...CADASTRO, nome: 123 }, /nome/],
    [{ ...CADASTRO, email: 'sem-arroba' }, /email/],
    [{ ...CADASTRO, email: 123 }, /email/],
    [{ ...CADASTRO, senha: 'curta' }, /senha/],
    [{ ...CADASTRO, senha: 'é'.repeat(40) }, /senha/], // 80 bytes: passa do limite do bcrypt
    [{}, /email/],
  ])('recusa dados inválidos %p com 400', async (corpo, mensagem) => {
    const { app } = appComUsuarios();

    const resposta = await request(app).post('/auth/cadastro').send(corpo);

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toMatch(mensagem);
  });
});

describe('POST /auth/login', () => {
  it('entra com e-mail e senha corretos', async () => {
    const { app } = appComUsuarios();
    await request(app).post('/auth/cadastro').send(CADASTRO);

    const resposta = await request(app)
      .post('/auth/login')
      .send({ email: 'AGNALDO@exemplo.com', senha: CADASTRO.senha });

    expect(resposta.status).toBe(200);
    expect(resposta.body.usuario.email).toBe('agnaldo@exemplo.com');
    expect(typeof resposta.body.token).toBe('string');
  });

  it('dá a mesma resposta para senha errada e para e-mail inexistente', async () => {
    const { app } = appComUsuarios();
    await request(app).post('/auth/cadastro').send(CADASTRO);

    const senhaErrada = await request(app).post('/auth/login').send({ email: CADASTRO.email, senha: 'errada-123' });
    const semConta = await request(app).post('/auth/login').send({ email: 'ninguem@exemplo.com', senha: 'errada-123' });

    expect(senhaErrada.status).toBe(401);
    expect(semConta.status).toBe(401);
    expect(senhaErrada.body).toEqual(semConta.body);
  });

  it('recusa corpo incompleto com 400', async () => {
    const { app } = appComUsuarios();

    const resposta = await request(app).post('/auth/login').send({ email: 'x@y.com' });

    expect(resposta.status).toBe(400);
  });

  it('bloqueia muitas tentativas seguidas com 429', async () => {
    const usuarios = criarUsuariosFalso();
    const app = criarAppTeste({ usuariosRepositorio: usuarios.repositorio, limiteTentativasLogin: 3 });

    const status = [];
    for (let i = 0; i < 4; i++) {
      const r = await request(app).post('/auth/login').send({ email: 'x@y.com', senha: 'errada-123' });
      status.push(r.status);
    }

    expect(status).toEqual([401, 401, 401, 429]);
  });
});

describe('GET /auth/eu', () => {
  it('devolve os dados de quem está logado', async () => {
    const { app } = appComUsuarios();
    const { body } = await request(app).post('/auth/cadastro').send(CADASTRO);

    const resposta = await request(app).get('/auth/eu').set('Authorization', `Bearer ${body.token}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ id: 1, nome: 'Agnaldo', email: 'agnaldo@exemplo.com' });
  });

  it.each([
    ['sem token', undefined],
    ['formato errado', 'Token abc'],
    ['token qualquer', 'Bearer abc.def.ghi'],
    ['token assinado com outro segredo', `Bearer ${jwt.sign({}, 'outro-segredo-com-mais-de-32-caracteres!!', { subject: '1' })}`],
    ['token vencido', `Bearer ${jwt.sign({}, SEGREDO_TESTE, { subject: '1', expiresIn: -10 })}`],
    ['token sem assinatura (alg none)', `Bearer ${jwt.sign({}, '', { subject: '1', algorithm: 'none' })}`],
  ])('recusa %s com 401', async (_caso, cabecalho) => {
    const { app } = appComUsuarios();
    await request(app).post('/auth/cadastro').send(CADASTRO);

    const pedido = request(app).get('/auth/eu');
    if (cabecalho) pedido.set('Authorization', cabecalho);
    const resposta = await pedido;

    expect(resposta.status).toBe(401);
  });

  it('recusa token de conta que não existe mais', async () => {
    const { app } = appComUsuarios();
    const token = jwt.sign({}, SEGREDO_TESTE, { subject: '999', algorithm: 'HS256' });

    const resposta = await request(app).get('/auth/eu').set('Authorization', `Bearer ${token}`);

    expect(resposta.status).toBe(401);
  });
});

describe('JSON malformado', () => {
  it('responde 400, e não 500', async () => {
    const { app } = appComUsuarios();

    const resposta = await request(app)
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({ erro: 'Requisição inválida' });
  });
});
