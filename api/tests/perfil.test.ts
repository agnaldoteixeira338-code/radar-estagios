import request from 'supertest';
import { CATALOGO } from '../src/perfil/catalogo';
import { criarAppTeste, criarPerfisFalso, criarUsuariosFalso } from './appTeste';

function montar() {
  const perfis = criarPerfisFalso();
  const app = criarAppTeste({
    usuariosRepositorio: criarUsuariosFalso().repositorio,
    perfisRepositorio: perfis.repositorio,
  });
  return { app, perfis };
}

async function cadastrar(app: ReturnType<typeof criarAppTeste>, email: string) {
  const { body } = await request(app).post('/auth/cadastro').send({ nome: 'Pessoa', email, senha: 'senha-forte-123' });
  return `Bearer ${body.token}`;
}

const PERFIL_VALIDO = {
  habilidades: ['react', 'nodejs', 'sql'],
  formatura: '2028-01',
  nivelIngles: 'intermediario',
  modalidades: ['presencial', 'hibrido'],
};

describe('GET /catalogo', () => {
  it('é público e lista id, nome e categoria, sem expor os padrões internos', async () => {
    const resposta = await request(criarAppTeste()).get('/catalogo');

    expect(resposta.status).toBe(200);
    expect(resposta.body.tecnologias).toHaveLength(CATALOGO.length);
    expect(resposta.body.tecnologias[0]).toEqual({ id: 'javascript', nome: 'JavaScript', categoria: 'Linguagens' });
    expect(Object.keys(resposta.body.tecnologias[0])).not.toContain('padrao');
  });

  it('não tem ids repetidos', () => {
    const ids = CATALOGO.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('/perfil', () => {
  it('exige login', async () => {
    const { app } = montar();

    expect((await request(app).get('/perfil')).status).toBe(401);
    expect((await request(app).put('/perfil').send(PERFIL_VALIDO)).status).toBe(401);
  });

  it('devolve um perfil vazio para quem ainda não preencheu', async () => {
    const { app } = montar();
    const token = await cadastrar(app, 'a@exemplo.com');

    const resposta = await request(app).get('/perfil').set('Authorization', token);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({
      habilidades: [],
      formatura: null,
      nivelIngles: 'basico',
      modalidades: ['presencial', 'hibrido', 'remoto'],
    });
  });

  it('salva e devolve o perfil', async () => {
    const { app } = montar();
    const token = await cadastrar(app, 'a@exemplo.com');

    const salvo = await request(app).put('/perfil').set('Authorization', token).send(PERFIL_VALIDO);
    const lido = await request(app).get('/perfil').set('Authorization', token);

    expect(salvo.status).toBe(200);
    expect(lido.body).toEqual({ ...PERFIL_VALIDO, habilidades: ['nodejs', 'react', 'sql'] });
  });

  it('remove habilidades repetidas e organiza a ordem', async () => {
    const { app } = montar();
    const token = await cadastrar(app, 'a@exemplo.com');

    const resposta = await request(app)
      .put('/perfil')
      .set('Authorization', token)
      .send({ ...PERFIL_VALIDO, habilidades: ['sql', 'react', 'sql'], modalidades: ['remoto', 'presencial', 'remoto'] });

    expect(resposta.body.habilidades).toEqual(['react', 'sql']);
    expect(resposta.body.modalidades).toEqual(['presencial', 'remoto']);
  });

  it('aceita formatura null (ainda não sei)', async () => {
    const { app } = montar();
    const token = await cadastrar(app, 'a@exemplo.com');

    const resposta = await request(app).put('/perfil').set('Authorization', token).send({ ...PERFIL_VALIDO, formatura: null });

    expect(resposta.status).toBe(200);
    expect(resposta.body.formatura).toBeNull();
  });

  it('cada pessoa vê só o próprio perfil', async () => {
    const { app } = montar();
    const tokenA = await cadastrar(app, 'a@exemplo.com');
    const tokenB = await cadastrar(app, 'b@exemplo.com');

    await request(app).put('/perfil').set('Authorization', tokenA).send(PERFIL_VALIDO);
    const perfilB = await request(app).get('/perfil').set('Authorization', tokenB);

    expect(perfilB.body.habilidades).toEqual([]);
  });

  it.each([
    [{ ...PERFIL_VALIDO, habilidades: 'react' }, /habilidades/],
    [{ ...PERFIL_VALIDO, habilidades: ['react', 'cobol'] }, /desconhecidas: cobol/],
    [{ ...PERFIL_VALIDO, habilidades: [1, 2] }, /habilidades/],
    [{ ...PERFIL_VALIDO, formatura: '2028-13' }, /formatura/],
    [{ ...PERFIL_VALIDO, formatura: '01/2028' }, /formatura/],
    [{ ...PERFIL_VALIDO, formatura: '1999-12' }, /formatura/],
    [{ ...PERFIL_VALIDO, formatura: undefined }, /formatura/],
    [{ ...PERFIL_VALIDO, nivelIngles: 'nativo' }, /nivelIngles/],
    [{ ...PERFIL_VALIDO, modalidades: [] }, /modalidades/],
    [{ ...PERFIL_VALIDO, modalidades: ['lua'] }, /modalidades/],
    [{}, /habilidades/],
  ])('recusa perfil inválido %p com 400', async (corpo, mensagem) => {
    const { app, perfis } = montar();
    const token = await cadastrar(app, 'a@exemplo.com');

    const resposta = await request(app).put('/perfil').set('Authorization', token).send(corpo);

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toMatch(mensagem);
    expect(perfis.perfis.size).toBe(0); // nada foi salvo
  });
});
