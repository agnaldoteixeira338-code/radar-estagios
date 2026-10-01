"""Busca vagas no portal público da Gupy e converte para o formato da tabela `vagas`.

Usa o mesmo endereço que o site portal.gupy.io usa para listar vagas. Não é uma API
oficial documentada, então pode mudar sem aviso: por isso a conversão fica isolada aqui.
"""

from __future__ import annotations

import re
import time
from typing import Any

import requests

URL_BUSCA = "https://portal.gupy.io/api/job-search/jobs"
TIPO_ESTAGIO = "vacancy_type_internship"
TAMANHO_PAGINA = 100
PAUSA_ENTRE_PEDIDOS = 1.0  # segundos: educação com o servidor da Gupy
CABECALHOS = {"User-Agent": "radar-estagios/0.1 (projeto pessoal de estudo)"}

MODALIDADES = {"on-site": "presencial", "hybrid": "hibrido", "remote": "remoto"}

UFS = {
    "Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM", "Bahia": "BA",
    "Ceará": "CE", "Distrito Federal": "DF", "Espírito Santo": "ES", "Goiás": "GO",
    "Maranhão": "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS", "Minas Gerais": "MG",
    "Pará": "PA", "Paraíba": "PB", "Paraná": "PR", "Pernambuco": "PE", "Piauí": "PI",
    "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN", "Rio Grande do Sul": "RS",
    "Rondônia": "RO", "Roraima": "RR", "Santa Catarina": "SC", "São Paulo": "SP",
    "Sergipe": "SE", "Tocantins": "TO",
}


# A busca da Gupy encontra o termo em qualquer parte do anúncio (ex.: "programação" casa com
# "Programa de Estágio" de Engenharia Civil). Por isso o título passa por este filtro de TI.
TERMOS_TI = re.compile(
    r"\bti\b|tecnologia|software|\bsistemas?\b|programa[cç][aã]o|programador|desenvolvedor"
    r"|desenvolvimento (de |em )?(software|sistemas|integra|aplica|web|mobile|android|ios)"
    r"|\bdados\b|\bdata\b|analytics|\bbi\b|cyber|ciberseguran|seguran[cç]a da informa"
    r"|help ?desk|service desk|suporte (de |em )?ti|front-?end|back-?end|full ?stack"
    r"|\bweb\b|android|\bios\b|mobile|\bqa\b|testes? de software|cloud|devops|\bredes\b"
    r"|\bia\b|\bai\b|intelig[eê]ncia artificial|machine learning|automa[cç][aã]o de processos",
    re.IGNORECASE,
)
TERMOS_NAO_TI = re.compile(
    r"engenharia civil|\bobras?\b|fonoaudiolog|auditoria|qualidade|sistemas? de gest[aã]o"
    r"|automotiv|eletroeletr|pesquisa e desenvolvimento|engenharia de produ[cç][aã]o"
    r"|arquitetura e urbanismo|direito|advocacia|contabilidade|marketing digital",
    re.IGNORECASE,
)


def e_vaga_de_ti(titulo: str) -> bool:
    """Diz se o título parece de uma vaga de tecnologia."""
    return bool(TERMOS_TI.search(titulo)) and not TERMOS_NAO_TI.search(titulo)


def buscar_vagas(
    termo: str,
    estado: str | None = "São Paulo",
    max_paginas: int = 5,
    sessao: requests.Session | None = None,
    pausa: float = PAUSA_ENTRE_PEDIDOS,
) -> list[dict[str, Any]]:
    """Busca vagas de estágio para um termo, página por página, e devolve os dados brutos."""
    sessao = sessao or requests.Session()
    vagas: list[dict[str, Any]] = []

    for pagina in range(max_paginas):
        parametros = {
            "jobName": termo,
            "type": TIPO_ESTAGIO,
            "limit": TAMANHO_PAGINA,
            "offset": pagina * TAMANHO_PAGINA,
        }
        if estado:
            parametros["state"] = estado

        resposta = sessao.get(URL_BUSCA, params=parametros, headers=CABECALHOS, timeout=20)
        resposta.raise_for_status()
        dados = resposta.json().get("data") or []
        vagas.extend(dados)

        if len(dados) < TAMANHO_PAGINA:  # última página
            break
        time.sleep(pausa)

    return vagas


def _texto_ou_none(valor: Any) -> str | None:
    if valor is None:
        return None
    texto = str(valor).strip()
    return texto or None


def normalizar(bruta: dict[str, Any]) -> dict[str, Any]:
    """Converte uma vaga no formato da Gupy para as colunas da tabela `vagas`."""
    estado = _texto_ou_none(bruta.get("state"))
    publicada = _texto_ou_none(bruta.get("publishedDate"))

    return {
        "fonte": "gupy",
        "id_externo": str(bruta["id"]),
        "titulo": str(bruta["name"]).strip(),
        "empresa": _texto_ou_none(bruta.get("careerPageName")) or "Empresa não informada",
        "cidade": _texto_ou_none(bruta.get("city")),
        "estado": UFS.get(estado, estado) if estado else None,
        "modalidade": MODALIDADES.get(bruta.get("workplaceType") or ""),
        "link": str(bruta["jobUrl"]),
        "descricao": _texto_ou_none(bruta.get("description")),
        "publicada_em": publicada[:10] if publicada else None,  # "2026-09-28T14:26:25Z" -> "2026-09-28"
    }
