import {
  avaliar,
  BASE,
  dividirTrechos,
  limparTexto,
  PENALIDADE_INGLES,
  PENALIDADE_LACUNA,
  PENALIDADE_MODALIDADE,
  verificarFormatura,
  type VagaParaAvaliar,
} from '../src/compatibilidade/avaliar';
import { CATALOGO, habilidadesEfetivas, IMPLICACOES } from '../src/perfil/catalogo';
import type { Perfil } from '../src/perfil/tipos';

// Perfil de exemplo: o mesmo conjunto de habilidades do currículo usado no coletor original.
const PERFIL: Perfil = {
  habilidades: [
    'react', 'nodejs', 'javascript', 'sql', 'apis-rest', 'python', 'full-stack', 'postgresql', 'banco-de-dados',
    'front-end', 'back-end', 'automacao', 'express', 'git', 'html-css', 'logica', 'autenticacao', 'figma',
  ],
  formatura: '2028-01',
  nivelIngles: 'intermediario',
  modalidades: ['presencial', 'hibrido'],
};

function vaga(titulo: string, descricao: string | null = '', modalidade: VagaParaAvaliar['modalidade'] = null): VagaParaAvaliar {
  return { titulo, descricao, modalidade };
}

// Trechos reais de descrições da Gupy (01/10/2026), os mesmos usados para validar a versão em Python.

describe('formatura', () => {
  it.each([
    'Previsão de conclusão do curso a partir de 12/2028;',
    'Formatura prevista a partir de 2029',
    'formatura entre Dez/2028 e Jun/2030',
    'Previsão de conclusão até 12/2027',
  ])('elimina quando a data não bate: %s', (texto) => {
    expect(verificarFormatura(texto, [2028, 1])).not.toBeNull();
  });

  it.each([
    'Previsão de conclusão do curso a partir de 12/2027;',
    'formação prevista entre Dez/2027 e Jun/2029',
    'Formatura até 2028',
    'Estar cursando graduação no penúltimo ano',
  ])('aceita quando a data bate ou não há regra: %s', (texto) => {
    expect(verificarFormatura(texto, [2028, 1])).toBeNull();
  });

  it('explica o motivo', () => {
    expect(verificarFormatura('conclusão do curso a partir de 12/2028', [2028, 1])).toBe('Exige formatura a partir de 12/2028');
  });

  it('zera a nota quando a formatura é incompatível', () => {
    const a = avaliar(vaga('Estágio em Desenvolvimento', 'React e Node.js; Previsão de conclusão do curso a partir de 12/2028;'), PERFIL);
    expect(a.nota).toBe(0);
    expect(a.motivoEliminacao).toBe('Exige formatura a partir de 12/2028');
  });

  it('sem formatura no perfil, não elimina ninguém', () => {
    const a = avaliar(vaga('Estágio em Desenvolvimento', 'Previsão de conclusão a partir de 12/2028;'), { ...PERFIL, formatura: null });
    expect(a.motivoEliminacao).toBeNull();
    expect(a.nota).toBeGreaterThan(0);
  });
});

describe('trechos', () => {
  it('limpa entidades HTML e separa seções coladas', () => {
    const texto = limparTexto('Requisitos e qualificaçõesRequisitos:Cursando ADS;Diferencial:&nbsp;Linux');
    expect(texto).not.toContain('&nbsp;');
    expect(texto).toMatch(/qualificações\n+Requisitos/);
  });

  it('não quebra palavras comuns', () => {
    expect(limparTexto('Buscamos criatividades no time')).toContain('criatividades');
  });

  it('marca os trechos da seção de diferenciais', () => {
    const trechos = dividirTrechos(limparTexto('Requisitos:SQL básico;Diferencial: Linux;Docker.Informações adicionais: VR'));
    const marcados = Object.fromEntries(trechos.map((t) => [t.trecho.trim(), t.diferencial]));
    expect(marcados['SQL básico']).toBe(false);
    expect(marcados['Linux']).toBe(true);
    expect(marcados['Docker']).toBe(true);
    expect(marcados['VR']).toBe(false);
  });

  it('frase que cita diferencial conta como diferencial', () => {
    const trechos = dividirTrechos(limparTexto('Swagger/OpenAPI, Linux, cloud ou ferramentas de integração serão considerados diferenciais'));
    expect(trechos.every((t) => t.diferencial)).toBe(true);
  });

  it('reconhece "Requisitos Desejáveis" colado ao texto (texto real da FTD Educação)', () => {
    const trechos = dividirTrechos(
      limparTexto(
        'Requisitos ObrigatóriosCursando TI. Requisitos DesejáveisConhecimento em Microsoft Dynamics 365 CRM. ' +
          'Conhecimento em C#, JavaScript ou Java. Conhecimento em Power Platform (Power BI).',
      ),
    );
    const marcados = Object.fromEntries(trechos.map((t) => [t.trecho.trim(), t.diferencial]));
    expect(marcados['Conhecimento em C#, JavaScript ou Java']).toBe(true);
    expect(marcados['Conhecimento em Power Platform (Power BI)']).toBe(true);
  });

  it('não quebra "Node.js" nem ".NET"', () => {
    expect(dividirTrechos('Conhecimento em Node.js e .NET; Git')[0].trecho.trim()).toBe('Conhecimento em Node.js e .NET');
  });

  it('decodifica entidades numéricas', () => {
    expect(limparTexto('Inform&#225;tica &#x26; dados')).toBe('Informática & dados');
  });
});

describe('nota', () => {
  it('vaga alinhada ao perfil tem nota alta', () => {
    const a = avaliar(vaga('Estágio em Desenvolvimento Full Stack', 'Requisitos: JavaScript, React, Node.js, SQL e APIs REST; Git.'), PERFIL);
    expect(a.nota).toBeGreaterThanOrEqual(85);
    expect(a.habilidadesEncontradas).toEqual(expect.arrayContaining(['React', 'Node.js', 'JavaScript', 'SQL', 'APIs REST', 'Git', 'Full Stack']));
    expect(a.requisitosFaltando).toEqual([]);
  });

  it('requisito obrigatório que falta tira pontos; diferencial não', () => {
    const base = avaliar(vaga('Estágio em TI', 'Requisitos: SQL;'), PERFIL);
    const obrigatoria = avaliar(vaga('Estágio em TI', 'Requisitos: SQL; Java;'), PERFIL);
    const diferencial = avaliar(vaga('Estágio em TI', 'Requisitos: SQL;Diferencial: Java'), PERFIL);

    expect(obrigatoria.requisitosFaltando).toEqual(['Java']);
    expect(obrigatoria.nota).toBe(base.nota - PENALIDADE_LACUNA);
    expect(diferencial.diferenciaisFaltando).toEqual(['Java']);
    expect(diferencial.nota).toBe(base.nota);
  });

  it('"Node.js", "React.js", "Vue.js" e "Express.js" não contam como pedir JavaScript', () => {
    const a = avaliar(vaga('Estágio', 'Node.js, React.js, Vue.js e Express.js'), { ...PERFIL, habilidades: [] });
    expect(a.requisitosFaltando).not.toContain('JavaScript');
    expect(a.requisitosFaltando).toEqual(expect.arrayContaining(['Node.js', 'React', 'Vue', 'Express']));
  });

  it('"JS" sozinho continua contando como JavaScript', () => {
    const a = avaliar(vaga('Estágio', 'Conhecimento em JS e HTML'), { ...PERFIL, habilidades: [] });
    expect(a.requisitosFaltando).toContain('JavaScript');
  });

  it('JavaScript não conta como Java', () => {
    const a = avaliar(vaga('Estágio', 'Conhecimento em JavaScript'), PERFIL);
    expect([...a.requisitosFaltando, ...a.diferenciaisFaltando]).not.toContain('Java');
  });

  it.each([
    'Lógica de programação (Python, VBA ou similar) para automação de rotinas',
    'Trilha de Automação (RPA): criação de robôs',
    'Apoiar iniciativas de automação de atividades manuais',
    'scripts e ferramentas para automação das atividades da área',
    'Criar fluxos no n8n',
  ])('reconhece automação de processos: %s', (texto) => {
    expect(avaliar(vaga('Estágio em TI', texto), PERFIL).habilidadesEncontradas).toContain('Automação de processos');
  });

  it.each([
    'Salas de reunião incluindo videoconferência e automação de sala',
    'Atuamos com serviços de TI, cloud, automação e soluções de logística',
    'Estágio em Automação Industrial com CLP',
  ])('ignora outros tipos de automação: %s', (texto) => {
    expect(avaliar(vaga('Estágio em TI', texto), PERFIL).habilidadesEncontradas).not.toContain('Automação de processos');
  });

  it('inglês avançado obrigatório gera alerta e penalidade', () => {
    const sem = avaliar(vaga('Estágio em TI', 'Requisitos: SQL;'), PERFIL);
    const com = avaliar(vaga('Estágio em TI', 'Requisitos: SQL; Inglês avançado para conversação com cliente;'), PERFIL);
    expect(com.alertas).toEqual(['Exige inglês avançado/fluente']);
    expect(com.nota).toBe(sem.nota - PENALIDADE_INGLES);
  });

  it('inglês avançado não penaliza quem tem inglês avançado', () => {
    const a = avaliar(vaga('Estágio em TI', 'Inglês avançado para conversação;'), { ...PERFIL, nivelIngles: 'avancado' });
    expect(a.alertas).toEqual([]);
  });

  it('inglês de leitura não penaliza', () => {
    expect(avaliar(vaga('Estágio em TI', 'Leitura intermediária de inglês técnico;'), PERFIL).alertas).toEqual([]);
  });

  it('vaga afirmativa no título gera alerta sem mudar a nota', () => {
    const comum = avaliar(vaga('Programa de Estágio em Tecnologia', 'SQL'), PERFIL);
    const afirmativa = avaliar(vaga('Programa de Estágio em Tecnologia | Afirmativo para Pessoas Negras', 'SQL'), PERFIL);
    expect(afirmativa.alertas).toEqual(['Vaga afirmativa: confira se você se enquadra']);
    expect(afirmativa.nota).toBe(comum.nota);
  });

  it('texto geral sobre diversidade não gera alerta', () => {
    expect(avaliar(vaga('Estágio em TI', 'Todas as nossas vagas são afirmativas e inclusivas.'), PERFIL).alertas).toEqual([]);
  });

  it('vaga sem nada em comum fica na base', () => {
    const a = avaliar(vaga('Estágio em TI', 'Atendimento a usuários.'), PERFIL);
    expect(a.nota).toBe(BASE);
    expect(a.habilidadesEncontradas).toEqual([]);
  });

  it('nota fica entre 0 e 100', () => {
    expect(avaliar(vaga('Estágio', 'Java; Kotlin; C++; TypeScript; Docker; Angular; Inglês fluente obrigatório'), PERFIL).nota).toBeGreaterThanOrEqual(0);
    const tudo = 'React Node.js JavaScript SQL APIs REST Python full stack PostgreSQL banco de dados front-end back-end automação de processos Express Git HTML';
    expect(avaliar(vaga('Estágio em Desenvolvimento Full Stack', tudo), PERFIL).nota).toBe(100);
  });
});

describe('nota depende do perfil de cada pessoa', () => {
  const vagaJava = vaga('Estágio em Desenvolvimento', 'Requisitos: Java; SQL;');

  it('quem sabe Java ganha pontos onde outra pessoa perde', () => {
    const semJava = avaliar(vagaJava, PERFIL);
    const comJava = avaliar(vagaJava, { ...PERFIL, habilidades: [...PERFIL.habilidades, 'java'] });

    expect(semJava.requisitosFaltando).toContain('Java');
    expect(comJava.requisitosFaltando).not.toContain('Java');
    expect(comJava.habilidadesEncontradas).toContain('Java');
    expect(comJava.nota).toBeGreaterThan(semJava.nota);
  });

  it('perfil vazio: nada encontrado e tudo que o catálogo exige aparece como faltando', () => {
    const vazio: Perfil = { habilidades: [], formatura: null, nivelIngles: 'basico', modalidades: ['presencial', 'hibrido', 'remoto'] };
    const a = avaliar(vagaJava, vazio);
    expect(a.habilidadesEncontradas).toEqual([]);
    expect(a.requisitosFaltando).toEqual(expect.arrayContaining(['Java', 'SQL']));
  });

  it('conceitos (Full Stack, Front-end, Back-end...) somam, mas não tiram pontos quando faltam', () => {
    const v = vaga('Estágio', 'Atuar no front-end e back-end de aplicações full stack; lógica de programação');
    const comConceitos = avaliar(v, PERFIL);
    const semConceitos = avaliar(v, { ...PERFIL, habilidades: ['sql'] });

    expect(comConceitos.habilidadesEncontradas).toEqual(expect.arrayContaining(['Full Stack', 'Front-end', 'Back-end']));
    expect(semConceitos.requisitosFaltando).toEqual([]);
    expect(semConceitos.nota).toBe(BASE);
  });

  it('modalidade fora da preferência gera alerta e tira pontos', () => {
    const presencial = avaliar(vaga('Estágio em TI', 'SQL', 'presencial'), PERFIL);
    const remota = avaliar(vaga('Estágio em TI', 'SQL', 'remoto'), PERFIL);

    expect(remota.alertas).toContain('Modalidade fora da sua preferência');
    expect(remota.nota).toBe(presencial.nota - PENALIDADE_MODALIDADE);
  });

  it('vaga sem modalidade informada não é penalizada', () => {
    expect(avaliar(vaga('Estágio em TI', 'SQL', null), PERFIL).alertas).toEqual([]);
  });
});

describe('limites de palavra com acento (bug do \\b do JavaScript)', () => {
  it.each([
    ['Excel', 'Buscamos a EXCELÊNCIA em tudo o que fazemos'],
    ['Express', 'Boa expressão oral e escrita'],
    ['Java', 'Conhecimento em javaé'],
    ['Go', 'linguagem gomosa'],
  ])('"%s" não aparece em palavra maior com acento: %s', (nome, texto) => {
    const a = avaliar(vaga('Estágio em TI', texto), { ...PERFIL, habilidades: [] });
    expect([...a.habilidadesEncontradas, ...a.requisitosFaltando, ...a.diferenciaisFaltando]).not.toContain(nome);
  });

  it.each([
    ['Excel', 'Conhecimento em Excel avançado'],
    ['Express', 'APIs com Express.js'],
    ['Excel', 'Pacote Office (Excel).'],
  ])('"%s" continua sendo reconhecido normalmente: %s', (nome, texto) => {
    const a = avaliar(vaga('Estágio em TI', texto), { ...PERFIL, habilidades: [] });
    expect(a.requisitosFaltando).toContain(nome);
  });
});

describe('habilidades implícitas', () => {
  it('quem marcou PostgreSQL não leva "falta SQL" nem "falta Banco de dados"', () => {
    const a = avaliar(vaga('Estágio', 'Requisitos: SQL e banco de dados relacional;'), { ...PERFIL, habilidades: ['postgresql'] });
    expect(a.requisitosFaltando).toEqual([]);
    expect(a.habilidadesEncontradas).toEqual(expect.arrayContaining(['SQL', 'Banco de dados']));
  });

  it('quem marcou React ou TypeScript não leva "falta JavaScript"', () => {
    for (const habilidade of ['react', 'typescript']) {
      const a = avaliar(vaga('Estágio', 'Requisitos: JavaScript;'), { ...PERFIL, habilidades: [habilidade] });
      expect(a.requisitosFaltando).not.toContain('JavaScript');
    }
  });

  it('implicações em cadeia: Express implica Node.js, que implica JavaScript', () => {
    expect([...habilidadesEfetivas(['express'])].sort()).toEqual(['express', 'javascript', 'nodejs']);
  });

  it('a implicação não vale ao contrário: saber SQL não significa saber PostgreSQL', () => {
    const a = avaliar(vaga('Estágio', 'Requisitos: PostgreSQL;'), { ...PERFIL, habilidades: ['sql'] });
    expect(a.requisitosFaltando).toContain('PostgreSQL');
  });

  it('todas as implicações apontam para tecnologias que existem no catálogo', () => {
    const ids = new Set(CATALOGO.map((t) => t.id));
    for (const [origem, destinos] of Object.entries(IMPLICACOES)) {
      expect(ids.has(origem)).toBe(true);
      for (const destino of destinos) expect(ids.has(destino)).toBe(true);
    }
  });
});

describe('catálogo', () => {
  it('nenhum padrão usa a flag "g" (com ela, .test() guarda estado entre chamadas e erra)', () => {
    expect(CATALOGO.filter((t) => t.padrao.global).map((t) => t.id)).toEqual([]);
  });

  it.each(CATALOGO.map((t) => [t.nome, t]))('o padrão de "%s" reconhece o próprio nome', (_nome, tecnologia) => {
    const exemplos: Record<string, string> = {
      'c-cpp': 'C++',
      csharp: 'C#',
      go: 'Golang',
      automacao: 'automação de processos',
      testes: 'testes automatizados',
      autenticacao: 'autenticação',
      'banco-de-dados': 'banco de dados',
      'react-native-flutter': 'React Native',
      cloud: 'AWS',
    };
    expect(tecnologia.padrao.test(exemplos[tecnologia.id] ?? tecnologia.nome)).toBe(true);
  });
});
