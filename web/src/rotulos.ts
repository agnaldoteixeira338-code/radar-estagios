import type { Modalidade, Status } from './api'

export const ROTULO_MODALIDADE: Record<Modalidade, string> = {
  presencial: 'Presencial',
  hibrido: 'Híbrido',
  remoto: 'Remoto',
}

export const ROTULO_STATUS: Record<Status, string> = {
  pendente: 'Pendente',
  enviada: 'Enviada',
  entrevista: 'Entrevista',
  recusada: 'Recusada',
  sem_interesse: 'Sem interesse',
}

// Faixa de cor da nota: alta (70+), média (50 a 69) ou baixa.
export function faixaDaNota(nota: number): 'alta' | 'media' | 'baixa' {
  if (nota >= 70) return 'alta'
  if (nota >= 50) return 'media'
  return 'baixa'
}
