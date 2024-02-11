-- Query to select tags with resolved name (like `foo/bar/baz`)
WITH RECURSIVE tagTree AS (
	SELECT
		id, parent, name, 1 AS segmentId, id AS tagTreeId
	FROM tags
	UNION ALL
	SELECT
		t2.id, t.parent, t.name, t2.segmentId + 1 AS segmentId, t2.tagTreeId AS tagTreeId
	FROM tags t
	INNER JOIN tagTree t2
	ON t.id = t2.parent
)
SELECT
	t.id, t.name, x.name as resolvedName, t.parent
FROM tags t
INNER JOIN (
	SELECT id, group_concat(name, '/') AS name
	FROM (
		SELECT * FROM tagTree ORDER BY segmentId DESC
	)
	GROUP BY tagTreeId
) x
ON t.id = x.id