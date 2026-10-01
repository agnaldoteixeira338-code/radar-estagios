// Catálogo de tecnologias: fonte única usada no perfil (o usuário marca o que sabe)
// e no cálculo da nota (o padrão é procurado no texto da vaga).
//
// peso: pontos que a vaga soma quando pede uma tecnologia que a pessoa TEM.
// Quando a vaga exige uma tecnologia que a pessoa NÃO tem, ela tira pontos.

import { comLimitesDePalavra } from '../compatibilidade/regex';

export const CATEGORIAS = ['Linguagens', 'Front-end', 'Back-end', 'Dados', 'Mobile', 'Infra e ferramentas', 'Conceitos'] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export interface Tecnologia {
  id: string;
  nome: string;
  categoria: Categoria;
  padrao: RegExp;
  peso: number;
  // false: só soma pontos quando a pessoa tem; não tira pontos quando falta.
  // Usado em itens que descrevem a área da vaga, e não um requisito técnico.
  penalizaAusencia?: boolean;
}

// Os padrões são escritos com "\b" por legibilidade; no fim do arquivo cada "\b" é trocado
// por um limite de palavra que entende acentos (ver compatibilidade/regex.ts).
const TECNOLOGIAS: Tecnologia[] = [
  // Linguagens
  // "(?<!\.)js": o "js" de "Node.js", "React.js" etc. não conta como pedir JavaScript.
  { id: 'javascript', nome: 'JavaScript', categoria: 'Linguagens', padrao: /\bjavascript\b|(?<!\.)\bjs\b/i, peso: 8 },
  { id: 'typescript', nome: 'TypeScript', categoria: 'Linguagens', padrao: /\btypescript\b/i, peso: 7 },
  { id: 'python', nome: 'Python', categoria: 'Linguagens', padrao: /\bpython\b/i, peso: 8 },
  { id: 'java', nome: 'Java', categoria: 'Linguagens', padrao: /\bjava\b(?!\s*script)/i, peso: 8 },
  { id: 'csharp', nome: 'C#/.NET', categoria: 'Linguagens', padrao: /\bc#|\.net\b|\bdotnet\b/i, peso: 8 },
  { id: 'c-cpp', nome: 'C/C++', categoria: 'Linguagens', padrao: /\bc\s*\/\s*c\s*\+\+|\bc\s*\+\+|\blinguage(m|ns) c\b/i, peso: 6 },
  { id: 'php', nome: 'PHP', categoria: 'Linguagens', padrao: /\bphp\b/i, peso: 6 },
  { id: 'go', nome: 'Go', categoria: 'Linguagens', padrao: /\bgolang\b|\blinguagem go\b/i, peso: 5 },

  // Front-end
  { id: 'html-css', nome: 'HTML/CSS', categoria: 'Front-end', padrao: /\bhtml5?\b|\bcss3?\b/i, peso: 4 },
  { id: 'react', nome: 'React', categoria: 'Front-end', padrao: /\breact(\.?js)?\b(?!\s*native)/i, peso: 10 },
  { id: 'angular', nome: 'Angular', categoria: 'Front-end', padrao: /\bangular\b/i, peso: 7 },
  { id: 'vue', nome: 'Vue', categoria: 'Front-end', padrao: /\bvue(\.?js)?\b/i, peso: 7 },
  { id: 'figma', nome: 'Figma', categoria: 'Front-end', padrao: /\bfigma\b/i, peso: 2 },

  // Back-end
  { id: 'nodejs', nome: 'Node.js', categoria: 'Back-end', padrao: /\bnode(\.?js)?\b/i, peso: 10 },
  { id: 'express', nome: 'Express', categoria: 'Back-end', padrao: /\bexpress(\.?js)?\b/i, peso: 4 },
  { id: 'apis-rest', nome: 'APIs REST', categoria: 'Back-end', padrao: /\bapis?\b|\brest(ful)?\b/i, peso: 8 },
  { id: 'autenticacao', nome: 'JWT/Autenticação', categoria: 'Back-end', padrao: /\bjwt\b|autentica[cç][aã]o/i, peso: 3, penalizaAusencia: false },

  // Dados
  { id: 'sql', nome: 'SQL', categoria: 'Dados', padrao: /\bsql\b/i, peso: 8 },
  { id: 'postgresql', nome: 'PostgreSQL', categoria: 'Dados', padrao: /\bpostgre(s|sql)?\b/i, peso: 6 },
  { id: 'mysql', nome: 'MySQL', categoria: 'Dados', padrao: /\bmysql\b/i, peso: 5 },
  { id: 'mongodb', nome: 'MongoDB', categoria: 'Dados', padrao: /\bmongo(db)?\b/i, peso: 5 },
  { id: 'banco-de-dados', nome: 'Banco de dados', categoria: 'Dados', padrao: /bancos? de dados|\bdatabase/i, peso: 5 },
  { id: 'power-bi', nome: 'Power BI', categoria: 'Dados', padrao: /power\s*bi/i, peso: 5 },
  { id: 'excel', nome: 'Excel', categoria: 'Dados', padrao: /\bexcel\b/i, peso: 3 },

  // Mobile
  { id: 'react-native-flutter', nome: 'React Native/Flutter', categoria: 'Mobile', padrao: /react\s*native|\bflutter\b/i, peso: 6 },
  { id: 'kotlin', nome: 'Kotlin', categoria: 'Mobile', padrao: /\bkotlin\b/i, peso: 6 },

  // Infra e ferramentas
  { id: 'git', nome: 'Git', categoria: 'Infra e ferramentas', padrao: /\bgit(hub)?\b/i, peso: 4 },
  { id: 'docker', nome: 'Docker', categoria: 'Infra e ferramentas', padrao: /\bdocker\b/i, peso: 5 },
  { id: 'cloud', nome: 'Cloud (AWS/Azure/GCP)', categoria: 'Infra e ferramentas', padrao: /\baws\b|\bazure\b|\bgcp\b|google cloud/i, peso: 5 },
  { id: 'linux', nome: 'Linux', categoria: 'Infra e ferramentas', padrao: /\blinux\b/i, peso: 4 },
  {
    id: 'automacao',
    nome: 'Automação de processos',
    categoria: 'Infra e ferramentas',
    padrao:
      /automa[cç][aã]o (de |das? |dos? )?(rotinas|processos|atividades|tarefas|fluxos|workflows)|iniciativas de automa[cç][aã]o|automatizar (processos|rotinas|tarefas)|\bn8n\b|\bmake\.com\b|\brpa\b/i,
    peso: 5,
  },
  { id: 'testes', nome: 'Testes automatizados', categoria: 'Infra e ferramentas', padrao: /testes? (automatizad|unit[aá]ri)|\bjest\b|\bpytest\b|\bcypress\b/i, peso: 4 },

  // Conceitos
  { id: 'full-stack', nome: 'Full Stack', categoria: 'Conceitos', padrao: /\bfull[\s-]?stack\b/i, peso: 8, penalizaAusencia: false },
  { id: 'front-end', nome: 'Front-end', categoria: 'Conceitos', padrao: /\bfront[\s-]?end\b/i, peso: 5, penalizaAusencia: false },
  { id: 'back-end', nome: 'Back-end', categoria: 'Conceitos', padrao: /\bback[\s-]?end\b/i, peso: 5, penalizaAusencia: false },
  { id: 'logica', nome: 'Lógica de programação', categoria: 'Conceitos', padrao: /l[oó]gica de programa[cç][aã]o/i, peso: 3, penalizaAusencia: false },
];

export const CATALOGO: Tecnologia[] = TECNOLOGIAS.map((t) => ({ ...t, padrao: comLimitesDePalavra(t.padrao) }));

export const IDS_CATALOGO = new Set(CATALOGO.map((t) => t.id));

// Quem sabe a tecnologia da esquerda também sabe as da direita.
// Evita penalidades injustas, como "falta Banco de dados" para quem marcou PostgreSQL.
export const IMPLICACOES: Record<string, string[]> = {
  typescript: ['javascript'],
  react: ['javascript', 'html-css'],
  angular: ['javascript', 'html-css'],
  vue: ['javascript', 'html-css'],
  nodejs: ['javascript'],
  express: ['nodejs', 'javascript'],
  postgresql: ['sql', 'banco-de-dados'],
  mysql: ['sql', 'banco-de-dados'],
  mongodb: ['banco-de-dados'],
  sql: ['banco-de-dados'],
};

// Expande as habilidades marcadas com tudo o que elas implicam (de forma transitiva).
export function habilidadesEfetivas(marcadas: string[]): Set<string> {
  const resultado = new Set(marcadas);
  const pendentes = [...marcadas];
  while (pendentes.length > 0) {
    for (const implicada of IMPLICACOES[pendentes.pop()!] ?? []) {
      if (!resultado.has(implicada)) {
        resultado.add(implicada);
        pendentes.push(implicada);
      }
    }
  }
  return resultado;
}

// Versão para enviar ao navegador (sem o padrão de busca, que é detalhe interno).
export function catalogoPublico() {
  return CATALOGO.map(({ id, nome, categoria }) => ({ id, nome, categoria }));
}
