-- Contas de usuário. A senha nunca é guardada: só o hash bcrypt dela.
CREATE TABLE IF NOT EXISTS usuarios (
  id         SERIAL PRIMARY KEY,
  nome       TEXT NOT NULL,
  email      TEXT NOT NULL,           -- sempre salvo em minúsculas pela API
  senha_hash TEXT NOT NULL,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Garante um e-mail por conta, sem diferenciar maiúsculas de minúsculas.
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios (LOWER(email));
