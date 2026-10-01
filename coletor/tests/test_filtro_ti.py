import pytest

from coletor.gupy import e_vaga_de_ti

# Títulos reais retornados pela Gupy em 01/10/2026.


@pytest.mark.parametrize(
    "titulo",
    [
        "Estágio em TI",
        "ESTÁGIO EM TI",
        "Estagio TI - Suporte N1",
        "Estágio em TI (Help Desk)",
        "Estágio em Desenvolvimento de Sistemas",
        "Estágio em Desenvolvimento de Integrações | Consultoria em TI.",
        "Estágio em Engenharia de Software",
        "Estágio em Testes de Software (Android, IA e Cibersegurança)",
        "Estágio em desenvolvimento Android",
        "Estágio em Programação - Realidade Aumentada",
        "Estagiária/Estagiário de Dados",
        "ESTÁGIO - ENGENHARIA/ANÁLISE DE DADOS",
        "Programa de Estágio - Cyber Security",
        "Programa de Estágio em Tecnologia | Afirmativo para Pessoas Negras",
        "Programa de Estágio - Suporte de TI",
    ],
)
def test_aceita_vagas_de_ti(titulo):
    assert e_vaga_de_ti(titulo)


@pytest.mark.parametrize(
    "titulo",
    [
        "Programa de Estágio MRV&CO | Engenharia Civil, Produção e Arquitetura",
        "Estagiário (a) de Obra - Programa de estágio 2026 2º semestre",
        "Programa de Estágio | Fonoaudiologia",
        "Programa de Estágio de Auditoria 2026 - São Paulo",
        "Programa de Estágio - Garantia da Qualidade",
        "Estágio de Sistema de Gestão - Seara | Osasco - SP",
        "Estágio de Desenvolvimento de Produtos Automotivos (Eletroeletrônica)",
        "ESTÁGIO - Pesquisa e Desenvolvimento em Engenharia",
        "PROGRAMA DE ESTÁGIO - ENGENHARIA DE PRODUÇÃO",
        "Programa de Estágio - Banco Digio 2026",
        "Programa de Estágio Superior | São Paulo 2.2026",
    ],
)
def test_descarta_vagas_que_nao_sao_de_ti(titulo):
    assert not e_vaga_de_ti(titulo)
