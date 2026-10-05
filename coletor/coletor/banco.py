"""Salva as vagas coletadas na tabela `vagas` do PostgreSQL."""

from __future__ import annotations

import re
from typing import Any, Iterable
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import certifi
import psycopg

SQL_SALVAR = """
INSERT INTO vagas (fonte, id_externo, titulo, empresa, cidade, estado, modalidade,
                   link, descricao, publicada_em)
VALUES (%(fonte)s, %(id_externo)s, %(titulo)s, %(empresa)s, %(cidade)s, %(estado)s,
        %(modalidade)s, %(link)s, %(descricao)s, %(publicada_em)s)
ON CONFLICT (fonte, id_externo) DO UPDATE SET
    titulo       = EXCLUDED.titulo,
    empresa      = EXCLUDED.empresa,
    cidade       = EXCLUDED.cidade,
    estado       = EXCLUDED.estado,
    modalidade   = EXCLUDED.modalidade,
    link         = EXCLUDED.link,
    descricao    = EXCLUDED.descricao,
    publicada_em = EXCLUDED.publicada_em
RETURNING (xmax = 0) AS inserida
"""
# "xmax = 0" é verdadeiro quando a linha acabou de ser inserida (e falso quando foi atualizada).
# A nota de compatibilidade não é calculada aqui: a API calcula na hora, com o perfil de cada pessoa.


def extrair_url(valor: str) -> str | None:
    """Acha a URL do PostgreSQL no valor configurado.

    Tolera erros comuns ao colar o segredo (no GitHub, por exemplo): o prefixo "DATABASE_URL=",
    aspas, espaços e linhas extras como comentários. Devolve None se não houver URL válida.
    """
    achada = re.search(r"postgres(?:ql)?://[^\s'\"]+", valor)
    return achada.group(0) if achada else None


def preparar_url(url: str) -> str:
    """Ajusta a URL para o psycopg.

    Com sslmode=verify-full, o psycopg precisa saber onde estão os certificados confiáveis.
    Usa o pacote de certificados do certifi, que funciona igual em Windows, Linux e macOS
    (o "sslrootcert=system" do PostgreSQL não encontra os certificados no Windows).
    """
    partes = urlsplit(url)
    parametros = dict(parse_qsl(partes.query))
    if parametros.get("sslmode") == "verify-full" and "sslrootcert" not in parametros:
        parametros["sslrootcert"] = certifi.where()
    return urlunsplit(partes._replace(query=urlencode(parametros)))


def salvar_vagas(conexao: psycopg.Connection, vagas: Iterable[dict[str, Any]]) -> tuple[int, int]:
    """Insere vagas novas e atualiza as existentes. Devolve (inseridas, atualizadas)."""
    inseridas = atualizadas = 0
    with conexao.transaction(), conexao.cursor() as cursor:
        for vaga in vagas:
            cursor.execute(SQL_SALVAR, vaga)
            if cursor.fetchone()[0]:
                inseridas += 1
            else:
                atualizadas += 1
    return inseridas, atualizadas
