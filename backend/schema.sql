CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
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

-- Perfumes (catálogo). Imagem principal em perfume_images (position 0); + image_2_url ... image_10_url (até 10 fotos)
CREATE TABLE IF NOT EXISTS perfumes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_url   TEXT NOT NULL UNIQUE,
  title          TEXT NOT NULL,
  description    TEXT,
  catalog_source VARCHAR(50) NOT NULL,
  notes          JSONB,
  variants       JSONB,
  image_2_url    TEXT,
  image_3_url    TEXT,
  image_4_url    TEXT,
  image_5_url    TEXT,
  image_6_url    TEXT,
  image_7_url    TEXT,
  image_8_url    TEXT,
  image_9_url    TEXT,
  image_10_url   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_perfumes_catalog_source ON perfumes (catalog_source);
CREATE INDEX IF NOT EXISTS idx_perfumes_title ON perfumes (title);

-- Imagens dos perfumes (URLs no Vercel Blob)
CREATE TABLE IF NOT EXISTS perfume_images (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfume_id UUID NOT NULL REFERENCES perfumes(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  position   INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_perfume_images_perfume_id ON perfume_images (perfume_id);
