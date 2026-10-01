// Calcula a nota de compatibilidade (0 a 100) entre uma vaga e o perfil de uma pessoa, usando regras.
//
// Como a nota é formada:
//   base 40
//   + pontos das tecnologias do perfil que aparecem na vaga (pesos do catálogo, no máximo 50)
//   + bônus pelo título: +10 desenvolvimento/software/full stack, +5 dados
//   - 8 por requisito OBRIGATÓRIO do catálogo que a pessoa não tem (no máximo -32)
//   - 15 se a vaga exige inglês avançado/fluente e o nível da pessoa é menor
//   - 10 se a modalidade da vaga não está entre as preferidas
//   Resultado limitado entre 0 e 100.
//   Eliminatório (nota 0): a vaga exige formatura numa data incompatível com a da pessoa.
//
// Requisitos que aparecem como "diferencial"/"desejável" não tiram pontos: só são listados.

import { CATALOGO, habilidadesEfetivas, type Tecnologia } from '../perfil/catalogo';
import type { NivelIngles, Perfil } from '../perfil/tipos';
import type { Modalidade } from '../vagas/tipos';
import { comLimitesDePalavra } from './regex';

export const BASE = 40;
export const MAX_HABILIDADES = 50;
export const PENALIDADE_LACUNA = 8;
export const MAX_PENALIDADE_LACUNAS = 32;
export const PENALIDADE_INGLES = 15;
export const PENALIDADE_MODALIDADE = 10;

export interface VagaParaAvaliar {
  titulo: string;
  descricao: string | null;
  modalidade: Modalidade | null;
}

export interface Avaliacao {
  nota: number;
  habilidadesEncontradas: string[];
  requisitosFaltando: string[];
  diferenciaisFaltando: string[];
  alertas: string[];
  motivoEliminacao: string | null;
}

const TITULO_DESENVOLVIMENTO = /desenvolv|software|full[\s-]?stack|programa[cç][aã]o|programador|front[\s-]?end|back[\s-]?end/i;
const TITULO_DADOS = comLimitesDePalavra(/\bdados\b|\bdata\b|analytics/i);

// Títulos de seção que muitas vezes vêm "colados" ao texto anterior (ex.: "qualificaçõesRequisitos:").
// Só contam com maiúscula logo após uma minúscula, para "criatividades" não virar "cri" + "atividades".
const CABECALHO_COLADO =
  /(?<=[a-zà-ú):])(?=(?:Requisitos|Diferencia(?:l|is)|Desej[aá]ve(?:l|is)|Informa[cç][oõ]es adicionais|Benef[ií]cios|Responsabilidades|Atividades|Obrigat[oó]rio|Etapas do processo))/g;
const CABECALHO_COM_DOIS_PONTOS = comLimitesDePalavra(
  /(?=\b(?:requisitos|diferencia(?:l|is)|desej[aá]ve(?:l|is)|informa[cç][oõ]es adicionais|benef[ií]cios|responsabilidades|atividades|obrigat[oó]rio|etapas do processo)[^:\n]{0,30}:)/gi,
);

// Início de uma seção de diferenciais (aceita "Requisitos desejáveis" e títulos colados ao texto seguinte).
const INICIO_DIFERENCIAL = comLimitesDePalavra(
  /^\s*(?:(?:requisitos|qualifica[cç][oõ]es|conhecimentos)\s+)?(?:diferencia(?:l|is)|desej[aá]ve(?:l|is)|plus\b|nice to have)/i,
);
const INICIO_OUTRA_SECAO = /^\s*(?:requisitos|obrigat[oó]rio|informa[cç][oõ]es adicionais|benef[ií]cios|responsabilidades|atividades|etapas)/i;
const MENCIONA_DIFERENCIAL = comLimitesDePalavra(/diferencia|desej[aá]ve|\bplus\b|nice to have/i);

// Quebra em linhas, ";", "•", ":" e pontos finais, sem quebrar "Node.js" nem ".NET".
const SEPARADOR_TRECHOS = /[\n;•:]|\.(?=\s|$)|(?<=[a-zà-ú])\.(?=[A-ZÀ-Ú][a-zà-ú])/;

const AFIRMATIVA = /afirmativ[ao]|exclusiv[ao] para (?:pessoas|mulheres|pcd)|vaga para mulheres/i;
const INGLES = /ingl[eê]s|english/i;
const INGLES_ALTO = /avan[cç]ad|fluen|advanced|conversa[cç][aã]o/i;
const ORDEM_INGLES: Record<NivelIngles, number> = { basico: 0, intermediario: 1, avancado: 2, fluente: 3 };

const MESES: Record<string, number> = {
  jan: 1, fev: 2, feb: 2, mar: 3, abr: 4, apr: 4, mai: 5, may: 5, jun: 6, jul: 7, ago: 8, aug: 8,
  set: 9, sep: 9, out: 10, oct: 10, nov: 11, dez: 12, dec: 12,
};
const MES = String.raw`(?:(\d{1,2}|[a-z]{3})[a-zç]*\s*\/\s*)?`;
const FORMATURA = new RegExp(
  String.raw`(?:formatura|conclus[aã]o|formad[oa]s?|t[eé]rmino)[^\n;]{0,60}?(a partir de|ap[oó]s|entre|at[eé])\s*` +
    MES +
    String.raw`(20\d\d)(?:\s*(?:e|a|at[eé])\s*` +
    MES +
    String.raw`(20\d\d))?`,
  'gi',
);

export function limparTexto(texto: string): string {
  const semEntidades = decodificarEntidades(texto).replace(/ /g, ' ');
  return semEntidades.replace(CABECALHO_COLADO, '\n').replace(CABECALHO_COM_DOIS_PONTOS, '\n');
}

// As descrições da Gupy trazem entidades HTML como "&nbsp;" e "&amp;".
function decodificarEntidades(texto: string): string {
  const nomeadas: Record<string, string> = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  return texto.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (original, codigo: string) => {
    if (codigo[0] === '#') {
      const numero = codigo[1].toLowerCase() === 'x' ? parseInt(codigo.slice(2), 16) : parseInt(codigo.slice(1), 10);
      return Number.isFinite(numero) ? String.fromCodePoint(numero) : original;
    }
    return nomeadas[codigo.toLowerCase()] ?? original;
  });
}

// Divide o texto em trechos e marca quais estão numa parte de "diferenciais".
export function dividirTrechos(texto: string): Array<{ trecho: string; diferencial: boolean }> {
  const trechos: Array<{ trecho: string; diferencial: boolean }> = [];
  let emDiferencial = false;
  for (const trecho of texto.split(SEPARADOR_TRECHOS)) {
    if (!trecho || !trecho.trim()) continue;
    if (INICIO_DIFERENCIAL.test(trecho)) emDiferencial = true;
    else if (INICIO_OUTRA_SECAO.test(trecho)) emDiferencial = false;
    trechos.push({ trecho, diferencial: emDiferencial || MENCIONA_DIFERENCIAL.test(trecho) });
  }
  return trechos;
}

type MesAno = [ano: number, mes: number];

function mesAno(mes: string | undefined, ano: string): MesAno {
  if (!mes) return [Number(ano), 1];
  const numero = /^\d+$/.test(mes) ? Number(mes) : (MESES[mes.slice(0, 3).toLowerCase()] ?? 1);
  return [Number(ano), Math.min(Math.max(numero, 1), 12)];
}

const comparar = (a: MesAno, b: MesAno) => a[0] - b[0] || a[1] - b[1];
const formatar = ([ano, mes]: MesAno) => `${String(mes).padStart(2, '0')}/${ano}`;

// Devolve o motivo da eliminação se a vaga exigir formatura numa data que não é a da pessoa.
export function verificarFormatura(texto: string, formatura: MesAno): string | null {
  for (const m of texto.matchAll(FORMATURA)) {
    const [, regraBruta, mes1, ano1, mes2, ano2] = m;
    const regra = regraBruta.toLowerCase();
    const inicio = mesAno(mes1, ano1);
    if (regra.startsWith('entre') && ano2) {
      const fim = mesAno(mes2, ano2);
      if (comparar(formatura, inicio) < 0 || comparar(formatura, fim) > 0) {
        return `Exige formatura entre ${formatar(inicio)} e ${formatar(fim)}`;
      }
    } else if (regra.startsWith('a partir') || regra.startsWith('ap')) {
      if (comparar(formatura, inicio) < 0) return `Exige formatura a partir de ${formatar(inicio)}`;
    } else if (regra.startsWith('at')) {
      if (comparar(formatura, inicio) > 0) return `Exige formatura até ${formatar(inicio)}`;
    }
  }
  return null;
}

function formaturaDoPerfil(perfil: Perfil): MesAno | null {
  if (!perfil.formatura) return null;
  const [ano, mes] = perfil.formatura.split('-').map(Number);
  return [ano, mes];
}

export function avaliar(vaga: VagaParaAvaliar, perfil: Perfil, catalogo: Tecnologia[] = CATALOGO): Avaliacao {
  const texto = limparTexto(`${vaga.titulo}\n${vaga.descricao ?? ''}`);
  // Inclui o que as habilidades marcadas implicam (ex.: PostgreSQL implica SQL e Banco de dados).
  const sabe = habilidadesEfetivas(perfil.habilidades);

  // Sem formatura no perfil, a regra eliminatória não se aplica (não dá para comparar).
  const formatura = formaturaDoPerfil(perfil);
  const motivo = formatura ? verificarFormatura(texto, formatura) : null;
  if (motivo) {
    return { nota: 0, habilidadesEncontradas: [], requisitosFaltando: [], diferenciaisFaltando: [], alertas: [], motivoEliminacao: motivo };
  }

  const pedidas = catalogo.filter((t) => t.padrao.test(texto));
  const encontradas = pedidas.filter((t) => sabe.has(t.id));
  const pontos = Math.min(
    encontradas.reduce((soma, t) => soma + t.peso, 0),
    MAX_HABILIDADES,
  );

  const trechos = dividirTrechos(texto);
  const requisitosFaltando: string[] = [];
  const diferenciaisFaltando: string[] = [];
  for (const t of catalogo) {
    if (sabe.has(t.id) || t.penalizaAusencia === false) continue;
    const ocorrencias = trechos.filter(({ trecho }) => t.padrao.test(trecho));
    if (ocorrencias.length === 0) continue;
    (ocorrencias.every((o) => o.diferencial) ? diferenciaisFaltando : requisitosFaltando).push(t.nome);
  }

  const alertas: string[] = [];
  // Só no título: muitas descrições citam diversidade de forma geral, sem restringir a vaga.
  if (AFIRMATIVA.test(vaga.titulo)) alertas.push('Vaga afirmativa: confira se você se enquadra');

  const inglesAlto = trechos.some(({ trecho, diferencial }) => !diferencial && INGLES.test(trecho) && INGLES_ALTO.test(trecho));
  let penalidadeIngles = 0;
  if (inglesAlto && ORDEM_INGLES[perfil.nivelIngles] < ORDEM_INGLES.avancado) {
    alertas.push('Exige inglês avançado/fluente');
    penalidadeIngles = PENALIDADE_INGLES;
  }

  let penalidadeModalidade = 0;
  if (vaga.modalidade && !perfil.modalidades.includes(vaga.modalidade)) {
    alertas.push('Modalidade fora da sua preferência');
    penalidadeModalidade = PENALIDADE_MODALIDADE;
  }

  const bonus = TITULO_DESENVOLVIMENTO.test(vaga.titulo) ? 10 : TITULO_DADOS.test(vaga.titulo) ? 5 : 0;
  const penalidadeLacunas = Math.min(PENALIDADE_LACUNA * requisitosFaltando.length, MAX_PENALIDADE_LACUNAS);

  const nota = BASE + pontos + bonus - penalidadeLacunas - penalidadeIngles - penalidadeModalidade;
  return {
    nota: Math.max(0, Math.min(100, nota)),
    habilidadesEncontradas: encontradas.map((t) => t.nome),
    requisitosFaltando,
    diferenciaisFaltando,
    alertas,
    motivoEliminacao: null,
  };
}
