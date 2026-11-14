DO $$
BEGIN
    IF EXISTS (
        SELECT book."id", COALESCE(NULLIF(btrim(part.name), ''), 'Author unknown')
        FROM "Book" AS book
        CROSS JOIN LATERAL regexp_split_to_table(
            COALESCE(NULLIF(btrim(book."author"), ''), 'Author unknown'),
            '[[:space:]]*;[[:space:]]*'
        ) AS part(name)
        EXCEPT
        SELECT "B", "A" FROM "_AuthorToBook"
    ) THEN
        RAISE EXCEPTION 'Cannot drop Book.author: some author links are missing';
    END IF;
END $$;

ALTER TABLE "Book" DROP COLUMN "author";
