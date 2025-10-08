-- TODO: remove default value for `workspace_id` and make types stronger
CREATE TABLE "notes" (
	"id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
	"updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
	"workspace_id" TEXT NOT NULL DEFAULT 'none',
	"title" TEXT NOT NULL,
	"text" TEXT NOT NULL,
	"history_disabled" BOOLEAN DEFAULT false,
	"visible" BOOLEAN DEFAULT true
);
-- Note text snapshots
CREATE TABLE "note_versions" (
	"id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
	"note_id" TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
	"created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
	"title" TEXT NOT NULL,
	"text" TEXT NOT NULL
);
CREATE TABLE "files" (
	"id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
	"workspace_id" TEXT NOT NULL DEFAULT 'none',
	"name" TEXT NOT NULL,
	"mimetype" TEXT NOT NULL
);
CREATE TABLE "attachments" (
	"id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
	"workspace_id" TEXT NOT NULL DEFAULT 'none',
	"file" TEXT NOT NULL,
	"note" TEXT NOT NULL,
	UNIQUE(file, note)
);
CREATE TABLE "tags" (
	"id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
	"workspace_id" TEXT NOT NULL DEFAULT 'none',
	"name" TEXT NOT NULL,
	"parent" TEXT,
	UNIQUE(name, parent)
);
-- TODO: rename fields to note_id and tag_id
CREATE TABLE "attached_tags" (
	"id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
	"workspace_id" TEXT NOT NULL DEFAULT 'none',
	"source" TEXT NOT NULL,
	"target" TEXT NOT NULL,
	UNIQUE(source, target)
);
CREATE TABLE "workspaces" (
	"id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" TEXT NOT NULL
);