# Radar de Estágios

Sistema que coleta vagas de estágio automaticamente e calcula, para cada pessoa cadastrada, a compatibilidade de cada vaga com o perfil dela (o que sabe, formatura, inglês e modalidade preferida), mostrando o motivo de cada nota.

> 🚧 Em desenvolvimento

## Estrutura

```
radar-estagios/
  api/       → API REST em Node.js + TypeScript + Express
  coletor/   → coletor de vagas em Python (Gupy → PostgreSQL)
  web/       → painel em React + TypeScript (Vite)
```

## Configuração

Copie `api/.env.example` para `api/.env` e preencha `DATABASE_URL` com a string de conexão do seu PostgreSQL (ex.: Neon) e `JWT_SECRET` com um segredo aleatório de pelo menos 32 caracteres (o comando para gerar está no próprio arquivo). O coletor reaproveita esse mesmo arquivo.

### Segurança das contas

- Senhas guardadas só como hash bcrypt (custo 12); nunca aparecem nas respostas.
- Login devolve um token JWT (HS256, validade de 7 dias); tokens adulterados, vencidos ou sem assinatura são recusados.
- Mesma resposta e tempo parecido para "senha errada" e "e-mail não cadastrado", para não revelar quem tem conta.
- Limite de 10 tentativas de login/cadastro por IP a cada 15 minutos.
- A API não liga sem um `JWT_SECRET` forte configurado.

## API

```bash
cd api
npm install
npm run migrar  # cria as tabelas no banco
npm run dev     # http://localhost:4000
npm test        # testes automatizados
```

| Rota | Descrição |
|---|---|
| `GET /health` | Verifica se a API está no ar |
| `POST /auth/cadastro` | Cria uma conta. Corpo: `{ "email", "senha" }` (senha com 8+ caracteres; `nome` é opcional). Devolve `{ token, usuario }` |
| `POST /auth/login` | Entra na conta. Corpo: `{ "email", "senha" }`. Devolve `{ token, usuario }` |
| `GET /auth/eu` | Dados de quem está logado. Cabeçalho: `Authorization: Bearer <token>` |
| `GET /catalogo` | Lista pública das tecnologias que podem ser marcadas no perfil (`id`, `nome`, `categoria`) |
| `GET /perfil` | Perfil de quem está logado (vazio se ainda não preencheu). Exige login |
| `PUT /perfil` | Salva o perfil. Corpo: `{ "habilidades": ["react", "sql"], "formatura": "2028-01" ou null, "nivelIngles": "basico" \| "intermediario" \| "avancado" \| "fluente", "modalidades": ["presencial", "hibrido", "remoto"] }`. Exige login |
| `GET /vagas?modalidade=presencial&limite=20` | Lista as vagas com a nota calculada para o perfil de quem está logado, da maior para a menor. `modalidade`: `presencial`, `hibrido` ou `remoto`; `limite`: 1 a 100. Exige login |
| `PATCH /vagas/:id/status` | Atualiza o status da candidatura de quem está logado. Corpo: `{ "status": "enviada" }` (`pendente`, `enviada`, `entrevista`, `recusada` ou `sem_interesse`). Exige login |

### Nota de compatibilidade (0 a 100)

Calculada na hora, a cada pedido, com o perfil de quem está logado (`api/src/compatibilidade/avaliar.ts`) e o catálogo de tecnologias (`api/src/perfil/catalogo.ts`):

| Regra | Pontos |
|---|---|
| Base | 40 |
| Cada tecnologia do perfil que a vaga pede (peso por tecnologia) | até +50 |
| Título de desenvolvimento/software/full stack (+10) ou dados (+5) | até +10 |
| Cada requisito **obrigatório** do catálogo que a pessoa não tem | −8 (até −32) |
| Exige inglês avançado/fluente e o nível da pessoa é menor | −15 |
| Modalidade fora das preferidas no perfil | −10 |
| Exige formatura em data incompatível com a do perfil | nota 0 (eliminada) |

- Requisitos que aparecem como **diferencial/desejável** não tiram pontos: só são listados.
- Itens que descrevem a área da vaga (Full Stack, Front-end, Back-end, Lógica de programação) somam pontos, mas não tiram quando faltam.
- Habilidades implícitas: quem marca PostgreSQL também "sabe" SQL e Banco de dados; React, TypeScript ou Node.js implicam JavaScript (`IMPLICACOES` em `catalogo.ts`).
- Cada vaga traz o motivo da nota: tecnologias encontradas, o que falta, diferenciais e alertas (ex.: "vaga afirmativa").
- Os padrões de busca entendem acentos: "excelência" não é confundido com Excel, nem "expressão" com Express (o `\b` do JavaScript não reconhece letras acentuadas; ver `api/src/compatibilidade/regex.ts`).

## Painel

- **Entrar / Criar conta:** login com e-mail e senha; criação de conta com e-mail, senha e confirmação.
- **Meu perfil:** tecnologias agrupadas por categoria, previsão de formatura (opcional), nível de inglês e modalidades aceitas. No primeiro acesso, a pessoa cai direto aqui.
- **Vagas:** lista por nota de compatibilidade (calculada para o perfil de quem está logado), com filtros por modalidade e nota mínima, o motivo de cada nota (o que a pessoa tem, o que falta, diferenciais, alertas) e o status de cada candidatura.

```bash
cd web
npm install
npm run dev     # http://localhost:5173 (a API precisa estar rodando na porta 4000)
npm test        # testes dos componentes (Vitest + Testing Library)
```

## Coletor

Busca estágios no estado de São Paulo no portal público da Gupy, mantém só as vagas de TI (filtro pelo título) e salva no banco sem duplicar.

```bash
cd coletor
python -m venv .venv
.venv\Scripts\activate            # Windows (Linux/macOS: source .venv/bin/activate)
pip install -r requirements-dev.txt
python -m coletor                  # coleta e salva as vagas
pytest                             # testes automatizados
```

> O coletor usa o endereço interno que o site portal.gupy.io usa para listar vagas. Não é uma API oficial documentada e pode mudar. As requisições têm pausa entre si para não sobrecarregar o servidor.

## Tecnologias

Node.js · TypeScript · Express · JWT · bcrypt · Jest · Supertest · PostgreSQL (Neon) · Python · pytest · React · Vite · Vitest · Testing Library
