export const MODALIDADES = ['presencial', 'hibrido', 'remoto'] as const;
export type Modalidade = (typeof MODALIDADES)[number];

export const STATUS = ['pendente', 'enviada', 'entrevista', 'recusada', 'sem_interesse'] as const;
export type Status = (typeof STATUS)[number];

// Vaga como está guardada no banco, junto com o status da candidatura de um usuário.
// A descrição é usada só para calcular a nota; não é devolvida pela API.
export interface VagaDoBanco {
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
  descricao: string | null;
  status: Status; // 'pendente' quando o usuário ainda não marcou nada
}

// Vaga como a API devolve: dados públicos + nota calculada para o perfil de quem pediu.
export interface Vaga extends Omit<VagaDoBanco, 'descricao'> {
  notaCompatibilidade: number;
  habilidadesEncontradas: string[]; // tecnologias do perfil que a vaga pede
  requisitosFaltando: string[]; // obrigatórios que a pessoa ainda não tem
  diferenciaisFaltando: string[]; // diferenciais que a pessoa ainda não tem
  alertas: string[];
  motivoEliminacao: string | null;
}

// "Contrato" do repositório: a rota só conhece estas funções, não o banco.
// Isso permite trocar o banco real por um falso nos testes.
export interface VagasRepositorio {
  listar(usuarioId: number, filtros: { modalidade?: Modalidade }): Promise<VagaDoBanco[]>;
  // Devolve false se a vaga não existir.
  salvarStatus(usuarioId: number, vagaId: number, status: Status): Promise<boolean>;
}
