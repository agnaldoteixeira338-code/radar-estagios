import { criarApp, type Dependencias } from '../src/app';
import type { Usuario, UsuarioComSenha, UsuariosRepositorio } from '../src/auth/tipos';
import { criarRepositorioFalso } from './repositorioFalso';

export const SEGREDO_TESTE = 'segredo-de-teste-com-mais-de-32-caracteres!!';

// Repositório de usuários na memória, sem banco.
export function criarUsuariosFalso() {
  const usuarios: UsuarioComSenha[] = [];
  const repositorio: UsuariosRepositorio = {
    async buscarPorEmail(email) {
      return usuarios.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
    },
    async buscarPorId(id) {
      const u = usuarios.find((x) => x.id === id);
      return u ? { id: u.id, nome: u.nome, email: u.email } : null;
    },
    async criar({ nome, email, senhaHash }) {
      if (usuarios.some((u) => u.email.toLowerCase() === email.toLowerCase())) return null;
      const novo: UsuarioComSenha = { id: usuarios.length + 1, nome, email, senhaHash };
      usuarios.push(novo);
      const publico: Usuario = { id: novo.id, nome, email };
      return publico;
    },
  };
  return { repositorio, usuarios };
}

// Monta o app com dependências falsas; cada teste pode trocar só o que precisa.
export function criarAppTeste(sobrescrever: Partial<Dependencias> = {}) {
  return criarApp({
    vagasRepositorio: criarRepositorioFalso().repositorio,
    usuariosRepositorio: criarUsuariosFalso().repositorio,
    segredoJwt: SEGREDO_TESTE,
    limiteTentativasLogin: 1000,
    ...sobrescrever,
  });
}
