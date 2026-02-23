-- Banco: PostgreSQL (Neon ou Vercel Postgres)
-- Execute este SQL no painel do Neon (ou Vercel Postgres) para criar a tabela de usuários.

CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name         VARCHAR(255),
  avatar_url   TEXT,
  birth_date   DATE,
  city         VARCHAR(255),
  state        VARCHAR(255),
  country      VARCHAR(255),
  phone        VARCHAR(50),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para login por email
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Exemplo de tabela futura: lista de desejos (imagens = URL no campo, arquivo em storage)
-- CREATE TABLE IF NOT EXISTS wishlists (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--   product_id VARCHAR(255),
--   image_url TEXT,
--   created_at TIMESTAMPTZ NOT NULL DEFAULT now()
-- );
