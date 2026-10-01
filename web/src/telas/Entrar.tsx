import { useState, type FormEvent } from 'react'
import { entrar, type Sessao } from '../api'

interface Props {
  aviso?: string
  aoEntrar: (sessao: Sessao) => void
  irParaCriarConta: () => void
  verPrivacidade: () => void
}

export function Entrar({ aviso, aoEntrar, irParaCriarConta, verPrivacidade }: Props) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (enviando) return
    if (!email.trim() || !senha) {
      setErro('Preencha e-mail e senha.')
      return
    }
    setErro(null)
    setEnviando(true)
    try {
      aoEntrar(await entrar(email.trim(), senha))
    } catch (e) {
      setErro((e as Error).message)
      setEnviando(false)
    }
  }

  return (
    <main className="tela-acesso">
      <form className="cartao-acesso" onSubmit={enviar} noValidate>
        <h1>Radar de Estágios</h1>
        <p className="sutil">Entre para ver as vagas mais compatíveis com você.</p>
        {aviso && (
          <p className="aviso-sucesso" role="status">
            {aviso}
          </p>
        )}

        <label>
          E-mail
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Senha
          <input type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
        </label>

        {erro && (
          <p className="erro-campo" role="alert">
            {erro}
          </p>
        )}

        <button type="submit" className="botao-principal" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>

        <p className="troca-tela">
          Ainda não tem conta?{' '}
          <button type="button" className="link" onClick={irParaCriarConta}>
            Criar conta
          </button>
        </p>
        <p className="troca-tela">
          <button type="button" className="link link-discreto" onClick={verPrivacidade}>
            Aviso de privacidade
          </button>
        </p>
      </form>
    </main>
  )
}
