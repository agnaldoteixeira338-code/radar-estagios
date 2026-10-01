import type { Vaga } from '../api'

interface Props {
  vagas: Vaga[]
}

// Números do topo do painel, calculados sobre todas as vagas (sem filtros).
export function Resumo({ vagas }: Props) {
  const boas = vagas.filter((v) => (v.notaCompatibilidade ?? 0) >= 60).length
  const enviadas = vagas.filter((v) => v.status === 'enviada' || v.status === 'entrevista').length
  const eliminadas = vagas.filter((v) => v.motivoEliminacao).length

  return (
    <section className="resumo" aria-label="Resumo">
      <div className="metrica">
        <span>Vagas de TI</span>
        <strong>{vagas.length}</strong>
      </div>
      <div className="metrica">
        <span>Nota 60 ou mais</span>
        <strong className="texto-sucesso">{boas}</strong>
      </div>
      <div className="metrica">
        <span>Candidaturas enviadas</span>
        <strong>{enviadas}</strong>
      </div>
      <div className="metrica">
        <span>Eliminadas por regra</span>
        <strong className="texto-perigo">{eliminadas}</strong>
      </div>
    </section>
  )
}
