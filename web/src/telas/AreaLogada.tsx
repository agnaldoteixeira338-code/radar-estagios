import { useEffect, useState } from 'react'
import { buscarPerfil, ErroApi, perfilVazio, type Sessao } from '../api'
import { Cabecalho, type Aba } from '../componentes/Cabecalho'
import { Painel } from './Painel'
import { TelaPerfil } from './TelaPerfil'

interface Props {
  sessao: Sessao
  aoSair: () => void
}

// Tudo o que aparece depois do login: cabeçalho com navegação + a aba escolhida.
// No primeiro acesso (perfil ainda vazio), abre direto em "Meu perfil".
export function AreaLogada({ sessao, aoSair }: Props) {
  const [aba, setAba] = useState<Aba | null>(null)
  const [primeiroAcesso, setPrimeiroAcesso] = useState(false)

  useEffect(() => {
    let ativo = true
    buscarPerfil(sessao.token)
      .then((perfil) => {
        if (!ativo) return
        const vazio = perfilVazio(perfil)
        setPrimeiroAcesso(vazio)
        setAba(vazio ? 'perfil' : 'vagas')
      })
      .catch((e: ErroApi) => {
        if (!ativo) return
        if (e.status === 401) aoSair()
        else setAba('vagas') // sem perfil carregado, as vagas ainda funcionam (com nota básica)
      })
    return () => {
      ativo = false
    }
  }, [sessao.token, aoSair])

  return (
    <div className="painel">
      <Cabecalho email={sessao.usuario.email} aba={aba ?? 'vagas'} aoMudarAba={setAba} aoSair={aoSair} />
      {aba === null && <p className="sutil">Carregando…</p>}
      {aba === 'vagas' && <Painel token={sessao.token} aoSair={aoSair} />}
      {aba === 'perfil' && (
        <TelaPerfil
          token={sessao.token}
          primeiroAcesso={primeiroAcesso}
          aoSair={aoSair}
          aoSalvar={() => {
            setPrimeiroAcesso(false)
            setAba('vagas')
          }}
        />
      )}
    </div>
  )
}
