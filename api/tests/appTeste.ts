import { criarApp, type Dependencias } from '../src/app';
import type { Usuario, UsuarioComSenha, UsuariosRepositorio } from '../src/auth/tipos';
import type { Perfil, PerfisRepositorio } from '../src/perfil/tipos';
import { criarRepositorioFalso } from './repositorioFalso';

export const SEGREDO_TESTE = 'segredo-de-teste-com-mais-de-32-caracteres!!';

// Repositório de usuários na memória, sem banco.
export function criarUsuariosFalso() {
  const usuarios: UsuarioComSenha[] = [];
  let proximoId = 0; // como no banco: ids nunca são reaproveitados, mesmo após excluir
  const repositorio: UsuariosRepositorio = {
    async buscarPorEmail(email) {
      return usuarios.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
    },
    async buscarPorId(id) {
      const u = usuarios.find((x) => x.id === id);
      return u ? { id: u.id, nome: u.nome, email: u.email } : null;
    },
    async excluir(id) {
      const i = usuarios.findIndex((u) => u.id === id);
      if (i >= 0) usuarios.splice(i, 1);
    },
    async criar({ nome, email, senhaHash }) {
      if (usuarios.some((u) => u.email.toLowerCase() === email.toLowerCase())) return null;
      proximoId += 1;
      const novo: UsuarioComSenha = { id: proximoId, nome, email, senhaHash };
      usuarios.push(novo);
      const publico: Usuario = { id: novo.id, nome, email };
      return publico;
    },
  };
  return { repositorio, usuarios };
}

// Repositório de perfis na memória, sem banco.
export function criarPerfisFalso() {
  const perfis = new Map<number, Perfil>();
  const repositorio: PerfisRepositorio = {
    async buscar(usuarioId) {
      return perfis.get(usuarioId) ?? null;
    },
    async salvar(usuarioId, perfil) {
      perfis.set(usuarioId, perfil);
      return perfil;
    },
  };
  return { repositorio, perfis };
}

// Monta o app com dependências falsas; cada teste pode trocar só o que precisa.
export function criarAppTeste(sobrescrever: Partial<Dependencias> = {}) {
  return criarApp({
    vagasRepositorio: criarRepositorioFalso().repositorio,
    usuariosRepositorio: criarUsuariosFalso().repositorio,
    perfisRepositorio: criarPerfisFalso().repositorio,
    segredoJwt: SEGREDO_TESTE,
    limiteTentativasLogin: 1000,
    limiteGeralRequisicoes: 100000,
    custoBcrypt: 4, // mínimo do bcrypt: deixa os testes rápidos (produção usa 12)
    ...sobrescrever,
  });
}
