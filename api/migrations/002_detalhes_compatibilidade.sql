-- Detalhes que explicam a nota de compatibilidade de cada vaga.
ALTER TABLE vagas
  ADD COLUMN IF NOT EXISTS habilidades_encontradas TEXT[] NOT NULL DEFAULT '{}', -- suas habilidades que a vaga pede
  ADD COLUMN IF NOT EXISTS requisitos_faltando     TEXT[] NOT NULL DEFAULT '{}', -- obrigatórios que você ainda não tem
  ADD COLUMN IF NOT EXISTS diferenciais_faltando   TEXT[] NOT NULL DEFAULT '{}', -- diferenciais que você ainda não tem
  ADD COLUMN IF NOT EXISTS alertas                 TEXT[] NOT NULL DEFAULT '{}', -- ex.: "Exige inglês avançado"
  ADD COLUMN IF NOT EXISTS motivo_eliminacao       TEXT,                         -- preenchido quando a nota é 0 por regra
  ADD COLUMN IF NOT EXISTS avaliada_em             TIMESTAMPTZ;
