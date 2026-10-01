"""Calcula a nota de compatibilidade (0 a 100) entre uma vaga e o perfil, usando regras.

Como a nota é formada:
  base 40
  + pontos das suas habilidades que aparecem na vaga (pesos em perfil.py, no máximo 50)
  + bônus pelo título: +10 desenvolvimento/software/full stack, +5 dados
  - 8 por requisito OBRIGATÓRIO que você ainda não tem (no máximo -32)
  - 15 se a vaga exige inglês avançado/fluente e o seu nível é menor
  Resultado limitado entre 0 e 100.
  Eliminatório (nota 0): a vaga exige formatura numa data que não é a sua.

Requisitos que aparecem como "diferencial"/"desejável" não tiram pontos: só são listados.
"""

from __future__ import annotations

import html
import re
from dataclasses import dataclass, field

from . import perfil

BASE = 40
MAX_HABILIDADES = 50
PENALIDADE_LACUNA = 8
MAX_PENALIDADE_LACUNAS = 32
PENALIDADE_INGLES = 15

TITULO_DESENVOLVIMENTO = re.compile(
    r"desenvolv|software|full[\s-]?stack|programa[cç][aã]o|programador|front[\s-]?end|back[\s-]?end",
    re.I,
)
TITULO_DADOS = re.compile(r"\bdados\b|\bdata\b|analytics", re.I)

# Títulos de seção que muitas vezes vêm "colados" ao texto anterior
# (ex.: "Requisitos e qualificaçõesRequisitos:"). Recebem uma quebra de linha antes.
CABECALHOS = (
    r"requisitos|diferencia(?:l|is)|desej[aá]ve(?:l|is)|informa[cç][oõ]es adicionais"
    r"|benef[ií]cios|responsabilidades|atividades|obrigat[oó]rio|etapas do processo"
)
# Só conta como título colado se começar com maiúscula logo após uma minúscula
# (assim "criatividades" não vira "cri" + "atividades").
CABECALHO_COLADO = re.compile(rf"(?<=[a-zà-ú):])(?=[A-ZÀ-Ú])(?=(?i:{CABECALHOS}))")
CABECALHO_COM_DOIS_PONTOS = re.compile(rf"(?=\b(?:{CABECALHOS})[^:\n]{{0,30}}:)", re.I)

# Início de uma seção de diferenciais. Aceita "Requisitos desejáveis" / "Qualificações desejáveis"
# e títulos colados ao texto seguinte (ex.: "DesejáveisConhecimento em Java").
INICIO_DIFERENCIAL = re.compile(
    r"^\s*(?:(?:requisitos|qualifica[cç][oõ]es|conhecimentos)\s+)?"
    r"(diferencia(?:l|is)|desej[aá]ve(?:l|is)|plus\b|nice to have)",
    re.I,
)
INICIO_OUTRA_SECAO = re.compile(
    r"^\s*(requisitos|obrigat[oó]rio|informa[cç][oõ]es adicionais|benef[ií]cios"
    r"|responsabilidades|atividades|etapas)",
    re.I,
)
MENCIONA_DIFERENCIAL = re.compile(r"diferencia|desej[aá]ve|\bplus\b|nice to have", re.I)

AFIRMATIVA = re.compile(r"afirmativ[ao]|exclusiv[ao] para (pessoas|mulheres|pcd)|vaga para mulheres", re.I)

INGLES = re.compile(r"ingl[eê]s|english", re.I)
INGLES_ALTO = re.compile(r"avan[cç]ad|fluen|advanced|conversa[cç][aã]o", re.I)
NIVEIS_INGLES = {"basico": 0, "intermediario": 1, "avancado": 2, "fluente": 3}

MESES = {
    "jan": 1, "fev": 2, "feb": 2, "mar": 3, "abr": 4, "apr": 4, "mai": 5, "may": 5, "jun": 6,
    "jul": 7, "ago": 8, "aug": 8, "set": 9, "sep": 9, "out": 10, "oct": 10, "nov": 11,
    "dez": 12, "dec": 12,
}
_MES = r"(?:(\d{1,2}|[a-z]{3})[a-zç]*\s*/\s*)?"
FORMATURA = re.compile(
    r"(?:formatura|conclus[aã]o|formad[oa]s?|t[eé]rmino)[^\n;]{0,60}?"
    r"(a partir de|ap[oó]s|entre|at[eé])\s*" + _MES + r"(20\d\d)"
    r"(?:\s*(?:e|a|at[eé])\s*" + _MES + r"(20\d\d))?",
    re.I,
)


@dataclass
class Avaliacao:
    nota: int
    habilidades: list[str] = field(default_factory=list)
    lacunas_obrigatorias: list[str] = field(default_factory=list)
    lacunas_diferenciais: list[str] = field(default_factory=list)
    alertas: list[str] = field(default_factory=list)
    motivo_eliminacao: str | None = None


def limpar_texto(texto: str) -> str:
    texto = html.unescape(texto or "").replace("\xa0", " ")
    texto = CABECALHO_COLADO.sub("\n", texto)
    return CABECALHO_COM_DOIS_PONTOS.sub("\n", texto)


def dividir_trechos(texto: str) -> list[tuple[str, bool]]:
    """Divide o texto em trechos e marca quais estão numa parte de "diferenciais"."""
    trechos: list[tuple[str, bool]] = []
    em_diferencial = False
    # Quebra em linhas, ";", "•", ":" (separa "Requisitos:" do conteúdo) e pontos finais
    # (sem quebrar "Node.js" ou ".NET").
    for trecho in re.split(r"[\n;•:]|\.(?=\s|$)|(?<=[a-zà-ú])\.(?=[A-ZÀ-Ú][a-zà-ú])", texto):
        if not trecho.strip():
            continue
        if INICIO_DIFERENCIAL.match(trecho):
            em_diferencial = True
        elif INICIO_OUTRA_SECAO.match(trecho):
            em_diferencial = False
        trechos.append((trecho, em_diferencial or bool(MENCIONA_DIFERENCIAL.search(trecho))))
    return trechos


def _mes_ano(mes: str | None, ano: str) -> tuple[int, int]:
    if not mes:
        return int(ano), 1
    numero = int(mes) if mes.isdigit() else MESES.get(mes[:3].lower(), 1)
    return int(ano), min(max(numero, 1), 12)


def verificar_formatura(texto: str, formatura: tuple[int, int] = perfil.FORMATURA) -> str | None:
    """Devolve o motivo da eliminação se a vaga exigir formatura numa data que não é a sua."""
    for m in FORMATURA.finditer(texto):
        regra, mes1, ano1, mes2, ano2 = m.groups()
        inicio = _mes_ano(mes1, ano1)
        regra = regra.lower()
        if regra.startswith("entre") and ano2:
            fim = _mes_ano(mes2, ano2)
            if not (inicio <= formatura <= fim):
                return f"Exige formatura entre {inicio[1]:02d}/{inicio[0]} e {fim[1]:02d}/{fim[0]}"
        elif regra.startswith(("a partir", "ap")):
            if formatura < inicio:
                return f"Exige formatura a partir de {inicio[1]:02d}/{inicio[0]}"
        elif regra.startswith("at"):
            if formatura > inicio:
                return f"Exige formatura até {inicio[1]:02d}/{inicio[0]}"
    return None


def avaliar(titulo: str, descricao: str | None) -> Avaliacao:
    texto = limpar_texto(f"{titulo}\n{descricao or ''}")

    motivo = verificar_formatura(texto)
    if motivo:
        return Avaliacao(nota=0, motivo_eliminacao=motivo)

    habilidades = [nome for nome, padrao, _ in perfil.HABILIDADES if re.search(padrao, texto, re.I)]
    pontos = min(sum(peso for nome, _, peso in perfil.HABILIDADES if nome in habilidades), MAX_HABILIDADES)

    trechos = dividir_trechos(texto)
    obrigatorias, diferenciais = [], []
    for nome, padrao in perfil.LACUNAS:
        achados = [diferencial for trecho, diferencial in trechos if re.search(padrao, trecho, re.I)]
        if achados:
            (diferenciais if all(achados) else obrigatorias).append(nome)

    alertas = []
    # Só no título: a maioria das descrições cita diversidade de forma geral, sem restringir a vaga.
    if AFIRMATIVA.search(titulo):
        alertas.append("Vaga afirmativa: confira se você se enquadra")

    ingles_alto = any(
        INGLES.search(t) and INGLES_ALTO.search(t) and not diferencial for t, diferencial in trechos
    )
    penalidade_ingles = 0
    if ingles_alto and NIVEIS_INGLES[perfil.NIVEL_INGLES] < NIVEIS_INGLES["avancado"]:
        alertas.append("Exige inglês avançado/fluente")
        penalidade_ingles = PENALIDADE_INGLES

    bonus = 10 if TITULO_DESENVOLVIMENTO.search(titulo) else 5 if TITULO_DADOS.search(titulo) else 0
    penalidade_lacunas = min(PENALIDADE_LACUNA * len(obrigatorias), MAX_PENALIDADE_LACUNAS)

    nota = BASE + pontos + bonus - penalidade_lacunas - penalidade_ingles
    return Avaliacao(
        nota=max(0, min(100, nota)),
        habilidades=habilidades,
        lacunas_obrigatorias=obrigatorias,
        lacunas_diferenciais=diferenciais,
        alertas=alertas,
    )
