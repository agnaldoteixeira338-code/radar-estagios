import type { Status, Vaga } from '../api'
import { faixaDaNota, linkSeguro, ROTULO_MODALIDADE, ROTULO_STATUS } from '../rotulos'

interface Props {
  vaga: Vaga
  aoMudarStatus: (id: number, status: Status) => void
}

// "2026-09-17" -> "17/09/2026" (sem converter fuso horário, que poderia mudar o dia).
function formatarData(data: string) {
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

export function CartaoVaga({ vaga, aoMudarStatus }: Props) {
  const nota = vaga.notaCompatibilidade ?? 0
  const local = [
    vaga.cidade,
    vaga.modalidade && ROTULO_MODALIDADE[vaga.modalidade],
    vaga.publicadaEm && `publicada em ${formatarData(vaga.publicadaEm)}`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <article className="vaga" aria-label={vaga.titulo}>
      <div className={`nota nota-${faixaDaNota(nota)}`} title="Nota de compatibilidade">
        {nota}
      </div>

      <div className="conteudo">
        <h3>{vaga.titulo}</h3>
        <p className="detalhe">
          {vaga.empresa}
          {local && ` · ${local}`}
        </p>

        <div className="tags">
          {vaga.habilidadesEncontradas.map((h) => (
            <span key={h} className="tag tag-tem">
              {h}
            </span>
          ))}
          {vaga.requisitosFaltando.map((r) => (
            <span key={r} className="tag tag-falta">
              falta {r}
            </span>
          ))}
          {vaga.diferenciaisFaltando.map((d) => (
            <span key={d} className="tag tag-diferencial" title="Diferencial: não tira pontos">
              diferencial {d}
            </span>
          ))}
        </div>

        {vaga.alertas.map((a) => (
          <p key={a} className="alerta">
            ⚠ {a}
          </p>
        ))}
      </div>

      <div className="acoes">
        {vaga.motivoEliminacao ? (
          <p className="eliminada">Eliminada: {vaga.motivoEliminacao.replace(/^Exige/, 'exige')}</p>
        ) : (
          <select
            aria-label={`Status da candidatura em ${vaga.titulo}`}
            value={vaga.status}
            onChange={(e) => aoMudarStatus(vaga.id, e.target.value as Status)}
          >
            {(Object.keys(ROTULO_STATUS) as Status[]).map((s) => (
              <option key={s} value={s}>
                {ROTULO_STATUS[s]}
              </option>
            ))}
          </select>
        )}
        {linkSeguro(vaga.link) ? (
          <a href={linkSeguro(vaga.link)!} target="_blank" rel="noopener noreferrer">
            Abrir vaga ↗
          </a>
        ) : (
          <span className="sutil">Link indisponível</span>
        )}
      </div>
    </article>
  )
}
