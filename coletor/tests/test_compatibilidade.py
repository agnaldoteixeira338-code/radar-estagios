import re

import pytest

from coletor.compatibilidade import (
    BASE,
    PENALIDADE_INGLES,
    avaliar,
    dividir_trechos,
    limpar_texto,
    verificar_formatura,
)

# Trechos reais de descrições da Gupy (01/10/2026) usados como base dos testes.


class TestFormatura:
    @pytest.mark.parametrize(
        "texto",
        [
            "Previsão de conclusão do curso a partir de 12/2028;",
            "Formatura prevista a partir de 2029",
            "formatura entre Dez/2028 e Jun/2030",
            "Previsão de conclusão até 12/2027",
        ],
    )
    def test_elimina_quando_a_data_nao_bate(self, texto):
        assert verificar_formatura(texto, formatura=(2028, 1)) is not None

    @pytest.mark.parametrize(
        "texto",
        [
            "Previsão de conclusão do curso a partir de 12/2027;",
            "formação prevista entre Dez/2027 e Jun/2029",
            "Formatura até 2028",
            "Estar cursando graduação no penúltimo ano",
        ],
    )
    def test_aceita_quando_a_data_bate_ou_nao_ha_regra(self, texto):
        assert verificar_formatura(texto, formatura=(2028, 1)) is None

    def test_mensagem_explica_o_motivo(self):
        motivo = verificar_formatura("conclusão do curso a partir de 12/2028", formatura=(2028, 1))
        assert motivo == "Exige formatura a partir de 12/2028"


class TestTrechos:
    def test_limpa_entidades_html_e_separa_secoes_coladas(self):
        texto = limpar_texto("Requisitos e qualificaçõesRequisitos:Cursando ADS;Diferencial:&nbsp;Linux")
        assert "&nbsp;" not in texto
        assert re.search(r"qualificações\n+Requisitos", texto)

    def test_nao_quebra_palavras_comuns(self):
        assert "criatividades" in limpar_texto("Buscamos criatividades no time")

    def test_marca_trechos_da_secao_de_diferenciais(self):
        texto = limpar_texto("Requisitos:SQL básico;Diferencial: Linux;Docker.Informações adicionais: VR")
        marcados = {t.strip(): d for t, d in dividir_trechos(texto)}
        assert marcados["SQL básico"] is False
        assert marcados["Linux"] is True
        assert marcados["Docker"] is True
        assert marcados["VR"] is False

    def test_frase_que_cita_diferencial_conta_como_diferencial(self):
        texto = limpar_texto("Swagger/OpenAPI, Linux, cloud ou ferramentas de integração serão considerados diferenciais")
        assert all(d for _, d in dividir_trechos(texto))

    def test_reconhece_requisitos_desejaveis_colado_ao_texto(self):
        # Texto real da FTD Educação.
        texto = limpar_texto(
            "Requisitos ObrigatóriosCursando TI. Requisitos DesejáveisConhecimento em Microsoft Dynamics 365 CRM. "
            "Conhecimento em C#, JavaScript ou Java. Conhecimento em Power Platform (Power BI)."
        )
        marcados = {t.strip(): d for t, d in dividir_trechos(texto)}
        assert marcados["Conhecimento em C#, JavaScript ou Java"] is True
        assert marcados["Conhecimento em Power Platform (Power BI)"] is True

    def test_nao_quebra_node_js_nem_ponto_net(self):
        trechos = [t for t, _ in dividir_trechos("Conhecimento em Node.js e .NET; Git")]
        assert trechos[0].strip() == "Conhecimento em Node.js e .NET"


class TestNota:
    def test_vaga_alinhada_ao_perfil_tem_nota_alta(self):
        a = avaliar(
            "Estágio em Desenvolvimento Full Stack",
            "Requisitos: JavaScript, React, Node.js, SQL e APIs REST; Git.",
        )
        assert a.nota >= 85
        assert {"React", "Node.js", "JavaScript", "SQL", "APIs REST", "Git", "Full Stack"} <= set(a.habilidades)
        assert a.lacunas_obrigatorias == []

    def test_lacuna_obrigatoria_tira_pontos_e_diferencial_nao(self):
        base = avaliar("Estágio em TI", "Requisitos: SQL;")
        com_obrigatoria = avaliar("Estágio em TI", "Requisitos: SQL; Java;")
        com_diferencial = avaliar("Estágio em TI", "Requisitos: SQL;Diferencial: Java")

        assert com_obrigatoria.lacunas_obrigatorias == ["Java"]
        assert com_obrigatoria.nota == base.nota - 8
        assert com_diferencial.lacunas_diferenciais == ["Java"]
        assert com_diferencial.nota == base.nota

    @pytest.mark.parametrize(
        "texto",
        [
            "Lógica de programação (Python, VBA ou similar) para automação de rotinas",
            "Trilha de Automação (RPA): criação de robôs",
            "Apoiar iniciativas de automação de atividades manuais",
            "scripts e ferramentas para automação das atividades da área",
            "Criar fluxos no n8n",
        ],
    )
    def test_reconhece_automacao_de_processos(self, texto):
        assert "Automação" in avaliar("Estágio em TI", texto).habilidades

    @pytest.mark.parametrize(
        "texto",
        [
            "Salas de reunião incluindo videoconferência e automação de sala",
            "Atuamos com serviços de TI, cloud, automação e soluções de logística",
            "Estágio em Automação Industrial com CLP",
        ],
    )
    def test_ignora_outros_tipos_de_automacao(self, texto):
        assert "Automação" not in avaliar("Estágio em TI", texto).habilidades

    def test_javascript_nao_conta_como_java(self):
        a = avaliar("Estágio", "Conhecimento em JavaScript")
        assert "Java" not in a.lacunas_obrigatorias + a.lacunas_diferenciais

    def test_ingles_avancado_obrigatorio_gera_alerta_e_penalidade(self):
        sem = avaliar("Estágio em TI", "Requisitos: SQL;")
        com = avaliar("Estágio em TI", "Requisitos: SQL; Inglês avançado para conversação com cliente;")
        assert com.alertas == ["Exige inglês avançado/fluente"]
        assert com.nota == sem.nota - PENALIDADE_INGLES

    def test_vaga_afirmativa_no_titulo_gera_alerta_sem_mudar_a_nota(self):
        comum = avaliar("Programa de Estágio em Tecnologia", "SQL")
        afirmativa = avaliar("Programa de Estágio em Tecnologia | Afirmativo para Pessoas Negras", "SQL")
        assert afirmativa.alertas == ["Vaga afirmativa: confira se você se enquadra"]
        assert afirmativa.nota == comum.nota

    def test_texto_geral_sobre_diversidade_nao_gera_alerta(self):
        a = avaliar("Estágio em TI", "Todas as nossas vagas são afirmativas e inclusivas.")
        assert a.alertas == []

    def test_ingles_de_leitura_nao_penaliza(self):
        a = avaliar("Estágio em TI", "Leitura intermediária de inglês técnico;")
        assert a.alertas == []

    def test_formatura_incompativel_zera_a_nota(self):
        a = avaliar("Estágio em Desenvolvimento", "React e Node.js; Previsão de conclusão do curso a partir de 12/2028;")
        assert a.nota == 0
        assert a.motivo_eliminacao == "Exige formatura a partir de 12/2028"

    def test_vaga_sem_nada_em_comum_fica_na_base(self):
        a = avaliar("Estágio em TI", "Atendimento a usuários.")
        assert a.nota == BASE
        assert a.habilidades == []

    def test_nota_fica_entre_0_e_100(self):
        texto = "Java; Kotlin; C++; TypeScript; Docker; Angular; Inglês fluente obrigatório"
        assert 0 <= avaliar("Estágio", texto).nota <= 100
        tudo = "React Node.js JavaScript SQL APIs REST Python full stack PostgreSQL banco de dados front-end back-end automação Express Git HTML"
        assert avaliar("Estágio em Desenvolvimento Full Stack", tudo).nota == 100
