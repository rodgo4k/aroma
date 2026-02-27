-- Torna a coluna external_url da tabela perfumes opcional (não obrigatória)
ALTER TABLE perfumes
  ALTER COLUMN external_url DROP NOT NULL;

