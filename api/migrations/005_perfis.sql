-- Perfil de cada usuário: o que sabe e as preferências usadas no cálculo da nota.
-- Ao excluir a conta, o perfil é apagado junto (ON DELETE CASCADE).
CREATE TABLE IF NOT EXISTS perfis (
  usuario_id    INTEGER PRIMARY KEY REFERENCES usuarios (id) ON DELETE CASCADE,
  habilidades   TEXT[] NOT NULL DEFAULT '{}',   -- ids do catálogo de tecnologias
  formatura     DATE,                           -- sempre o dia 1 do mês previsto
  nivel_ingles  TEXT NOT NULL DEFAULT 'basico'
    CHECK (nivel_ingles IN ('basico', 'intermediario', 'avancado', 'fluente')),
  modalidades   TEXT[] NOT NULL DEFAULT '{presencial,hibrido,remoto}'
    CHECK (modalidades <@ ARRAY['presencial', 'hibrido', 'remoto'] AND CARDINALITY(modalidades) > 0),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
