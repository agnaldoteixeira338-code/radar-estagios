import request from 'supertest';
import type { Perfil } from '../src/perfil/tipos';
import type { VagaDoBanco, VagasRepositorio } from '../src/vagas/tipos';
import { criarAppTeste, criarPerfisFalso, criarUsuariosFalso } from './appTeste';
import { criarRepositorioFalso, vagaExemplo } from './repositorioFalso';

const PERFIL_REACT: Perfil = {
  habilidades: ['react', 'nodejs', 'sql'],
  formatura: '2028-01',
  nivelIngles: 'intermediario',
  modalidades: ['presencial', 'hibrido', 'remoto'],
};

async function montar(vagas: VagaDoBanco[] = [], vagasRepositorio?: VagasRepositorio) {
  const perfis = criarPerfisFalso();
  const app = criarAppTeste({
    vagasRepositorio: vagasRepositorio ?? criarRepositorioFalso(vagas).repositorio,
    usuariosRepositorio: criarUsuariosFalso().repositorio,
    perfisRepositorio: perfis.repositorio,
  });
  const entrar = async (email: string, perfil?: Perfil) => {
    const { body } = await request(app).post('/auth/cadastro').send({ email, senha: 'senha-forte-123' });
    if (perfil) await perfis.repositorio.salvar(body.usuario.id, perfil);
    return `Bearer ${body.token}`;
  };
  return { app, entrar };
}

describe('GET /vagas', () => {
  it('exige login', async () => {
    const { app } = await montar([vagaExemplo()]);
    expect((await request(app).get('/vagas')).status).toBe(401);
  });

  it('calcula a nota com o perfil de quem está logado e não devolve a descrição', async () => {
    const { app, entrar } = await montar([vagaExemplo()]);
    const token = await entrar('a@exemplo.com', PERFIL_REACT);

    const resposta = await request(app).get('/vagas').set('Authorization', token);

    expect(resposta.status).toBe(200);
    const [vaga] = resposta.body.vagas;
    expect(vaga.habilidadesEncontradas).toEqual(expect.arrayContaining(['React', 'Node.js', 'SQL']));
    expect(vaga.notaCompatibilidade).toBeGreaterThan(70);
    expect(vaga).not.toHaveProperty('descricao');
    expect(vaga.status).toBe('pendente');
  });

  it('a mesma vaga tem notas diferentes para perfis diferentes', async () => {
    const { app, entrar } = await montar([vagaExemplo()]);
    const comReact = await entrar('a@exemplo.com', PERFIL_REACT);
    const semPerfil = await entrar('b@exemplo.com');

    const notaA = (await request(app).get('/vagas').set('Authorization', comReact)).body.vagas[0].notaCompatibilidade;
    const notaB = (await request(app).get('/vagas').set('Authorization', semPerfil)).body.vagas[0].notaCompatibilidade;

    expect(notaA).toBeGreaterThan(notaB);
  });

  it('ordena pela nota, da maior para a menor, e aplica o limite depois do cálculo', async () => {
    const { app, entrar } = await montar([
      vagaExemplo({ id: 1, titulo: 'Estágio em Suporte', descricao: 'Atendimento a usuários.' }),
      vagaExemplo({ id: 2, titulo: 'Estágio em Desenvolvimento', descricao: 'React, Node.js e SQL.' }),
      vagaExemplo({ id: 3, titulo: 'Estágio em TI', descricao: 'SQL.' }),
    ]);
    const token = await entrar('a@exemplo.com', PERFIL_REACT);

    const tudo = await request(app).get('/vagas').set('Authorization', token);
    const dois = await request(app).get('/vagas?limite=2').set('Authorization', token);

    expect(tudo.body.vagas.map((v: { id: number }) => v.id)).toEqual([2, 3, 1]);
    expect(dois.body.vagas.map((v: { id: number }) => v.id)).toEqual([2, 3]);
    expect(dois.body.total).toBe(2);
  });

  it('filtra por modalidade', async () => {
    const { app, entrar } = await montar([
      vagaExemplo({ id: 1, modalidade: 'presencial' }),
      vagaExemplo({ id: 2, modalidade: 'remoto' }),
    ]);
    const token = await entrar('a@exemplo.com');

    const resposta = await request(app).get('/vagas?modalidade=remoto').set('Authorization', token);

    expect(resposta.body.vagas.map((v: { id: number }) => v.id)).toEqual([2]);
  });

  it('recusa modalidade inválida com 400', async () => {
    const { app, entrar } = await montar();
    const token = await entrar('a@exemplo.com');

    const resposta = await request(app).get('/vagas?modalidade=lua').set('Authorization', token);

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toMatch(/modalidade/);
  });

  it.each(['0', '101', 'abc', '2.5'])('recusa limite inválido "%s" com 400', async (limite) => {
    const { app, entrar } = await montar();
    const token = await entrar('a@exemplo.com');

    const resposta = await request(app).get(`/vagas?limite=${limite}`).set('Authorization', token);

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toMatch(/limite/);
  });

  it('responde 500 sem expor detalhes quando o banco falha', async () => {
    const quebrado: VagasRepositorio = {
      async listar() {
        throw new Error('conexão recusada em postgresql://usuario:senha@host');
      },
      async salvarStatus() {
        throw new Error('conexão recusada em postgresql://usuario:senha@host');
      },
    };
    const { app, entrar } = await montar([], quebrado);
    const token = await entrar('a@exemplo.com');
    const erroOriginal = console.error;
    console.error = () => {}; // o erro é esperado; não poluir a saída do teste

    const resposta = await request(app).get('/vagas').set('Authorization', token);
    console.error = erroOriginal;

    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({ erro: 'Erro interno no servidor' });
    expect(JSON.stringify(resposta.body)).not.toContain('senha');
  });
});
