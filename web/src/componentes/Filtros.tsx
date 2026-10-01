import type { Modalidade } from '../api'
import { ROTULO_MODALIDADE } from '../rotulos'

export type FiltroModalidade = Modalidade | 'todas'

interface Props {
  modalidade: FiltroModalidade
  notaMinima: number
  aoMudarModalidade: (modalidade: FiltroModalidade) => void
  aoMudarNotaMinima: (nota: number) => void
}

const OPCOES: FiltroModalidade[] = ['todas', 'presencial', 'hibrido', 'remoto']

export function Filtros({ modalidade, notaMinima, aoMudarModalidade, aoMudarNotaMinima }: Props) {
  return (
    <div className="filtros">
      <div className="opcoes" role="group" aria-label="Modalidade">
        {OPCOES.map((opcao) => (
          <button
            key={opcao}
            type="button"
            className={opcao === modalidade ? 'chip ativo' : 'chip'}
            aria-pressed={opcao === modalidade}
            onClick={() => aoMudarModalidade(opcao)}
          >
            {opcao === 'todas' ? 'Todas' : ROTULO_MODALIDADE[opcao]}
          </button>
        ))}
      </div>
      <label className="nota-minima">
        Nota mínima
        <input
          type="range"
          min={0}
          max={90}
          step={5}
          value={notaMinima}
          onChange={(e) => aoMudarNotaMinima(Number(e.target.value))}
        />
        <strong aria-live="polite">{notaMinima}</strong>
      </label>
    </div>
  )
}
