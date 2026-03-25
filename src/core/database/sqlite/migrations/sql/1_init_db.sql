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
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  file_id         TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  PRIMARY KEY (workspace_id, note_id, file_id)
);

CREATE TABLE tags (
  id           TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  parent_id       TEXT REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE note_tags (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  tag_id       TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  note_id       TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  PRIMARY KEY (workspace_id, note_id, tag_id)
);

-- Indexes
CREATE INDEX idx_notes_workspace_status
  ON notes(workspace_id, deleted_at, archived, bookmarked, visible, updated_at DESC);

CREATE INDEX idx_note_versions_note_id
  ON note_versions(note_id, created_at DESC);

CREATE INDEX idx_files_workspace_id
  ON files(workspace_id);

-- PK covers: WHERE workspace_id = ? AND note_id = ?
CREATE INDEX idx_note_files_workspace_file
  ON note_files(workspace_id, file_id);

CREATE UNIQUE INDEX uq_tags_root_name
  ON tags(workspace_id, name)
  WHERE parent_id IS NULL;

CREATE UNIQUE INDEX uq_tags_child_name
  ON tags(workspace_id, parent_id, name)
  WHERE parent_id IS NOT NULL;

CREATE INDEX idx_tags_workspace_parent
  ON tags(workspace_id, parent_id);

-- PK covers: WHERE workspace_id = ? AND note_id = ?
CREATE INDEX idx_note_tags_workspace_tag
  ON note_tags(workspace_id, tag_id);