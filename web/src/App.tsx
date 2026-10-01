import { useEffect, useState } from 'react'
import { atualizarStatus, listarVagas, type Status, type Vaga } from './api'
import { CartaoVaga } from './componentes/CartaoVaga'
import { Filtros, type FiltroModalidade } from './componentes/Filtros'
import { Resumo } from './componentes/Resumo'
import './App.css'

export default function App() {
  const [vagas, setVagas] = useState<Vaga[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [modalidade, setModalidade] = useState<FiltroModalidade>('todas')
  const [notaMinima, setNotaMinima] = useState(40)

  useEffect(() => {
    listarVagas()
      .then(setVagas)
      .catch((e: Error) => setErro(`Não foi possível carregar as vagas. ${e.message}`))
      .finally(() => setCarregando(false))
  }, [])

  // Atualização "otimista": muda na tela na hora e, se a API falhar, volta ao valor anterior.
  async function mudarStatus(id: number, status: Status) {
    const anterior = vagas.find((v) => v.id === id)?.status
    setVagas((atuais) => atuais.map((v) => (v.id === id ? { ...v, status } : v)))
    setErro(null)
    try {
      await atualizarStatus(id, status)
    } catch (e) {
      if (anterior) {
        setVagas((atuais) => atuais.map((v) => (v.id === id ? { ...v, status: anterior } : v)))
      }
      setErro(`Não foi possível salvar o status. ${(e as Error).message}`)
    }
  }

  // Vagas eliminadas por regra só aparecem com a nota mínima em 0.
  const visiveis = vagas.filter(
    (v) =>
      (modalidade === 'todas' || v.modalidade === modalidade) &&
      (v.notaCompatibilidade ?? 0) >= notaMinima &&
      (!v.motivoEliminacao || notaMinima === 0),
  )

  return (
    <main className="painel">
      <header className="topo">
        <h1>Radar de Estágios</h1>
        {!carregando && <span className="sutil">{vagas.length} vagas de TI no banco</span>}
      </header>

      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}

      {carregando ? (
        <p className="sutil">Carregando vagas…</p>
      ) : (
        <>
          <Resumo vagas={vagas} />
          <Filtros
            modalidade={modalidade}
            notaMinima={notaMinima}
            aoMudarModalidade={setModalidade}
            aoMudarNotaMinima={setNotaMinima}
          />
          <p className="sutil contagem">
            Mostrando {visiveis.length} de {vagas.length}
          </p>
          {visiveis.length === 0 ? (
            <p className="sutil">Nenhuma vaga com esses filtros. Tente baixar a nota mínima.</p>
          ) : (
            <section aria-label="Vagas">
              {visiveis.map((vaga) => (
                <CartaoVaga key={vaga.id} vaga={vaga} aoMudarStatus={mudarStatus} />
              ))}
            </section>
          )}
        </>
      )}
    </main>
  )
}
