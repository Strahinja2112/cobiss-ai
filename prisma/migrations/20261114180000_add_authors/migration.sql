INSERT INTO "Author" ("name")
SELECT DISTINCT COALESCE(NULLIF(btrim(part.name), ''), 'Author unknown')
FROM "Book" AS book
CROSS JOIN LATERAL regexp_split_to_table(
    COALESCE(NULLIF(btrim(book."author"), ''), 'Author unknown'),
    '[[:space:]]*;[[:space:]]*'
) AS part(name)
WHERE true
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "_AuthorToBook" ("A", "B")
SELECT DISTINCT COALESCE(NULLIF(btrim(part.name), ''), 'Author unknown'), book."id"
FROM "Book" AS book
CROSS JOIN LATERAL regexp_split_to_table(
    COALESCE(NULLIF(btrim(book."author"), ''), 'Author unknown'),
    '[[:space:]]*;[[:space:]]*'
) AS part(name)
WHERE true
ON CONFLICT ("A", "B") DO NOTHING;
