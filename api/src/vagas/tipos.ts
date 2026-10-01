export const MODALIDADES = ['presencial', 'hibrido', 'remoto'] as const;
export type Modalidade = (typeof MODALIDADES)[number];

export const STATUS = ['pendente', 'enviada', 'entrevista', 'recusada', 'sem_interesse'] as const;
export type Status = (typeof STATUS)[number];

export interface Vaga {
  id: number;
  fonte: string;
  idExterno: string;
  titulo: string;
  empresa: string;
  cidade: string | null;
  estado: string | null;
  modalidade: Modalidade | null;
  link: string;
  publicadaEm: string | null; // data no formato AAAA-MM-DD
  notaCompatibilidade: number | null;
  habilidadesEncontradas: string[]; // suas habilidades que a vaga pede
  requisitosFaltando: string[]; // obrigatórios que você ainda não tem
  diferenciaisFaltando: string[]; // diferenciais que você ainda não tem
  alertas: string[];
  motivoEliminacao: string | null;
  status: Status; // situação da sua candidatura
}

export interface FiltrosVagas {
  modalidade?: Modalidade;
  limite: number;
}

// "Contrato" do repositório: a rota só conhece estas funções, não o banco.
// Isso permite trocar o banco real por um falso nos testes.
export interface VagasRepositorio {
  listar(filtros: FiltrosVagas): Promise<Vaga[]>;
  // Devolve a vaga atualizada, ou null se o id não existir.
  atualizarStatus(id: number, status: Status): Promise<Vaga | null>;
}
