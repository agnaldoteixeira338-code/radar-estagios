"""Ponto de entrada: `python -m coletor` busca as vagas e salva no banco."""

from __future__ import annotations

import os
import sys
from pathlib import Path

import psycopg
from dotenv import load_dotenv

from .banco import preparar_url, salvar_vagas
from .gupy import buscar_vagas, e_vaga_de_ti, normalizar

TERMOS = [
    "estágio desenvolvimento",
    "estágio programação",
    "estágio software",
    "estágio TI",
    "estágio sistemas",
    "estágio dados",
    "estágio front-end",
    "estágio back-end",
    "estágio full stack",
]

RAIZ = Path(__file__).resolve().parents[2]


def carregar_ambiente() -> str:
    # Usa coletor/.env se existir; senão, reaproveita o api/.env (mesmo banco).
    for caminho in (RAIZ / "coletor" / ".env", RAIZ / "api" / ".env"):
        if caminho.exists():
            load_dotenv(caminho)
            break
    url = os.getenv("DATABASE_URL")
    if not url:
        sys.exit("DATABASE_URL não encontrada. Configure o arquivo api/.env.")
    return url


def main() -> None:
    url = carregar_ambiente()

    vagas: dict[str, dict] = {}  # por id: a mesma vaga pode aparecer em vários termos
    descartadas: set[str] = set()
    for termo in TERMOS:
        brutas = buscar_vagas(termo)
        aceitas = 0
        for bruta in brutas:
            vaga = normalizar(bruta)
            if e_vaga_de_ti(vaga["titulo"]):
                vagas[vaga["id_externo"]] = vaga
                aceitas += 1
            else:
                descartadas.add(vaga["id_externo"])
        print(f"  {termo!r}: {len(brutas)} encontradas, {aceitas} de TI")

    print(f"Total de TI sem repetição: {len(vagas)} vagas ({len(descartadas)} descartadas por não serem de TI)")

    with psycopg.connect(preparar_url(url)) as conexao:
        inseridas, atualizadas = salvar_vagas(conexao, vagas.values())

    print(f"Banco: {inseridas} novas, {atualizadas} atualizadas")


if __name__ == "__main__":
    main()
