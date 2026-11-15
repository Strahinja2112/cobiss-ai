import Link from "next/link";

import { ChatHome } from "~/app/_components/chat-home";
import { displayedBooks } from "~/app/api/_lib/book-selection";
import { ThemeToggle } from "~/components/theme-toggle";
import { env } from "~/env";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

export default async function Home() {
  const session = await auth();
  const allowed =
    session?.user?.email?.toLowerCase() ===
    env.ALLOWED_GOOGLE_EMAIL.toLowerCase();

  // if (!allowed) {
  //   return (
  //     <div className="mx-auto my-auto w-full max-w-lg px-5">
  //       <div className="bg-primary text-primary-foreground rounded-2xl p-8 sm:p-10">
  //         <h1 className="text-4xl font-semibold tracking-tight">
  //           Talk to your library.
  //         </h1>
  //         <p className="text-primary-foreground/80 mt-4 max-w-sm text-base leading-7">
  //           Ask for your next read using the books you saved and enriched.
  //         </p>
  //         <Link
  //           href="/api/auth/signin"
  //           className="bg-primary-foreground text-primary mt-8 inline-flex rounded-full px-5 py-3 text-sm font-semibold hover:opacity-90"
  //         >
  //           Sign in with Google
  //         </Link>
  //       </div>
  //       <div className="mt-5 flex justify-end">
  //         <div className="bg-primary text-primary-foreground rounded-md">
  //           <ThemeToggle />
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  const readyCount = await db.book.count({
    where: {
      ...displayedBooks,
      enrichment: {
        isNot: null,
      },
    },
  });
  return <ChatHome readyCount={readyCount} />;
}
