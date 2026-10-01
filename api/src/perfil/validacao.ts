import { MODALIDADES, type Modalidade } from '../vagas/tipos';
import { IDS_CATALOGO } from './catalogo';
import { NIVEIS_INGLES, type NivelIngles, type Perfil } from './tipos';

type Resultado = { ok: true; perfil: Perfil } | { ok: false; erro: string };

const MES_ANO = /^(\d{4})-(0[1-9]|1[0-2])$/;

function listaDeTextos(valor: unknown): valor is string[] {
  return Array.isArray(valor) && valor.every((v) => typeof v === 'string');
}

export function validarPerfil(corpo: unknown): Resultado {
  const { habilidades, formatura, nivelIngles, modalidades } = (corpo ?? {}) as Record<string, unknown>;

  if (!listaDeTextos(habilidades)) {
    return { ok: false, erro: 'habilidades deve ser uma lista de ids do catálogo' };
  }
  const desconhecidas = habilidades.filter((h) => !IDS_CATALOGO.has(h));
  if (desconhecidas.length > 0) {
    return { ok: false, erro: `habilidades desconhecidas: ${desconhecidas.slice(0, 5).join(', ')}` };
  }

  if (formatura !== null) {
    const partes = typeof formatura === 'string' ? MES_ANO.exec(formatura) : null;
    const ano = partes ? Number(partes[1]) : 0;
    if (!partes || ano < 2000 || ano > 2100) {
      return { ok: false, erro: 'formatura deve estar no formato AAAA-MM (ex.: 2028-01) ou ser null' };
    }
  }

  if (!NIVEIS_INGLES.includes(nivelIngles as NivelIngles)) {
    return { ok: false, erro: `nivelIngles deve ser um destes: ${NIVEIS_INGLES.join(', ')}` };
  }

  if (!listaDeTextos(modalidades) || modalidades.length === 0 || !modalidades.every((m) => MODALIDADES.includes(m as Modalidade))) {
    return { ok: false, erro: `modalidades deve ter ao menos uma destas: ${MODALIDADES.join(', ')}` };
  }

  return {
    ok: true,
    perfil: {
      // Remove repetições e mantém uma ordem estável.
      habilidades: [...new Set(habilidades)].sort(),
      formatura: formatura as string | null,
      nivelIngles: nivelIngles as NivelIngles,
      modalidades: MODALIDADES.filter((m) => modalidades.includes(m)),
    },
  };
}
