# Radar de Estágios

Sistema que coleta vagas de estágio automaticamente, calcula a compatibilidade de cada vaga com o meu currículo usando IA e envia alertas diários com as melhores oportunidades.

> 🚧 Em desenvolvimento

## Estrutura

```
radar-estagios/
  api/       → API REST em Node.js + TypeScript + Express
  coletor/   → coletor de vagas em Python (em breve)
  web/       → painel em React (em breve)
```

## Rodando a API

```bash
cd api
npm install
npm run dev     # http://localhost:4000/health
npm test        # testes automatizados
```

## Tecnologias

Node.js · TypeScript · Express · Jest · Supertest · PostgreSQL (Neon) · Python · React · n8n
