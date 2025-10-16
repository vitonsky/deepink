CREATE EXTENSION pg_trgm;
CREATE INDEX notes_trgm_idx ON notes USING GIN (title gin_trgm_ops, text gin_trgm_ops);

ALTER TABLE notes ADD COLUMN text_tsv tsvector GENERATED ALWAYS AS (to_tsvector('simple', text)) STORED;
CREATE INDEX notes_text_tsv_idx ON notes USING GIN (text_tsv);