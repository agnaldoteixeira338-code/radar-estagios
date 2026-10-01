export const MODALIDADES = ['presencial', 'hibrido', 'remoto'] as const;
export type Modalidade = (typeof MODALIDADES)[number];

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
}

export interface FiltrosVagas {
  modalidade?: Modalidade;
  limite: number;
}

// "Contrato" do repositório: a rota só conhece estas funções, não o banco.
// Isso permite trocar o banco real por um falso nos testes.
export interface VagasRepositorio {
  listar(filtros: FiltrosVagas): Promise<Vaga[]>;
}
