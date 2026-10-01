interface Props {
  aoVoltar: () => void
}

// E-mail para assuntos de privacidade, definido na publicação (VITE_CONTATO_PRIVACIDADE).
const CONTATO = import.meta.env.VITE_CONTATO_PRIVACIDADE as string | undefined

export function Privacidade({ aoVoltar }: Props) {
  return (
    <main className="painel texto-legal">
      <button type="button" className="link" onClick={aoVoltar}>
        ← Voltar
      </button>
      <h1>Aviso de privacidade</h1>
      <p className="sutil">Última atualização: 01/10/2026</p>

      <h2>Quais dados guardamos</h2>
      <ul>
        <li>
          <strong>Conta:</strong> seu e-mail e a senha em forma de hash (um resumo criptográfico que não pode ser
          revertido; nem nós conseguimos ver sua senha).
        </li>
        <li>
          <strong>Perfil:</strong> as tecnologias que você marcou, a previsão de formatura, o nível de inglês e as
          modalidades que aceita.
        </li>
        <li>
          <strong>Candidaturas:</strong> o status que você marca em cada vaga (enviada, entrevista etc.).
        </li>
      </ul>
      <p>
        Não pedimos nome, CPF, telefone nem currículo. Não usamos cookies de rastreamento nem ferramentas de
        análise de navegação.
      </p>

      <h2>Para que usamos</h2>
      <p>
        Só para fazer o Radar funcionar para você: entrar na sua conta, calcular a nota de cada vaga com base no
        seu perfil e guardar o status das suas candidaturas. Não vendemos nem compartilhamos seus dados com
        empresas ou recrutadores. A base legal é a execução do serviço que você pediu ao criar a conta (LGPD, art.
        7º, V).
      </p>

      <h2>Onde ficam e por quanto tempo</h2>
      <p>
        No banco de dados PostgreSQL do serviço Neon, em servidores da AWS em São Paulo (Brasil), com conexão
        criptografada. Ficam guardados enquanto sua conta existir. Ao sair da conta, a sessão é apagada do seu
        navegador.
      </p>

      <h2>As vagas</h2>
      <p>
        As vagas são coletadas de páginas públicas da Gupy. O Radar mostra título, empresa, local e o link para a
        vaga original; a candidatura é sempre feita no site da empresa.
      </p>

      <h2>Seus direitos</h2>
      <ul>
        <li>
          <strong>Ver seus dados:</strong> em Meu perfil → “Baixar meus dados”, você recebe um arquivo com tudo o que
          guardamos sobre você.
        </li>
        <li>
          <strong>Corrigir:</strong> altere seu perfil a qualquer momento em Meu perfil.
        </li>
        <li>
          <strong>Excluir:</strong> em Meu perfil → “Excluir minha conta”. A exclusão é imediata e definitiva: conta,
          perfil e candidaturas são apagados.
        </li>
      </ul>
      {CONTATO && (
        <p>
          Dúvidas sobre privacidade: <a href={`mailto:${CONTATO}`}>{CONTATO}</a>
        </p>
      )}
    </main>
  )
}
