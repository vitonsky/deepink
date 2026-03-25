-- Core tables
CREATE TABLE workspaces (
  id    TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  name  TEXT NOT NULL
);

CREATE TABLE notes (
  id               TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  workspace_id     TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  text             TEXT NOT NULL,
  archived         INTEGER NOT NULL DEFAULT 0,
  bookmarked       INTEGER NOT NULL DEFAULT 0,
  visible          INTEGER NOT NULL DEFAULT 1,
  history_disabled INTEGER NOT NULL DEFAULT 0,
  created_at       INTEGER NOT NULL DEFAULT (timestamp('now')),
  updated_at       INTEGER NOT NULL DEFAULT (timestamp('now')),
  deleted_at       INTEGER
);

CREATE TABLE note_versions (
  id         TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  note_id    TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL DEFAULT (timestamp('now')),
  title      TEXT NOT NULL,
  text       TEXT NOT NULL
);

CREATE TABLE files (
  id           TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at   INTEGER NOT NULL DEFAULT (timestamp('now')),
  name         TEXT NOT NULL,
  mimetype     TEXT NOT NULL
);

CREATE TABLE note_files (
  id           TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  file_id         TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE
);

CREATE TABLE tags (
  id           TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  parent_id       TEXT REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE note_tags (
  id           TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  tag_id       TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  note_id       TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_notes_workspace_id        ON notes(workspace_id);
CREATE INDEX idx_notes_deleted_archived ON notes(deleted_at, archived);
CREATE INDEX idx_note_versions_note_id     ON note_versions(note_id);
CREATE INDEX idx_note_files_note_id       ON note_files(note_id);
CREATE INDEX idx_note_tags_tag_id   ON note_tags(tag_id);
CREATE INDEX idx_note_tags_note_id   ON note_tags(note_id);
CREATE INDEX idx_tags_workspace_id         ON tags(workspace_id);
CREATE INDEX idx_tags_parent_id            ON tags(parent_id);