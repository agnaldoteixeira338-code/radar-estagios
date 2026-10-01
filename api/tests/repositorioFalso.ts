import type { FiltrosVagas, Vaga, VagasRepositorio } from '../src/vagas/tipos';

// Repositório "de mentira" para os testes: guarda as vagas na memória
// e anota os filtros recebidos, sem precisar de banco de dados.
export function criarRepositorioFalso(vagas: Vaga[] = []) {
  const chamadas: FiltrosVagas[] = [];
  const repositorio: VagasRepositorio = {
    async listar(filtros) {
      chamadas.push(filtros);
      return vagas
        .filter((v) => !filtros.modalidade || v.modalidade === filtros.modalidade)
        .slice(0, filtros.limite);
    },
    async atualizarStatus(id, status) {
      const vaga = vagas.find((v) => v.id === id);
      if (!vaga) return null;
      vaga.status = status;
      return vaga;
    },
  };
  return { repositorio, chamadas };
}

export function vagaExemplo(sobrescrever: Partial<Vaga> = {}): Vaga {
  return {
    id: 1,
    fonte: 'gupy',
    idExterno: 'abc-123',
    titulo: 'Estágio em Desenvolvimento Full Stack',
    empresa: 'Empresa Exemplo',
    cidade: 'São Paulo',
    estado: 'SP',
    modalidade: 'presencial',
    link: 'https://exemplo.gupy.io/jobs/123',
    publicadaEm: '2026-09-30',
    notaCompatibilidade: 85,
    habilidadesEncontradas: ['React', 'Node.js'],
    requisitosFaltando: [],
    diferenciaisFaltando: ['Docker'],
    alertas: [],
    motivoEliminacao: null,
    status: 'pendente',
    ...sobrescrever,
  };
}
