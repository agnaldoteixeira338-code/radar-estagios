// Guarda o token de login no navegador para a pessoa continuar logada ao recarregar a página.
// O acesso ao localStorage pode falhar (ex.: navegação privada com armazenamento bloqueado),
// por isso cada operação é protegida: sem armazenamento, a sessão dura só enquanto a aba estiver aberta.

const CHAVE = 'radar-estagios:token'

export function lerToken(): string | null {
  try {
    return localStorage.getItem(CHAVE)
  } catch {
    return null
  }
}

export function salvarToken(token: string): void {
  try {
    localStorage.setItem(CHAVE, token)
  } catch {
    // sem armazenamento disponível: a sessão continua só na memória
  }
}

export function apagarToken(): void {
  try {
    localStorage.removeItem(CHAVE)
  } catch {
    // nada a apagar
  }
}
