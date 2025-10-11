CREATE EXTENSION pg_trgm;
CREATE INDEX notes_trgm_idx ON notes USING GIST (title gist_trgm_ops(siglen=32), text gist_trgm_ops(siglen=32));