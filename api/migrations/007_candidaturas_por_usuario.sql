-- Status de candidatura passa a ser de cada usuário (antes era um só, na própria vaga).
CREATE TABLE IF NOT EXISTS candidaturas (
  usuario_id    INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  vaga_id       INTEGER NOT NULL REFERENCES vagas (id) ON DELETE CASCADE,
  status        TEXT NOT NULL
    CHECK (status IN ('pendente', 'enviada', 'entrevista', 'recusada', 'sem_interesse')),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (usuario_id, vaga_id)
);

-- A nota agora é calculada na hora pela API, com o perfil de quem está logado.
-- As colunas antigas (nota fixa e status único) deixam de existir na tabela de vagas.
ALTER TABLE vagas
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS status_atualizado_em,
  DROP COLUMN IF EXISTS nota_compatibilidade,
  DROP COLUMN IF EXISTS habilidades_encontradas,
  DROP COLUMN IF EXISTS requisitos_faltando,
  DROP COLUMN IF EXISTS diferenciais_faltando,
  DROP COLUMN IF EXISTS alertas,
  DROP COLUMN IF EXISTS motivo_eliminacao,
  DROP COLUMN IF EXISTS avaliada_em;
