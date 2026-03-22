-- TODO: enable references for workspace ids - `workspace_id TEXT NOT NULL REFERENCES workspaces(id),`
-- Core tables
CREATE TABLE workspaces (
  id    TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  name  TEXT NOT NULL
);

CREATE TABLE notes (
  id               TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  workspace_id     TEXT NOT NULL,
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
  title      TEXT NOT NULL,
  text       TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (timestamp('now'))
);

CREATE TABLE files (
  id           TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  workspace_id TEXT NOT NULL,
  name         TEXT NOT NULL,
  mimetype     TEXT NOT NULL,
  created_at   INTEGER NOT NULL DEFAULT (timestamp('now'))
);

CREATE TABLE attachments (
  id           TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  workspace_id TEXT NOT NULL,
  note         TEXT NOT NULL REFERENCES notes(id),
  file         TEXT NOT NULL REFERENCES files(id)
);

CREATE TABLE tags (
  id           TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  workspace_id TEXT NOT NULL,
  name         TEXT NOT NULL,
  parent       TEXT REFERENCES tags(id)
);

CREATE TABLE attached_tags (
  id           TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  workspace_id TEXT NOT NULL,
  source       TEXT NOT NULL,
  target       TEXT NOT NULL
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