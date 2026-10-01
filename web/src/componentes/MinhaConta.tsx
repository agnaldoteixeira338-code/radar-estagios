import { useState, type FormEvent } from 'react'
import { baixarMeusDados, ErroApi, excluirConta } from '../api'

interface Props {
  token: string
  email: string
  aoExcluir: () => void
  aoSair: () => void
  verPrivacidade: () => void
}

// Direitos da pessoa sobre os próprios dados (LGPD): baixar tudo e excluir a conta.
export function MinhaConta({ token, email, aoExcluir, aoSair, verPrivacidade }: Props) {
  const [confirmando, setConfirmando] = useState(false)
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  async function baixar() {
    setErro(null)
    try {
      await baixarMeusDados(token)
    } catch (e) {
      if ((e as ErroApi).status === 401) aoSair()
      else setErro(`Não foi possível baixar seus dados. ${(e as Error).message}`)
    }
  }

  async function excluir(evento: FormEvent) {
    evento.preventDefault()
    if (ocupado) return
    if (!senha) {
      setErro('Digite sua senha para confirmar.')
      return
    }
    setErro(null)
    setOcupado(true)
    try {
      await excluirConta(senha, token)
      aoExcluir()
    } catch (e) {
      if ((e as ErroApi).status === 401) aoSair()
      else setErro((e as Error).message)
      setOcupado(false)
    }
  }

  return (
    <section className="bloco" aria-labelledby="titulo-conta">
      <h2 id="titulo-conta">Sua conta e privacidade</h2>
      <p className="sutil">
        Conta: {email} ·{' '}
        <button type="button" className="link" onClick={verPrivacidade}>
          Aviso de privacidade
        </button>
      </p>

      <div className="acoes-conta">
        <button type="button" className="botao-secundario" onClick={baixar}>
          Baixar meus dados
        </button>
        {!confirmando && (
          <button type="button" className="botao-perigo" onClick={() => setConfirmando(true)}>
            Excluir minha conta
          </button>
        )}
      </div>

      {confirmando && (
        <form className="confirmar-exclusao" onSubmit={excluir} noValidate>
          <p>
            <strong>Isso apaga de vez</strong> sua conta, seu perfil e o status das suas candidaturas. Não dá para
            desfazer.
          </p>
          <div className="campo-perfil">
            <label htmlFor="senha-exclusao">Digite sua senha para confirmar</label>
            <input
              id="senha-exclusao"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>
          <div className="acoes-conta">
            <button type="submit" className="botao-perigo" disabled={ocupado}>
              {ocupado ? 'Excluindo…' : 'Excluir definitivamente'}
            </button>
            <button
              type="button"
              className="botao-secundario"
              onClick={() => {
                setConfirmando(false)
                setSenha('')
                setErro(null)
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}
    </section>
  )
}
