import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Vaga } from './api'
import App from './App'

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

function respostaJson(corpo: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } }))
}

// Simula a API: GET devolve as vagas; PATCH responde com o que for passado.
function simularApi(respostaPatch: (url: string, corpo: string) => Promise<Response> = (_u, c) => respostaJson(JSON.parse(c))) {
  const vagas = structuredClone(VAGAS)
  return vi.spyOn(globalThis, 'fetch').mockImplementation((entrada, init) => {
    const url = String(entrada)
    if (init?.method === 'PATCH') return respostaPatch(url, String(init.body))
    return respostaJson({ total: vagas.length, vagas })
  })
}

describe('Painel', () => {
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

    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Status da candidatura em Vaga Full Stack' }),
      'enviada',
    )

    expect(fetchSimulado).toHaveBeenCalledWith('/api/vagas/1/status', expect.objectContaining({ method: 'PATCH', body: '{"status":"enviada"}' }))
    expect(screen.getByRole('combobox', { name: 'Status da candidatura em Vaga Full Stack' })).toHaveValue('enviada')
    const resumo = screen.getByRole('region', { name: 'Resumo' })
    expect(within(resumo).getByText('Candidaturas enviadas').nextSibling).toHaveTextContent('1')
  })

  it('volta o status anterior e avisa quando a API falha ao salvar', async () => {
    simularApi(() => respostaJson({ erro: 'Erro interno no servidor' }, 500))
    render(<App />)
    await screen.findByText('Vaga Full Stack')

    const seletor = screen.getByRole('combobox', { name: 'Status da candidatura em Vaga Full Stack' })
    await userEvent.selectOptions(seletor, 'enviada')

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar o status. Erro interno no servidor')
    expect(seletor).toHaveValue('pendente')
  })

  it('avisa quando não consegue carregar as vagas', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Failed to fetch'))
    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar as vagas. Failed to fetch')
  })
})
