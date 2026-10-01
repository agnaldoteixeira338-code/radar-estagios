from coletor.gupy import TAMANHO_PAGINA, buscar_vagas, normalizar


def vaga_bruta(**sobrescrever):
    vaga = {
        "id": 12452296,
        "name": "  Estágio em Desenvolvimento  ",
        "careerPageName": "Empresa Exemplo",
        "city": "São Paulo",
        "state": "São Paulo",
        "workplaceType": "hybrid",
        "jobUrl": "https://exemplo.gupy.io/job/abc",
        "description": "Descrição da vaga",
        "publishedDate": "2026-09-28T14:26:25.346Z",
    }
    vaga.update(sobrescrever)
    return vaga


class RespostaFalsa:
    def __init__(self, dados):
        self._dados = dados

    def raise_for_status(self):
        pass

    def json(self):
        return {"data": self._dados}


class SessaoFalsa:
    """Imita requests.Session devolvendo páginas pré-definidas e anotando os pedidos."""

    def __init__(self, paginas):
        self.paginas = list(paginas)
        self.pedidos = []

    def get(self, url, params=None, headers=None, timeout=None):
        self.pedidos.append(params)
        return RespostaFalsa(self.paginas.pop(0) if self.paginas else [])


def test_normalizar_converte_para_as_colunas_da_tabela():
    assert normalizar(vaga_bruta()) == {
        "fonte": "gupy",
        "id_externo": "12452296",
        "titulo": "Estágio em Desenvolvimento",
        "empresa": "Empresa Exemplo",
        "cidade": "São Paulo",
        "estado": "SP",
        "modalidade": "hibrido",
        "link": "https://exemplo.gupy.io/job/abc",
        "descricao": "Descrição da vaga",
        "publicada_em": "2026-09-28",
    }


def test_normalizar_traduz_todas_as_modalidades():
    assert normalizar(vaga_bruta(workplaceType="on-site"))["modalidade"] == "presencial"
    assert normalizar(vaga_bruta(workplaceType="remote"))["modalidade"] == "remoto"
    assert normalizar(vaga_bruta(workplaceType="desconhecida"))["modalidade"] is None
    assert normalizar(vaga_bruta(workplaceType=None))["modalidade"] is None


def test_normalizar_trata_campos_vazios_como_nulos():
    vaga = normalizar(vaga_bruta(city="", state="", description=None, publishedDate=None, careerPageName=""))
    assert vaga["cidade"] is None
    assert vaga["estado"] is None
    assert vaga["descricao"] is None
    assert vaga["publicada_em"] is None
    assert vaga["empresa"] == "Empresa não informada"


def test_buscar_vagas_para_quando_a_pagina_vem_incompleta():
    sessao = SessaoFalsa([[vaga_bruta(id=1), vaga_bruta(id=2)]])

    vagas = buscar_vagas("estágio TI", sessao=sessao, pausa=0)

    assert [v["id"] for v in vagas] == [1, 2]
    assert len(sessao.pedidos) == 1
    assert sessao.pedidos[0]["type"] == "vacancy_type_internship"
    assert sessao.pedidos[0]["state"] == "São Paulo"


def test_buscar_vagas_percorre_varias_paginas_ate_o_limite():
    pagina_cheia = [vaga_bruta(id=i) for i in range(TAMANHO_PAGINA)]
    sessao = SessaoFalsa([pagina_cheia, pagina_cheia, pagina_cheia])

    vagas = buscar_vagas("estágio TI", max_paginas=2, sessao=sessao, pausa=0)

    assert len(vagas) == 2 * TAMANHO_PAGINA
    assert [p["offset"] for p in sessao.pedidos] == [0, TAMANHO_PAGINA]


def test_buscar_vagas_sem_estado_nao_envia_filtro_de_estado():
    sessao = SessaoFalsa([[]])

    buscar_vagas("estágio TI", estado=None, sessao=sessao, pausa=0)

    assert "state" not in sessao.pedidos[0]
