import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const CUSTO_BCRYPT = 12; // quanto maior, mais lento para um atacante testar senhas
const VALIDADE_TOKEN = '7d';

// O custo pode ser trocado só nos testes, para eles rodarem rápido; em produção é sempre 12.
export function gerarHashSenha(senha: string, custo: number = CUSTO_BCRYPT): Promise<string> {
  return bcrypt.hash(senha, custo);
}

export function conferirSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

// Hash de uma senha qualquer, usado quando o e-mail não existe: o login leva o mesmo
// tempo com ou sem conta, e um atacante não descobre quais e-mails estão cadastrados.
export const HASH_FALSO = bcrypt.hashSync('senha-que-ninguem-usa', CUSTO_BCRYPT);

export function gerarToken(usuarioId: number, segredo: string): string {
  return jwt.sign({}, segredo, { subject: String(usuarioId), expiresIn: VALIDADE_TOKEN, algorithm: 'HS256' });
}

// Devolve o id do usuário, ou null se o token for inválido, adulterado ou vencido.
export function lerToken(token: string, segredo: string): number | null {
  try {
    const dados = jwt.verify(token, segredo, { algorithms: ['HS256'] });
    const id = typeof dados === 'object' ? Number(dados.sub) : NaN;
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}
