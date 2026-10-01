export const SENHA_MINIMO = 8
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Confere os dados da nova conta antes de enviar; devolve a mensagem do primeiro problema encontrado.
export function validarNovaConta(email: string, senha: string, confirmacao: string): string | null {
  if (!EMAIL.test(email.trim())) return 'Digite um e-mail válido.'
  if (senha.length < SENHA_MINIMO) return `A senha precisa ter pelo menos ${SENHA_MINIMO} caracteres.`
  if (senha !== confirmacao) return 'As senhas não são iguais.'
  return null
}
