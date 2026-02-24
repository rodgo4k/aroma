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
  role         VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Exemplo de tabela : 
-- CREATE TABLE IF NOT EXISTS wishlists (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--   product_id VARCHAR(255),
--   image_url TEXT,
--   created_at TIMESTAMPTZ NOT NULL DEFAULT now()
-- );
