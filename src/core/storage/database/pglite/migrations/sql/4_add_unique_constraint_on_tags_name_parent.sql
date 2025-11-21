ALTER TABLE tags
ADD CONSTRAINT unique_tags UNIQUE NULLS NOT DISTINCT (name, parent, workspace_id);
