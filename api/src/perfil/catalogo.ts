// Catálogo de tecnologias: fonte única usada no perfil (o usuário marca o que sabe)
// e no cálculo da nota (o padrão é procurado no texto da vaga).
//
// peso: pontos que a vaga soma quando pede uma tecnologia que a pessoa TEM.
// Quando a vaga exige uma tecnologia que a pessoa NÃO tem, ela tira pontos.

export const CATEGORIAS = ['Linguagens', 'Front-end', 'Back-end', 'Dados', 'Mobile', 'Infra e ferramentas', 'Conceitos'] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export interface Tecnologia {
  id: string;
  nome: string;
  categoria: Categoria;
  padrao: RegExp;
  peso: number;
}

// Observação: o \b do JavaScript só reconhece letras sem acento como "parte da palavra";
// por isso os padrões com acento evitam \b colado a letras acentuadas.
export const CATALOGO: Tecnologia[] = [
  // Linguagens
  { id: 'javascript', nome: 'JavaScript', categoria: 'Linguagens', padrao: /\bjavascript\b|\bjs\b/i, peso: 8 },
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
  { id: 'autenticacao', nome: 'JWT/Autenticação', categoria: 'Back-end', padrao: /\bjwt\b|autentica[cç][aã]o/i, peso: 3 },

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
  { id: 'full-stack', nome: 'Full Stack', categoria: 'Conceitos', padrao: /\bfull[\s-]?stack\b/i, peso: 8 },
  { id: 'front-end', nome: 'Front-end', categoria: 'Conceitos', padrao: /\bfront[\s-]?end\b/i, peso: 5 },
  { id: 'back-end', nome: 'Back-end', categoria: 'Conceitos', padrao: /\bback[\s-]?end\b/i, peso: 5 },
  { id: 'logica', nome: 'Lógica de programação', categoria: 'Conceitos', padrao: /l[oó]gica de programa[cç][aã]o/i, peso: 3 },
];

export const IDS_CATALOGO = new Set(CATALOGO.map((t) => t.id));

// Versão para enviar ao navegador (sem o padrão de busca, que é detalhe interno).
export function catalogoPublico() {
  return CATALOGO.map(({ id, nome, categoria }) => ({ id, nome, categoria }));
}
