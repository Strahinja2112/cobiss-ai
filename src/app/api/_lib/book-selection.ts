import type { Prisma } from "../../../../generated/prisma";

export const displayedBooks = {
  authors: { some: { name: { startsWith: "King, Stephen" } } },
} satisfies Prisma.BookWhereInput;
