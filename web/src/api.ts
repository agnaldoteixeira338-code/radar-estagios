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

const BASE = '/api'

async function lerResposta<T>(resposta: Response): Promise<T> {
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => null)
    throw new Error(corpo?.erro ?? `Erro ${resposta.status} ao falar com a API`)
  }
  return resposta.json() as Promise<T>
}

export async function listarVagas(): Promise<Vaga[]> {
  const dados = await lerResposta<{ vagas: Vaga[] }>(await fetch(`${BASE}/vagas?limite=100`))
  return dados.vagas
}

export async function atualizarStatus(id: number, status: Status): Promise<Vaga> {
  const resposta = await fetch(`${BASE}/vagas/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  return lerResposta<Vaga>(resposta)
}
