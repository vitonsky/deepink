CREATE TABLE "notes" (
	"id" TEXT NOT NULL UNIQUE,
	"title" TEXT NOT NULL,
	"text" TEXT NOT NULL,
	"creationTime" INTEGER NOT NULL DEFAULT 0,
	"lastUpdateTime" INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY("id")
);
CREATE TABLE "files" (
	"id" TEXT NOT NULL UNIQUE,
	"name" TEXT NOT NULL,
	"mimetype" TEXT NOT NULL,
	PRIMARY KEY("id")
);
CREATE TABLE "attachments" (
	"id" TEXT NOT NULL UNIQUE,
	"file" TEXT NOT NULL,
	"note" TEXT NOT NULL,
	PRIMARY KEY("id") UNIQUE(file, note)
);
CREATE TABLE "tags" (
	"id" TEXT NOT NULL UNIQUE,
	"name" TEXT NOT NULL,
	"parent" TEXT,
	PRIMARY KEY("id") UNIQUE(name, parent)
);
CREATE TABLE "attachedTags" (
	"id" TEXT NOT NULL UNIQUE,
	"source" TEXT NOT NULL,
	"target" TEXT NOT NULL,
	PRIMARY KEY("id") UNIQUE(source, target)
);