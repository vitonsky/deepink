CREATE TABLE "bookmarks"(
    "note_id" UUID PRIMARY KEY REFERENCES notes(id) ON DELETE CASCADE,
    "workspace_id" UUID NOT NULL,
    UNIQUE (workspace_id, note_id)
)