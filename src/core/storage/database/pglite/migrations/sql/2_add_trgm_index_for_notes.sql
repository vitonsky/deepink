CREATE EXTENSION pg_trgm;
CREATE INDEX notes_trgm_idx ON notes USING GIN (title gin_trgm_ops, text gin_trgm_ops);