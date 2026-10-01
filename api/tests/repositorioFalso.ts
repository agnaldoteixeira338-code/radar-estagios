import type { Status, VagaDoBanco, VagasRepositorio } from '../src/vagas/tipos';

// Repositório "de mentira" para os testes: guarda vagas e candidaturas na memória, sem banco.
export function criarRepositorioFalso(vagas: VagaDoBanco[] = []) {
  const candidaturas = new Map<string, Status>(); // chave "usuarioId:vagaId"
  const repositorio: VagasRepositorio = {
    async listar(usuarioId, { modalidade }) {
      return vagas
        .filter((v) => !modalidade || v.modalidade === modalidade)
        .map((v) => ({ ...v, status: candidaturas.get(`${usuarioId}:${v.id}`) ?? 'pendente' }));
    },
    async listarCandidaturas(usuarioId) {
      return [...candidaturas]
        .filter(([chave]) => chave.startsWith(`${usuarioId}:`))
        .map(([chave, status]) => {
          const vaga = vagas.find((v) => v.id === Number(chave.split(':')[1]))!;
          return { vagaId: vaga.id, titulo: vaga.titulo, empresa: vaga.empresa, link: vaga.link, status, atualizadoEm: '2026-10-01T12:00:00Z' };
        });
    },
    async salvarStatus(usuarioId, vagaId, status) {
      if (!vagas.some((v) => v.id === vagaId)) return false;
      candidaturas.set(`${usuarioId}:${vagaId}`, status);
      return true;
    },
  };
  return { repositorio, candidaturas };
}

export function vagaExemplo(sobrescrever: Partial<VagaDoBanco> = {}): VagaDoBanco {
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
    descricao: 'Requisitos: React, Node.js e SQL.',
    status: 'pendente',
    ...sobrescrever,
  };
}
