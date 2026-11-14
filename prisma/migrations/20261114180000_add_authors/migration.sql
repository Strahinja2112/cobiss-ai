CREATE TABLE "Author" (
    "name" TEXT NOT NULL,
    CONSTRAINT "Author_pkey" PRIMARY KEY ("name")
);

CREATE TABLE "_AuthorToBook" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_AuthorToBook_AB_pkey" PRIMARY KEY ("A", "B")
);

CREATE INDEX "_AuthorToBook_B_index" ON "_AuthorToBook"("B");

ALTER TABLE "_AuthorToBook" ADD CONSTRAINT "_AuthorToBook_A_fkey"
    FOREIGN KEY ("A") REFERENCES "Author"("name") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_AuthorToBook" ADD CONSTRAINT "_AuthorToBook_B_fkey"
    FOREIGN KEY ("B") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "Author" ("name")
SELECT DISTINCT COALESCE(NULLIF(btrim(part.name), ''), 'Author unknown')
FROM "Book" AS book
CROSS JOIN LATERAL regexp_split_to_table(
    COALESCE(NULLIF(btrim(book."author"), ''), 'Author unknown'),
    '[[:space:]]*;[[:space:]]*'
) AS part(name);

INSERT INTO "_AuthorToBook" ("A", "B")
SELECT DISTINCT COALESCE(NULLIF(btrim(part.name), ''), 'Author unknown'), book."id"
FROM "Book" AS book
CROSS JOIN LATERAL regexp_split_to_table(
    COALESCE(NULLIF(btrim(book."author"), ''), 'Author unknown'),
    '[[:space:]]*;[[:space:]]*'
) AS part(name);
