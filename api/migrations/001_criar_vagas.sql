-- Tabela principal: cada linha é uma vaga de estágio coletada de alguma fonte (ex.: Gupy).
CREATE TABLE IF NOT EXISTS vagas (
  id                   SERIAL PRIMARY KEY,
  fonte                TEXT NOT NULL,                 -- de onde a vaga veio, ex.: 'gupy'
  id_externo           TEXT NOT NULL,                 -- id da vaga no site de origem
  titulo               TEXT NOT NULL,
  empresa              TEXT NOT NULL,
  cidade               TEXT,
  estado               TEXT,
  modalidade           TEXT CHECK (modalidade IN ('presencial', 'hibrido', 'remoto')),
  link                 TEXT NOT NULL,
  descricao            TEXT,
  publicada_em         DATE,
  nota_compatibilidade INTEGER CHECK (nota_compatibilidade BETWEEN 0 AND 100), -- preenchida pela IA
  criada_em            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- A mesma vaga não pode ser salva duas vezes vinda da mesma fonte.
  UNIQUE (fonte, id_externo)
);

-- Deixa rápida a listagem "melhores vagas primeiro".
CREATE INDEX IF NOT EXISTS idx_vagas_nota ON vagas (nota_compatibilidade DESC NULLS LAST);
