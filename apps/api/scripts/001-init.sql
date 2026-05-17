CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS toxic_terms (
  id         TEXT PRIMARY KEY,
  word       TEXT NOT NULL,
  embedding  vector(768) NOT NULL
);

CREATE INDEX IF NOT EXISTS toxic_terms_embedding_cos_idx
  ON toxic_terms
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
