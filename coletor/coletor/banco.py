"""Salva as vagas coletadas na tabela `vagas` do PostgreSQL."""

from __future__ import annotations

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
# A nota de compatibilidade não é tocada aqui: ela é calculada por outra etapa.


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


SQL_SALVAR_AVALIACAO = """
UPDATE vagas SET
    nota_compatibilidade    = %(nota)s,
    habilidades_encontradas = %(habilidades)s,
    requisitos_faltando     = %(lacunas_obrigatorias)s,
    diferenciais_faltando   = %(lacunas_diferenciais)s,
    alertas                 = %(alertas)s,
    motivo_eliminacao       = %(motivo_eliminacao)s,
    avaliada_em             = NOW()
WHERE id = %(id)s
"""


def avaliar_vagas(conexao: psycopg.Connection, avaliar) -> int:
    """Recalcula a nota de todas as vagas com a função `avaliar(titulo, descricao)`.

    A função chega por parâmetro para que o método de avaliação possa ser trocado
    (hoje regras; no futuro, uma IA) sem mudar esta parte.
    """
    with conexao.transaction(), conexao.cursor() as cursor:
        vagas = cursor.execute("SELECT id, titulo, descricao FROM vagas").fetchall()
        for id_vaga, titulo, descricao in vagas:
            avaliacao = avaliar(titulo, descricao)
            cursor.execute(SQL_SALVAR_AVALIACAO, {"id": id_vaga, **vars(avaliacao)})
    return len(vagas)


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
