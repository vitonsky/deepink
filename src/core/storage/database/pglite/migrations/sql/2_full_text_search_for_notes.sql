CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Quick suggests for note titles
CREATE INDEX notes_trgm_idx ON notes USING GIN (title gin_trgm_ops, text gin_trgm_ops);

-- Full text search for notes
ALTER TABLE notes
	ADD COLUMN text_tsv tsvector
		GENERATED ALWAYS AS (to_tsvector('simple', title || ' ' || text)) STORED;
CREATE INDEX notes_text_tsv_idx ON notes USING GIN (text_tsv);

-- Lexemes to correct typos
CREATE TABLE lexemes(
  word text PRIMARY KEY,
  query tsquery NOT NULL
);
CREATE INDEX ON lexemes USING gin (word gin_trgm_ops);

-- Utils to build query with alternative lexemes while search query
CREATE OR REPLACE AGGREGATE tsquery_or_agg (tsquery) (
  SFUNC   = pg_catalog.tsquery_or,
  STYPE   = pg_catalog.tsquery
);

-- AND-aggregate: ANDs incoming tsquery values into one tsquery
CREATE OR REPLACE AGGREGATE tsquery_and_agg (tsquery) (
  SFUNC   = pg_catalog.tsquery_and,
  STYPE   = pg_catalog.tsquery
);