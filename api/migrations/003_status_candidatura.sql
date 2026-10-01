-- Status da minha candidatura em cada vaga (atualizado pelo painel).
ALTER TABLE vagas
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'enviada', 'entrevista', 'recusada', 'sem_interesse')),
  ADD COLUMN IF NOT EXISTS status_atualizado_em TIMESTAMPTZ;
