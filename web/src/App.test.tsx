import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Vaga } from './api'
import App from './App'
import { validarNovaConta } from './telas/validacao'

const CHAVE_TOKEN = 'radar-estagios:token'
const USUARIO = { id: 1, nome: null, email: 'agnaldo@exemplo.com' }

const CATALOGO = [
  { id: 'javascript', nome: 'JavaScript', categoria: 'Linguagens' },
  { id: 'python', nome: 'Python', categoria: 'Linguagens' },
  { id: 'react', nome: 'React', categoria: 'Front-end' },
  { id: 'sql', nome: 'SQL', categoria: 'Dados' },
]

const PERFIL_PREENCHIDO = {
  habilidades: ['react', 'sql'],
  formatura: '2028-01',
  nivelIngles: 'intermediario',
  modalidades: ['presencial', 'hibrido'],
}

const PERFIL_VAZIO = { habilidades: [], formatura: null, nivelIngles: 'basico', modalidades: ['presencial', 'hibrido', 'remoto'] }

function vaga(sobrescrever: Partial<Vaga>): Vaga {
  return {
    id: 1,
    titulo: 'Estágio em Desenvolvimento',
    empresa: 'Empresa A',
    cidade: 'São Paulo',
    estado: 'SP',
    modalidade: 'presencial',
    link: 'https://exemplo.gupy.io/job/1',
    publicadaEm: '2026-10-01',
    notaCompatibilidade: 80,
    habilidadesEncontradas: ['React', 'SQL'],
    requisitosFaltando: [],
    diferenciaisFaltando: [],
    alertas: [],
    motivoEliminacao: null,
    status: 'pendente',
    ...sobrescrever,
  }
}

const VAGAS: Vaga[] = [
  vaga({ id: 1, titulo: 'Vaga Full Stack', notaCompatibilidade: 81, modalidade: 'hibrido' }),
  vaga({ id: 2, titulo: 'Vaga de Dados', notaCompatibilidade: 65, requisitosFaltando: ['Power BI'] }),
  vaga({ id: 3, titulo: 'Vaga Android', notaCompatibilidade: 7, alertas: ['Exige inglês avançado/fluente'] }),
  vaga({ id: 4, titulo: 'Vaga Eliminada', notaCompatibilidade: 0, motivoEliminacao: 'Exige formatura a partir de 12/2028' }),
]

function json(corpo: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } }))
}

type Rota = (url: string, init?: RequestInit) => Promise<Response> | undefined

// Simula a API. Cada teste pode trocar o comportamento de uma rota; o resto usa o padrão.
function simularApi(sobrescrever: Record<string, Rota> = {}) {
  const padrao: Record<string, Rota> = {
    'GET /api/auth/eu': () => json(USUARIO),
    'POST /api/auth/login': () => json({ token: 'token-novo', usuario: USUARIO }),
    'POST /api/auth/cadastro': () => json({ token: 'token-novo', usuario: USUARIO }, 201),
    'GET /api/vagas': () => json({ total: VAGAS.length, vagas: structuredClone(VAGAS) }),
    'GET /api/catalogo': () => json({ tecnologias: CATALOGO }),
    'GET /api/perfil': () => json(PERFIL_PREENCHIDO),
    'PUT /api/perfil': (_u, init) => json(JSON.parse(String(init?.body))),
    'GET /api/conta/dados': () => json({ conta: USUARIO, perfil: PERFIL_PREENCHIDO, candidaturas: [] }),
    'DELETE /api/conta': () => Promise.resolve(new Response(null, { status: 204 })),
    'PATCH /api/vagas': (_u, init) => json({ ...VAGAS[0], ...JSON.parse(String(init?.body)) }),
  }
  const rotas = { ...padrao, ...sobrescrever }
  return vi.spyOn(globalThis, 'fetch').mockImplementation((entrada, init) => {
    const url = String(entrada)
    const metodo = init?.method ?? 'GET'
    const chave = Object.keys(rotas).find((k) => {
      const [m, caminho] = k.split(' ')
      return m === metodo && url.startsWith(caminho)
    })
    const resposta = chave ? rotas[chave](url, init) : undefined
    return resposta ?? json({ erro: `rota não simulada: ${metodo} ${url}` }, 500)
  })
}

function logado() {
  localStorage.setItem(CHAVE_TOKEN, 'token-salvo')
}

beforeEach(() => localStorage.clear())

describe('Entrar', () => {
  it('sem sessão, mostra a tela de login com e-mail, senha e o link para criar conta', () => {
    simularApi()
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Radar de Estágios' })).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Criar conta' })).toBeInTheDocument()
  })

  it('entra, guarda a sessão e abre o painel com o e-mail da pessoa', async () => {
    const fetchSimulado = simularApi()
    render(<App />)

    await userEvent.type(screen.getByLabelText('E-mail'), ' agnaldo@exemplo.com ')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha-forte-123')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('agnaldo@exemplo.com')).toBeInTheDocument()
    expect(localStorage.getItem(CHAVE_TOKEN)).toBe('token-novo')
    expect(fetchSimulado).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({ body: JSON.stringify({ email: 'agnaldo@exemplo.com', senha: 'senha-forte-123' }) }),
    )
  })

  it('mostra o erro da API quando e-mail ou senha estão errados', async () => {
    simularApi({ 'POST /api/auth/login': () => json({ erro: 'E-mail ou senha incorretos' }, 401) })
    render(<App />)

    await userEvent.type(screen.getByLabelText('E-mail'), 'agnaldo@exemplo.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'errada-123')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos')
    expect(localStorage.getItem(CHAVE_TOKEN)).toBeNull()
  })

  it('pede para preencher e-mail e senha sem chamar a API', async () => {
    const fetchSimulado = simularApi()
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Preencha e-mail e senha.')
    expect(fetchSimulado).not.toHaveBeenCalled()
  })

  it('avisa quando o servidor está fora do ar', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
    render(<App />)

    await userEvent.type(screen.getByLabelText('E-mail'), 'agnaldo@exemplo.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha-forte-123')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar ao servidor')
  })
})

describe('Criar conta', () => {
  async function abrirCriarConta() {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
  }

  it('pede só e-mail, senha e confirmar senha', async () => {
    simularApi()
    await abrirCriarConta()

    expect(screen.getByRole('heading', { name: 'Criar conta' })).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirmar senha')).toBeInTheDocument()
    expect(screen.queryByLabelText(/nome/i)).not.toBeInTheDocument()
    // A dica de tamanho da senha fica ligada ao campo, sem fazer parte do nome dele.
    expect(screen.getByLabelText('Senha')).toHaveAccessibleDescription('Mínimo de 8 caracteres.')
  })

  it.each([
    ['sem-arroba', 'senha-forte-123', 'senha-forte-123', 'Digite um e-mail válido.'],
    ['a@b.com', 'curta', 'curta', 'A senha precisa ter pelo menos 8 caracteres.'],
    ['a@b.com', 'senha-forte-123', 'senha-diferente', 'As senhas não são iguais.'],
  ])('valida antes de enviar: %s / %s / %s', (email, senha, confirmacao, mensagem) => {
    expect(validarNovaConta(email, senha, confirmacao)).toBe(mensagem)
  })

  it('não chama a API quando as senhas são diferentes', async () => {
    const fetchSimulado = simularApi()
    await abrirCriarConta()

    await userEvent.type(screen.getByLabelText('E-mail'), 'novo@exemplo.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha-forte-123')
    await userEvent.type(screen.getByLabelText('Confirmar senha'), 'senha-forte-124')
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(screen.getByRole('alert')).toHaveTextContent('As senhas não são iguais.')
    expect(fetchSimulado).not.toHaveBeenCalled()
  })

  it('cria a conta enviando só e-mail e senha e já entra no painel', async () => {
    const fetchSimulado = simularApi()
    await abrirCriarConta()

    await userEvent.type(screen.getByLabelText('E-mail'), 'novo@exemplo.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha-forte-123')
    await userEvent.type(screen.getByLabelText('Confirmar senha'), 'senha-forte-123')
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByRole('button', { name: 'Sair' })).toBeInTheDocument()
    expect(fetchSimulado).toHaveBeenCalledWith(
      '/api/auth/cadastro',
      expect.objectContaining({ body: JSON.stringify({ email: 'novo@exemplo.com', senha: 'senha-forte-123' }) }),
    )
  })

  it('mostra quando o e-mail já tem conta', async () => {
    simularApi({ 'POST /api/auth/cadastro': () => json({ erro: 'Já existe uma conta com este e-mail' }, 409) })
    await abrirCriarConta()

    await userEvent.type(screen.getByLabelText('E-mail'), 'agnaldo@exemplo.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha-forte-123')
    await userEvent.type(screen.getByLabelText('Confirmar senha'), 'senha-forte-123')
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Já existe uma conta com este e-mail')
  })

  it('volta para a tela de login pelo link "Entrar"', async () => {
    simularApi()
    await abrirCriarConta()

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByRole('heading', { name: 'Radar de Estágios' })).toBeInTheDocument()
  })
})

describe('Sessão', () => {
  it('com sessão salva e válida, abre direto o painel', async () => {
    logado()
    simularApi()
    render(<App />)

    expect(await screen.findByText('agnaldo@exemplo.com')).toBeInTheDocument()
  })

  it('com sessão vencida, apaga o token e mostra o login', async () => {
    logado()
    simularApi({ 'GET /api/auth/eu': () => json({ erro: 'Faça login para continuar' }, 401) })
    render(<App />)

    expect(await screen.findByLabelText('E-mail')).toBeInTheDocument()
    expect(localStorage.getItem(CHAVE_TOKEN)).toBeNull()
  })

  it('sem conexão, mantém a sessão e oferece tentar de novo', async () => {
    logado()
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
    render(<App />)

    expect(await screen.findByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
    expect(localStorage.getItem(CHAVE_TOKEN)).toBe('token-salvo')
  })

  it('"Sair" apaga a sessão e volta ao login', async () => {
    logado()
    simularApi()
    render(<App />)

    await userEvent.click(await screen.findByRole('button', { name: 'Sair' }))

    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(localStorage.getItem(CHAVE_TOKEN)).toBeNull()
  })

  it('envia o token nas chamadas do painel', async () => {
    logado()
    const fetchSimulado = simularApi()
    render(<App />)
    await screen.findByText('Vaga Full Stack')

    expect(fetchSimulado).toHaveBeenCalledWith(
      '/api/vagas?limite=100',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer token-salvo' }) }),
    )
  })
})

describe('Meu perfil', () => {
  beforeEach(logado)

  it('no primeiro acesso (perfil vazio) abre direto o perfil com as boas-vindas', async () => {
    simularApi({ 'GET /api/perfil': () => json(PERFIL_VAZIO) })
    render(<App />)

    expect(await screen.findByText(/Bem-vindo! Marque o que você sabe/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Meu perfil' })).toHaveAttribute('aria-current', 'page')
  })

  it('com perfil preenchido abre nas vagas, e a aba "Meu perfil" mostra o que está salvo', async () => {
    simularApi()
    render(<App />)
    await screen.findByText('Vaga Full Stack')

    await userEvent.click(screen.getByRole('button', { name: 'Meu perfil' }))

    const linguagens = await screen.findByRole('group', { name: 'Linguagens' })
    expect(within(linguagens).getByRole('checkbox', { name: 'Python' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'React' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'SQL' })).toBeChecked()
    expect(screen.getByLabelText('Previsão de formatura')).toHaveValue('2028-01')
    expect(screen.getByLabelText('Nível de inglês')).toHaveValue('intermediario')
    expect(screen.getByRole('checkbox', { name: 'Remoto' })).not.toBeChecked()
    expect(screen.getByText('2 selecionadas')).toBeInTheDocument()
  })

  it('salva as mudanças e volta para as vagas', async () => {
    const fetchSimulado = simularApi()
    render(<App />)
    await screen.findByText('Vaga Full Stack')
    await userEvent.click(screen.getByRole('button', { name: 'Meu perfil' }))

    await userEvent.click(await screen.findByRole('checkbox', { name: 'Python' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'React' }))
    await userEvent.selectOptions(screen.getByLabelText('Nível de inglês'), 'avancado')
    await userEvent.click(screen.getByRole('checkbox', { name: 'Remoto' }))
    await userEvent.click(screen.getByRole('button', { name: 'Salvar perfil e ver vagas' }))

    const put = fetchSimulado.mock.calls.find(([, init]) => init?.method === 'PUT')
    expect(put?.[0]).toBe('/api/perfil')
    expect(JSON.parse(String(put?.[1]?.body))).toEqual({
      habilidades: ['sql', 'python'],
      formatura: '2028-01',
      nivelIngles: 'avancado',
      modalidades: ['presencial', 'hibrido', 'remoto'],
    })
    expect(await screen.findByText('Vaga Full Stack')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Vagas' })).toHaveAttribute('aria-current', 'page')
  })

  it('formatura apagada é enviada como null (opcional)', async () => {
    const fetchSimulado = simularApi()
    render(<App />)
    await screen.findByText('Vaga Full Stack')
    await userEvent.click(screen.getByRole('button', { name: 'Meu perfil' }))

    fireEvent.change(await screen.findByLabelText('Previsão de formatura'), { target: { value: '' } })
    await userEvent.click(screen.getByRole('button', { name: 'Salvar perfil e ver vagas' }))

    const put = fetchSimulado.mock.calls.find(([, init]) => init?.method === 'PUT')
    expect(JSON.parse(String(put?.[1]?.body)).formatura).toBeNull()
  })

  it('exige pelo menos uma modalidade, sem chamar a API', async () => {
    const fetchSimulado = simularApi()
    render(<App />)
    await screen.findByText('Vaga Full Stack')
    await userEvent.click(screen.getByRole('button', { name: 'Meu perfil' }))

    await userEvent.click(await screen.findByRole('checkbox', { name: 'Presencial' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Híbrido' }))
    await userEvent.click(screen.getByRole('button', { name: 'Salvar perfil e ver vagas' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Escolha pelo menos uma modalidade.')
    expect(fetchSimulado.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(false)
  })

  it('mostra o erro e continua no perfil quando a API não salva', async () => {
    simularApi({ 'PUT /api/perfil': () => json({ erro: 'habilidades desconhecidas: cobol' }, 400) })
    render(<App />)
    await screen.findByText('Vaga Full Stack')
    await userEvent.click(screen.getByRole('button', { name: 'Meu perfil' }))

    await userEvent.click(await screen.findByRole('button', { name: 'Salvar perfil e ver vagas' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar o perfil. habilidades desconhecidas: cobol')
    expect(screen.getByRole('button', { name: 'Meu perfil' })).toHaveAttribute('aria-current', 'page')
  })
})

describe('Privacidade', () => {
  it('o aviso abre pelo login e volta para o login', async () => {
    simularApi()
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: 'Aviso de privacidade' }))
    expect(screen.getByRole('heading', { name: 'Aviso de privacidade' })).toBeInTheDocument()
    expect(screen.getByText(/Não pedimos nome, CPF, telefone nem currículo/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '← Voltar' }))
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
  })

  it('criar conta informa o aviso e volta para o criar conta', async () => {
    simularApi()
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(screen.getByText(/Ao criar a conta, você concorda com o/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Aviso de privacidade' }))
    await userEvent.click(screen.getByRole('button', { name: '← Voltar' }))

    expect(screen.getByLabelText('Confirmar senha')).toBeInTheDocument()
  })
})

describe('Sua conta e privacidade', () => {
  beforeEach(logado)

  async function abrirMeuPerfil() {
    render(<App />)
    await screen.findByText('Vaga Full Stack')
    await userEvent.click(screen.getByRole('button', { name: 'Meu perfil' }))
    return screen.findByRole('region', { name: 'Sua conta e privacidade' })
  }

  it('baixa os dados da pessoa como arquivo', async () => {
    const fetchSimulado = simularApi()
    const criarUrl = vi.fn(() => 'blob:dados')
    URL.createObjectURL = criarUrl
    URL.revokeObjectURL = vi.fn()
    const clique = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const secao = await abrirMeuPerfil()

    await userEvent.click(within(secao).getByRole('button', { name: 'Baixar meus dados' }))

    expect(fetchSimulado).toHaveBeenCalledWith('/api/conta/dados', expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer token-salvo' }) }))
    expect(criarUrl).toHaveBeenCalled()
    expect(clique).toHaveBeenCalled()
  })

  it('excluir pede a senha antes e pode ser cancelado', async () => {
    const fetchSimulado = simularApi()
    const secao = await abrirMeuPerfil()

    await userEvent.click(within(secao).getByRole('button', { name: 'Excluir minha conta' }))
    expect(within(secao).getByText(/Não dá para desfazer/)).toBeInTheDocument()

    await userEvent.click(within(secao).getByRole('button', { name: 'Excluir definitivamente' }))
    expect(within(secao).getByRole('alert')).toHaveTextContent('Digite sua senha para confirmar.')

    await userEvent.click(within(secao).getByRole('button', { name: 'Cancelar' }))
    expect(within(secao).queryByLabelText('Digite sua senha para confirmar')).not.toBeInTheDocument()
    expect(fetchSimulado.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false)
  })

  it('com senha errada mostra o erro e mantém a conta', async () => {
    simularApi({ 'DELETE /api/conta': () => json({ erro: 'Senha incorreta' }, 403) })
    const secao = await abrirMeuPerfil()

    await userEvent.click(within(secao).getByRole('button', { name: 'Excluir minha conta' }))
    await userEvent.type(within(secao).getByLabelText('Digite sua senha para confirmar'), 'errada-123')
    await userEvent.click(within(secao).getByRole('button', { name: 'Excluir definitivamente' }))

    expect(await within(secao).findByRole('alert')).toHaveTextContent('Senha incorreta')
    expect(localStorage.getItem(CHAVE_TOKEN)).toBe('token-salvo')
  })

  it('com a senha certa exclui, apaga a sessão e avisa no login', async () => {
    const fetchSimulado = simularApi()
    const secao = await abrirMeuPerfil()

    await userEvent.click(within(secao).getByRole('button', { name: 'Excluir minha conta' }))
    await userEvent.type(within(secao).getByLabelText('Digite sua senha para confirmar'), 'senha-forte-123')
    await userEvent.click(within(secao).getByRole('button', { name: 'Excluir definitivamente' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Sua conta foi excluída.')
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(localStorage.getItem(CHAVE_TOKEN)).toBeNull()
    expect(fetchSimulado).toHaveBeenCalledWith('/api/conta', expect.objectContaining({ method: 'DELETE', body: '{"senha":"senha-forte-123"}' }))
  })

  it('o aviso de privacidade abre pela conta e volta para o perfil', async () => {
    simularApi()
    const secao = await abrirMeuPerfil()

    await userEvent.click(within(secao).getByRole('button', { name: 'Aviso de privacidade' }))
    await userEvent.click(screen.getByRole('button', { name: '← Voltar' }))

    expect(await screen.findByRole('region', { name: 'Sua conta e privacidade' })).toBeInTheDocument()
  })
})

describe('Painel', () => {
  beforeEach(logado)

  it('não transforma em link um endereço inseguro vindo dos dados', async () => {
    simularApi({
      'GET /api/vagas': () => json({ total: 1, vagas: [vaga({ id: 9, titulo: 'Vaga Suspeita', link: 'javascript:alert(1)' })] }),
    })
    render(<App />)

    const cartao = await screen.findByRole('article', { name: 'Vaga Suspeita' })
    expect(within(cartao).queryByRole('link')).not.toBeInTheDocument()
    expect(within(cartao).getByText('Link indisponível')).toBeInTheDocument()
  })

  it('links seguros abrem em nova aba sem dar acesso à página de origem', async () => {
    simularApi()
    render(<App />)

    const cartao = await screen.findByRole('article', { name: 'Vaga Full Stack' })
    const link = within(cartao).getByRole('link', { name: 'Abrir vaga ↗' })
    expect(link).toHaveAttribute('href', 'https://exemplo.gupy.io/job/1')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('mostra o resumo e as vagas com nota 40 ou mais, da maior para a menor', async () => {
    simularApi()
    render(<App />)

    const lista = await screen.findByRole('region', { name: 'Vagas' })
    const titulos = within(lista).getAllByRole('heading').map((h) => h.textContent)
    expect(titulos).toEqual(['Vaga Full Stack', 'Vaga de Dados'])
    expect(screen.getByText('Mostrando 2 de 4')).toBeInTheDocument()
    expect(screen.getByText('falta Power BI')).toBeInTheDocument()

    const resumo = screen.getByRole('region', { name: 'Resumo' })
    expect(within(resumo).getByText('Nota 60 ou mais').nextSibling).toHaveTextContent('2')
    expect(within(resumo).getByText('Eliminadas por regra').nextSibling).toHaveTextContent('1')
  })

  it('mostra empresa, cidade, modalidade e data de publicação no formato brasileiro', async () => {
    simularApi()
    render(<App />)

    expect(await screen.findByText('Empresa A · São Paulo · Híbrido · publicada em 01/10/2026')).toBeInTheDocument()
  })

  it('filtra por modalidade', async () => {
    simularApi()
    render(<App />)
    await screen.findByText('Vaga Full Stack')

    await userEvent.click(screen.getByRole('button', { name: 'Híbrido' }))

    expect(screen.getByText('Vaga Full Stack')).toBeInTheDocument()
    expect(screen.queryByText('Vaga de Dados')).not.toBeInTheDocument()
  })

  it('com nota mínima 0 mostra também as eliminadas e o motivo', async () => {
    simularApi()
    render(<App />)
    await screen.findByText('Vaga Full Stack')

    fireEvent.change(screen.getByRole('slider'), { target: { value: '0' } })

    expect(screen.getByText('Vaga Android')).toBeInTheDocument()
    expect(screen.getByText('⚠ Exige inglês avançado/fluente')).toBeInTheDocument()
    expect(screen.getByText('Eliminada: exige formatura a partir de 12/2028')).toBeInTheDocument()
  })

  it('salva o status escolhido na API', async () => {
    const fetchSimulado = simularApi()
    render(<App />)
    await screen.findByText('Vaga Full Stack')

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Status da candidatura em Vaga Full Stack' }), 'enviada')

    expect(fetchSimulado).toHaveBeenCalledWith('/api/vagas/1/status', expect.objectContaining({ method: 'PATCH', body: '{"status":"enviada"}' }))
    expect(screen.getByRole('combobox', { name: 'Status da candidatura em Vaga Full Stack' })).toHaveValue('enviada')
    const resumo = screen.getByRole('region', { name: 'Resumo' })
    expect(within(resumo).getByText('Candidaturas enviadas').nextSibling).toHaveTextContent('1')
  })

  it('volta o status anterior e avisa quando a API falha ao salvar', async () => {
    simularApi({ 'PATCH /api/vagas': () => json({ erro: 'Erro interno no servidor' }, 500) })
    render(<App />)
    await screen.findByText('Vaga Full Stack')

    const seletor = screen.getByRole('combobox', { name: 'Status da candidatura em Vaga Full Stack' })
    await userEvent.selectOptions(seletor, 'enviada')

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar o status. Erro interno no servidor')
    expect(seletor).toHaveValue('pendente')
  })

  it('avisa quando não consegue carregar as vagas', async () => {
    simularApi({ 'GET /api/vagas': () => json({ erro: 'Erro interno no servidor' }, 500) })
    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar as vagas. Erro interno no servidor')
  })
})
