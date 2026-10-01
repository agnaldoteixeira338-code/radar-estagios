// Dados públicos do usuário: é o que pode sair nas respostas da API (nunca o hash da senha).
export interface Usuario {
  id: number;
  nome: string | null; // opcional: o cadastro pede só e-mail e senha
  email: string;
}

export interface UsuarioComSenha extends Usuario {
  senhaHash: string;
}

export interface UsuariosRepositorio {
  buscarPorEmail(email: string): Promise<UsuarioComSenha | null>;
  buscarPorId(id: number): Promise<Usuario | null>;
  // Devolve null se o e-mail já estiver em uso.
  criar(dados: { nome: string | null; email: string; senhaHash: string }): Promise<Usuario | null>;
  // Apaga a conta; perfil e candidaturas vão junto (ON DELETE CASCADE no banco).
  excluir(id: number): Promise<void>;
}
