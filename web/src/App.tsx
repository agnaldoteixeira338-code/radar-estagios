import { useCallback, useEffect, useState } from 'react'
import { buscarUsuario, ErroApi, type Sessao } from './api'
import { apagarToken, lerToken, salvarToken } from './sessao'
import { CriarConta } from './telas/CriarConta'
import { Entrar } from './telas/Entrar'
import { AreaLogada } from './telas/AreaLogada'
import { Privacidade } from './telas/Privacidade'
import './App.css'

type Estado =
  | { tela: 'verificando' }
  | { tela: 'entrar'; aviso?: string }
  | { tela: 'criar-conta' }
  | { tela: 'privacidade'; voltarPara: 'entrar' | 'criar-conta' }
  | { tela: 'painel'; sessao: Sessao }
  | { tela: 'sem-conexao' }

export default function App() {
  // Se há um token salvo, começa verificando se ele ainda vale; senão vai direto ao login.
  const [estado, setEstado] = useState<Estado>(() => (lerToken() ? { tela: 'verificando' } : { tela: 'entrar' }))
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    if (estado.tela !== 'verificando') return
    const token = lerToken()
    // Sem token, trata como sessão inválida (401) para cair no mesmo caminho de "pedir login".
    const verificacao = token ? buscarUsuario(token) : Promise.reject(new ErroApi('Sem sessão', 401))
    verificacao
      .then((usuario) => setEstado({ tela: 'painel', sessao: { token: token!, usuario } }))
      .catch((e: ErroApi) => {
        if (e.status === 401) {
          apagarToken() // token vencido ou inválido: pede login de novo
          setEstado({ tela: 'entrar' })
        } else {
          setEstado({ tela: 'sem-conexao' })
        }
      })
  }, [estado.tela, tentativa])

  const iniciarSessao = useCallback((sessao: Sessao) => {
    salvarToken(sessao.token)
    setEstado({ tela: 'painel', sessao })
  }, [])

  const sair = useCallback(() => {
    apagarToken()
    setEstado({ tela: 'entrar' })
  }, [])

  const contaExcluida = useCallback(() => {
    apagarToken()
    setEstado({ tela: 'entrar', aviso: 'Sua conta foi excluída. Todos os seus dados foram apagados.' })
  }, [])

  switch (estado.tela) {
    case 'verificando':
      return <p className="carregando-tela sutil">Carregando…</p>
    case 'sem-conexao':
      return (
        <main className="tela-acesso">
          <div className="cartao-acesso">
            <p role="alert">Não foi possível conectar ao servidor.</p>
            <button
              type="button"
              className="botao-principal"
              onClick={() => {
                setTentativa((t) => t + 1)
                setEstado({ tela: 'verificando' })
              }}
            >
              Tentar de novo
            </button>
          </div>
        </main>
      )
    case 'entrar':
      return (
        <Entrar
          aviso={estado.aviso}
          aoEntrar={iniciarSessao}
          irParaCriarConta={() => setEstado({ tela: 'criar-conta' })}
          verPrivacidade={() => setEstado({ tela: 'privacidade', voltarPara: 'entrar' })}
        />
      )
    case 'criar-conta':
      return (
        <CriarConta
          aoCriarConta={iniciarSessao}
          irParaEntrar={() => setEstado({ tela: 'entrar' })}
          verPrivacidade={() => setEstado({ tela: 'privacidade', voltarPara: 'criar-conta' })}
        />
      )
    case 'privacidade': {
      const voltarPara = estado.voltarPara
      return <Privacidade aoVoltar={() => setEstado({ tela: voltarPara })} />
    }
    case 'painel':
      return <AreaLogada sessao={estado.sessao} aoSair={sair} aoExcluirConta={contaExcluida} />
  }
}
