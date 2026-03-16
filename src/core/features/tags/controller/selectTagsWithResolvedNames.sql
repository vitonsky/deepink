-- Query to select tags with resolved name (like `foo/bar/baz`)
WITH RECURSIVE tagtree AS (
    SELECT
        id,
        parent,
        name,
        1 AS segment_id,
        id AS tag_tree_id
    FROM tags
  UNION ALL
    SELECT
        t.id,
        t.parent,
        t.name,
        tt.segment_id + 1 AS segment_id,
        tt.tag_tree_id
    FROM tags t
    JOIN tagtree tt ON t.id = tt.parent
),
sorted_tagtree AS (
    SELECT
        tag_tree_id,
        name,
        segment_id
    FROM tagtree
    ORDER BY tag_tree_id, segment_id DESC
)
SELECT
    t.id,
    t.name,
    x.resolved_name,
    t.parent,
    t.workspace_id
FROM tags t
JOIN (
    SELECT
        tag_tree_id AS id,
        group_concat(name, '/') AS resolved_name
    FROM sorted_tagtree
    GROUP BY tag_tree_id
) x ON t.id = x.id