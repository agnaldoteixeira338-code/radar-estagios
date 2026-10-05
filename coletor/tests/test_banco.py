from urllib.parse import parse_qs, urlsplit

import certifi
import pytest

from coletor.banco import extrair_url, preparar_url


def parametros(url):
    return {chave: valores[0] for chave, valores in parse_qs(urlsplit(url).query).items()}


def test_verify_full_ganha_certificados_do_certifi():
    url = preparar_url("postgresql://u:s@host/db?sslmode=verify-full&channel_binding=require")
    assert parametros(url) == {
        "sslmode": "verify-full",
        "channel_binding": "require",
        "sslrootcert": certifi.where(),
    }


def test_require_fica_como_esta():
    url = "postgresql://u:s@host/db?sslmode=require&channel_binding=require"
    assert parametros(preparar_url(url)) == {"sslmode": "require", "channel_binding": "require"}


def test_sslrootcert_existente_nao_e_substituido():
    url = preparar_url("postgresql://u:s@host/db?sslmode=verify-full&sslrootcert=/meu/cert.pem")
    assert parametros(url)["sslrootcert"] == "/meu/cert.pem"


def test_usuario_senha_e_host_sao_preservados():
    url = preparar_url("postgresql://usuario:s3nh@@host.neon.tech/neondb?sslmode=verify-full")
    assert url.startswith("postgresql://usuario:s3nh@@host.neon.tech/neondb?")


URL = "postgresql://u:s@host/db?sslmode=verify-full&channel_binding=require"


@pytest.mark.parametrize(
    "valor",
    [
        URL,
        f"  {URL}\n",
        f"DATABASE_URL={URL}",
        f'DATABASE_URL="{URL}"',
        f"{URL}\n# Gere o segredo com: node -e ...\nJWT_SECRET=abc",
        f"# comentário\nDATABASE_URL={URL}",
    ],
)
def test_extrair_url_tolera_erros_ao_colar_o_segredo(valor):
    assert extrair_url(valor) == URL


@pytest.mark.parametrize("valor", ["", "# só um comentário", "host=x dbname=y", "mysql://u:s@h/db"])
def test_extrair_url_sem_url_postgresql_devolve_none(valor):
    assert extrair_url(valor) is None
