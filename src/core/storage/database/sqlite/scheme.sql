-- Core tables
CREATE TABLE workspaces (
  id    TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  name  TEXT NOT NULL
);

CREATE TABLE files (
  id           TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  name         TEXT NOT NULL,
  mimetype     TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (now())
);

CREATE TABLE tags (
  id           TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  name         TEXT NOT NULL,
  parent       TEXT REFERENCES tags(id)
);

CREATE TABLE notes (
  id               TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  workspace_id     TEXT NOT NULL REFERENCES workspaces(id),
  title            TEXT NOT NULL,
  text             TEXT NOT NULL,
  archived         INTEGER NOT NULL DEFAULT 0,
  bookmarked       INTEGER NOT NULL DEFAULT 0,
  visible          INTEGER NOT NULL DEFAULT 1,
  history_disabled INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL DEFAULT (now()),
  updated_at       TEXT NOT NULL DEFAULT (now()),
  deleted_at       TEXT
);

CREATE TABLE note_versions (
  id         TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  note_id    TEXT NOT NULL REFERENCES notes(id),
  title      TEXT NOT NULL,
  text       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (now())
);

CREATE TABLE attached_tags (
  id           TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  source       TEXT NOT NULL,
  target       TEXT NOT NULL
);

CREATE TABLE attachments (
  id           TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  note         TEXT NOT NULL REFERENCES notes(id),
  file         TEXT NOT NULL REFERENCES files(id)
);

CREATE TABLE schema_migrations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  executed_at TEXT NOT NULL DEFAULT (now())
);

-- Indexes
CREATE INDEX idx_notes_workspace        ON notes(workspace_id);
CREATE INDEX idx_notes_deleted_archived ON notes(deleted_at, archived);
CREATE INDEX idx_note_versions_note     ON note_versions(note_id);
CREATE INDEX idx_attachments_note       ON attachments(note);
CREATE INDEX idx_attached_tags_source   ON attached_tags(source);
CREATE INDEX idx_attached_tags_target   ON attached_tags(target);
CREATE INDEX idx_tags_workspace         ON tags(workspace_id);
CREATE INDEX idx_tags_parent            ON tags(parent);