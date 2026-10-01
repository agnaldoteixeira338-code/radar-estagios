// Tipos e chamadas à API do Radar de Estágios.

export type Modalidade = 'presencial' | 'hibrido' | 'remoto'
export type Status = 'pendente' | 'enviada' | 'entrevista' | 'recusada' | 'sem_interesse'

export interface Vaga {
  id: number
  titulo: string
  empresa: string
  cidade: string | null
  estado: string | null
  modalidade: Modalidade | null
  link: string
  publicadaEm: string | null
  notaCompatibilidade: number | null
  habilidadesEncontradas: string[]
  requisitosFaltando: string[]
  diferenciaisFaltando: string[]
  alertas: string[]
  motivoEliminacao: string | null
  status: Status
}

export interface Usuario {
  id: number
  nome: string | null
  email: string
}

export interface Sessao {
  token: string
  usuario: Usuario
}

const BASE = '/api'

// Erro com o código HTTP, para quem chamou saber, por exemplo, se a sessão expirou (401).
export class ErroApi extends Error {
  readonly status: number
  constructor(mensagem: string, status: number) {
    super(mensagem)
    this.status = status
  }
}

async function requisitar<T>(caminho: string, opcoes: { metodo?: string; corpo?: unknown; token?: string | null } = {}): Promise<T> {
  let resposta: Response
  try {
    resposta = await fetch(`${BASE}${caminho}`, {
      method: opcoes.metodo ?? 'GET',
      headers: {
        ...(opcoes.corpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(opcoes.token ? { Authorization: `Bearer ${opcoes.token}` } : {}),
      },
      body: opcoes.corpo !== undefined ? JSON.stringify(opcoes.corpo) : undefined,
    })
  } catch {
    throw new ErroApi('Não foi possível conectar ao servidor. Verifique sua internet e tente de novo.', 0)
  }
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => null)
    throw new ErroApi(corpo?.erro ?? `Erro ${resposta.status} ao falar com o servidor`, resposta.status)
  }
  return resposta.json() as Promise<T>
}

export function entrar(email: string, senha: string): Promise<Sessao> {
  return requisitar('/auth/login', { metodo: 'POST', corpo: { email, senha } })
}

export function criarConta(email: string, senha: string): Promise<Sessao> {
  return requisitar('/auth/cadastro', { metodo: 'POST', corpo: { email, senha } })
}

export function buscarUsuario(token: string): Promise<Usuario> {
  return requisitar('/auth/eu', { token })
}

export async function listarVagas(token: string | null): Promise<Vaga[]> {
  const dados = await requisitar<{ vagas: Vaga[] }>('/vagas?limite=100', { token })
  return dados.vagas
}

export function atualizarStatus(id: number, status: Status, token: string | null): Promise<Vaga> {
  return requisitar(`/vagas/${id}/status`, { metodo: 'PATCH', corpo: { status }, token })
}
