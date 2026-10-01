import { useState, type FormEvent } from 'react'
import { criarConta, type Sessao } from '../api'
import { SENHA_MINIMO, validarNovaConta } from './validacao'

interface Props {
  aoCriarConta: (sessao: Sessao) => void
  irParaEntrar: () => void
  verPrivacidade: () => void
}

export function CriarConta({ aoCriarConta, irParaEntrar, verPrivacidade }: Props) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (enviando) return
    const problema = validarNovaConta(email, senha, confirmacao)
    if (problema) {
      setErro(problema)
      return
    }
    setErro(null)
    setEnviando(true)
    try {
      aoCriarConta(await criarConta(email.trim(), senha))
    } catch (e) {
      setErro((e as Error).message)
      setEnviando(false)
    }
  }

  return (
    <main className="tela-acesso">
      <form className="cartao-acesso" onSubmit={enviar} noValidate>
        <h1>Criar conta</h1>
        <p className="sutil">Leva menos de um minuto.</p>

        <label>
          E-mail
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <div className="campo">
          <label htmlFor="nova-senha">Senha</label>
          <input
            id="nova-senha"
            type="password"
            autoComplete="new-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            aria-describedby="dica-senha"
          />
          {/* A dica fica fora do rótulo: leitores de tela anunciam "Senha" e, depois, a dica. */}
          <span id="dica-senha" className="dica">
            Mínimo de {SENHA_MINIMO} caracteres.
          </span>
        </div>
        <label>
          Confirmar senha
          <input type="password" autoComplete="new-password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} />
        </label>

        {erro && (
          <p className="erro-campo" role="alert">
            {erro}
          </p>
        )}

        <p className="dica">
          Ao criar a conta, você concorda com o{' '}
          <button type="button" className="link" onClick={verPrivacidade}>
            Aviso de privacidade
          </button>
          .
        </p>

        <button type="submit" className="botao-principal" disabled={enviando}>
          {enviando ? 'Criando conta…' : 'Criar conta'}
        </button>

        <p className="troca-tela">
          Já tem conta?{' '}
          <button type="button" className="link" onClick={irParaEntrar}>
            Entrar
          </button>
        </p>
      </form>
    </main>
  )
}
