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

export type NivelIngles = 'basico' | 'intermediario' | 'avancado' | 'fluente'

export interface Perfil {
  habilidades: string[] // ids do catálogo
  formatura: string | null // "AAAA-MM"
  nivelIngles: NivelIngles
  modalidades: Modalidade[]
}

export interface Tecnologia {
  id: string
  nome: string
  categoria: string
}

// Endereço da API. Em desenvolvimento é "/api" (o Vite repassa para localhost:4000).
// Na publicação vem de VITE_API_URL; aceita só o domínio (ex.: "radar-api.onrender.com"),
// que é como o Render informa o endereço de outro serviço.
export function enderecoDaApi(valor: string | undefined): string {
  if (!valor) return '/api'
  const semBarraFinal = valor.replace(/\/+$/, '')
  return /^https?:\/\//.test(semBarraFinal) ? semBarraFinal : `https://${semBarraFinal}`
}

const BASE = enderecoDaApi(import.meta.env.VITE_API_URL as string | undefined)

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
  if (resposta.status === 204) return undefined as T // "sem conteúdo" (ex.: conta excluída)
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

export async function buscarCatalogo(): Promise<Tecnologia[]> {
  const dados = await requisitar<{ tecnologias: Tecnologia[] }>('/catalogo')
  return dados.tecnologias
}

export function buscarPerfil(token: string): Promise<Perfil> {
  return requisitar('/perfil', { token })
}

export function salvarPerfil(perfil: Perfil, token: string): Promise<Perfil> {
  return requisitar('/perfil', { metodo: 'PUT', corpo: perfil, token })
}

// Perfil "vazio" = a pessoa ainda não informou nada que influencie a nota.
export function perfilVazio(perfil: Perfil): boolean {
  return perfil.habilidades.length === 0 && perfil.formatura === null
}

// Baixa o arquivo com todos os dados da pessoa (direito de acesso da LGPD).
export async function baixarMeusDados(token: string): Promise<void> {
  const dados = await requisitar<unknown>('/conta/dados', { token })
  const arquivo = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(arquivo)
  const link = document.createElement('a')
  link.href = url
  link.download = 'meus-dados-radar-de-estagios.json'
  link.click()
  URL.revokeObjectURL(url)
}

export function excluirConta(senha: string, token: string): Promise<void> {
  return requisitar('/conta', { metodo: 'DELETE', corpo: { senha }, token })
}

export async function listarVagas(token: string | null): Promise<Vaga[]> {
  const dados = await requisitar<{ vagas: Vaga[] }>('/vagas?limite=100', { token })
  return dados.vagas
}

export function atualizarStatus(id: number, status: Status, token: string | null): Promise<Vaga> {
  return requisitar(`/vagas/${id}/status`, { metodo: 'PATCH', corpo: { status }, token })
}
