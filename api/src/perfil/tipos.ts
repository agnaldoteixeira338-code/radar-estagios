import type { Modalidade } from '../vagas/tipos';

export const NIVEIS_INGLES = ['basico', 'intermediario', 'avancado', 'fluente'] as const;
export type NivelIngles = (typeof NIVEIS_INGLES)[number];

export interface Perfil {
  habilidades: string[]; // ids do catálogo
  formatura: string | null; // "AAAA-MM"
  nivelIngles: NivelIngles;
  modalidades: Modalidade[];
}

// Perfil de quem ainda não preencheu nada.
export const PERFIL_VAZIO: Perfil = {
  habilidades: [],
  formatura: null,
  nivelIngles: 'basico',
  modalidades: ['presencial', 'hibrido', 'remoto'],
};

export interface PerfisRepositorio {
  // Devolve null se o usuário ainda não salvou um perfil.
  buscar(usuarioId: number): Promise<Perfil | null>;
  salvar(usuarioId: number, perfil: Perfil): Promise<Perfil>;
}
