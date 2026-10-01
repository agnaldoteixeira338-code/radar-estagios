import { useEffect, useState, type FormEvent } from 'react'
import {
  buscarCatalogo,
  buscarPerfil,
  ErroApi,
  salvarPerfil,
  type Modalidade,
  type NivelIngles,
  type Perfil,
  type Tecnologia,
} from '../api'
import { ROTULO_MODALIDADE } from '../rotulos'

interface Props {
  token: string
  primeiroAcesso: boolean
  aoSalvar: () => void
  aoSair: () => void
}

const NIVEIS: Array<{ id: NivelIngles; rotulo: string }> = [
  { id: 'basico', rotulo: 'Básico' },
  { id: 'intermediario', rotulo: 'Intermediário' },
  { id: 'avancado', rotulo: 'Avançado' },
  { id: 'fluente', rotulo: 'Fluente' },
]
const MODALIDADES: Modalidade[] = ['presencial', 'hibrido', 'remoto']

// Agrupa as tecnologias por categoria, mantendo a ordem em que aparecem no catálogo.
function porCategoria(catalogo: Tecnologia[]): Array<[string, Tecnologia[]]> {
  const grupos = new Map<string, Tecnologia[]>()
  for (const t of catalogo) grupos.set(t.categoria, [...(grupos.get(t.categoria) ?? []), t])
  return [...grupos]
}

export function TelaPerfil({ token, primeiroAcesso, aoSalvar, aoSair }: Props) {
  const [catalogo, setCatalogo] = useState<Tecnologia[] | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    let ativo = true
    Promise.all([buscarCatalogo(), buscarPerfil(token)])
      .then(([cat, p]) => {
        if (!ativo) return
        setCatalogo(cat)
        setPerfil(p)
      })
      .catch((e: ErroApi) => {
        if (!ativo) return
        if (e.status === 401) aoSair()
        else setErro(`Não foi possível carregar o perfil. ${e.message}`)
      })
    return () => {
      ativo = false
    }
  }, [token, aoSair])

  if (!catalogo || !perfil) {
    return erro ? (
      <p className="erro" role="alert">
        {erro}
      </p>
    ) : (
      <p className="sutil">Carregando perfil…</p>
    )
  }

  const alternar = <T,>(lista: T[], item: T) => (lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item])

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!perfil || salvando) return
    if (perfil.modalidades.length === 0) {
      setErro('Escolha pelo menos uma modalidade.')
      return
    }
    setErro(null)
    setSalvando(true)
    try {
      await salvarPerfil(perfil, token)
      aoSalvar()
    } catch (e) {
      if ((e as ErroApi).status === 401) aoSair()
      else setErro(`Não foi possível salvar o perfil. ${(e as Error).message}`)
      setSalvando(false)
    }
  }

  return (
    <form className="tela-perfil" onSubmit={enviar} noValidate aria-label="Meu perfil">
      {primeiroAcesso ? (
        <p className="boas-vindas">
          Bem-vindo! Marque o que você sabe e suas preferências. É com isso que o Radar calcula a nota de cada vaga
          para você.
        </p>
      ) : (
        <p className="sutil">Mudou algo? Atualize aqui e as notas das vagas são recalculadas na hora.</p>
      )}

      <section className="bloco" aria-labelledby="titulo-tecnologias">
        <h2 id="titulo-tecnologias">O que você sabe</h2>
        <p className="sutil">{perfil.habilidades.length} selecionadas</p>
        {porCategoria(catalogo).map(([categoria, tecnologias]) => (
          <fieldset key={categoria} className="grupo">
            <legend>{categoria}</legend>
            <div className="opcoes-perfil">
              {tecnologias.map((t) => (
                <label key={t.id} className="opcao">
                  <input
                    type="checkbox"
                    checked={perfil.habilidades.includes(t.id)}
                    onChange={() => setPerfil({ ...perfil, habilidades: alternar(perfil.habilidades, t.id) })}
                  />
                  {t.nome}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </section>

      <section className="bloco" aria-labelledby="titulo-preferencias">
        <h2 id="titulo-preferencias">Sua situação</h2>

        <div className="campo-perfil">
          <label htmlFor="formatura">Previsão de formatura</label>
          <input
            id="formatura"
            type="month"
            value={perfil.formatura ?? ''}
            onChange={(e) => setPerfil({ ...perfil, formatura: e.target.value || null })}
            aria-describedby="dica-formatura"
          />
          <span id="dica-formatura" className="dica">
            Opcional. Usada para descartar vagas que exigem outra data de formatura.
          </span>
        </div>

        <div className="campo-perfil">
          <label htmlFor="ingles">Nível de inglês</label>
          <select
            id="ingles"
            value={perfil.nivelIngles}
            onChange={(e) => setPerfil({ ...perfil, nivelIngles: e.target.value as NivelIngles })}
          >
            {NIVEIS.map((n) => (
              <option key={n.id} value={n.id}>
                {n.rotulo}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="grupo">
          <legend>Modalidades que você aceita</legend>
          <div className="opcoes-perfil">
            {MODALIDADES.map((m) => (
              <label key={m} className="opcao">
                <input
                  type="checkbox"
                  checked={perfil.modalidades.includes(m)}
                  onChange={() => setPerfil({ ...perfil, modalidades: alternar(perfil.modalidades, m) })}
                />
                {ROTULO_MODALIDADE[m]}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}

      <button type="submit" className="botao-principal" disabled={salvando}>
        {salvando ? 'Salvando…' : 'Salvar perfil e ver vagas'}
      </button>
    </form>
  )
}
