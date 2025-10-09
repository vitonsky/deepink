-- TODO: make constraints for references
CREATE TABLE "notes" (
	"id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	"workspace_id" UUID NOT NULL,
	"created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
	"updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
	"title" TEXT NOT NULL,
	"text" TEXT NOT NULL,
	"history_disabled" BOOLEAN DEFAULT false,
	"visible" BOOLEAN DEFAULT true
);
-- Note text snapshots
CREATE TABLE "note_versions" (
	"id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	"note_id" UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
	"created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
	"title" TEXT NOT NULL,
	"text" TEXT NOT NULL
);
CREATE TABLE "files" (
	"id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	"workspace_id" UUID NOT NULL,
	"created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
	"name" TEXT NOT NULL,
	"mimetype" TEXT NOT NULL
);
CREATE TABLE "attachments" (
	"id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	"workspace_id" UUID NOT NULL,
	"file" UUID NOT NULL,
	"note" UUID NOT NULL,
	UNIQUE(file, note)
);
CREATE TABLE "tags" (
	"id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	"workspace_id" UUID NOT NULL,
	"name" TEXT NOT NULL,
	"parent" UUID,
	UNIQUE(name, parent)
);
-- TODO: rename fields to note_id and tag_id
CREATE TABLE "attached_tags" (
	"id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	"workspace_id" UUID NOT NULL,
	"source" UUID NOT NULL,
	"target" UUID NOT NULL,
	UNIQUE(source, target)
);
CREATE TABLE "workspaces" (
	"id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" TEXT NOT NULL
);