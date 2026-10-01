// Regras de validação dos dados de cadastro e login.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const SENHA_MINIMO = 8;
const SENHA_MAXIMO_BYTES = 72; // o bcrypt ignora o que passar de 72 bytes

export interface DadosCadastro {
  nome: string | null;
  email: string;
  senha: string;
}

type Resultado<T> = { ok: true; dados: T } | { ok: false; erro: string };

export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validarCadastro(corpo: unknown): Resultado<DadosCadastro> {
  const { nome, email, senha } = (corpo ?? {}) as Record<string, unknown>;

  // Nome é opcional; se vier, precisa ser válido.
  const semNome = nome === undefined || nome === null || (typeof nome === 'string' && nome.trim() === '');
  if (!semNome && (typeof nome !== 'string' || nome.trim().length < 2 || nome.trim().length > 80)) {
    return { ok: false, erro: 'nome deve ter entre 2 e 80 caracteres' };
  }
  if (typeof email !== 'string' || email.length > 254 || !EMAIL.test(email.trim())) {
    return { ok: false, erro: 'email inválido' };
  }
  if (typeof senha !== 'string' || senha.length < SENHA_MINIMO) {
    return { ok: false, erro: `senha deve ter pelo menos ${SENHA_MINIMO} caracteres` };
  }
  if (Buffer.byteLength(senha, 'utf8') > SENHA_MAXIMO_BYTES) {
    return { ok: false, erro: 'senha muito longa (máximo de 72 bytes)' };
  }
  return {
    ok: true,
    dados: { nome: semNome ? null : (nome as string).trim(), email: normalizarEmail(email), senha },
  };
}

export function validarLogin(corpo: unknown): Resultado<{ email: string; senha: string }> {
  const { email, senha } = (corpo ?? {}) as Record<string, unknown>;
  if (typeof email !== 'string' || typeof senha !== 'string' || !email.trim() || !senha) {
    return { ok: false, erro: 'informe email e senha' };
  }
  return { ok: true, dados: { email: normalizarEmail(email), senha } };
}
