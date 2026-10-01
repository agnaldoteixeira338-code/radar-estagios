export type Aba = 'vagas' | 'perfil'

interface Props {
  email: string
  aba: Aba
  aoMudarAba: (aba: Aba) => void
  aoSair: () => void
}

const ABAS: Array<{ id: Aba; rotulo: string }> = [
  { id: 'vagas', rotulo: 'Vagas' },
  { id: 'perfil', rotulo: 'Meu perfil' },
]

export function Cabecalho({ email, aba, aoMudarAba, aoSair }: Props) {
  return (
    <header className="topo">
      <div className="marca">
        <h1>Radar de Estágios</h1>
        <nav aria-label="Principal" className="abas">
          {ABAS.map(({ id, rotulo }) => (
            <button
              key={id}
              type="button"
              className={id === aba ? 'aba ativa' : 'aba'}
              aria-current={id === aba ? 'page' : undefined}
              onClick={() => aoMudarAba(id)}
            >
              {rotulo}
            </button>
          ))}
        </nav>
      </div>
      <div className="conta">
        <span className="sutil">{email}</span>
        <button type="button" className="botao-secundario" onClick={aoSair}>
          Sair
        </button>
      </div>
    </header>
  )
}
