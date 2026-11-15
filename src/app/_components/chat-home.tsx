"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUp, BookOpen, Plus, X } from "lucide-react";
import Link from "next/link";

import { ChatBookDetails } from "~/app/_components/chat-book-details";
import { ChatHeader } from "~/app/_components/chat-header";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { useChatHome } from "~/hooks/use-chat-home";

const starters = [
  "I want a tense, character-driven story",
  "What should I read after It?",
  "Something shorter and less graphic",
];

export function ChatHome({ readyCount }: { readyCount: number }) {
  const {
    messages,
    draft,
    setDraft,
    pending,
    error,
    selected,
    end,
    closeButton,
    newChat,
    send,
    stop,
    submit,
    openDetails,
    closeDetails,
    details,
  } = useChatHome(readyCount);
  const reduceMotion = useReducedMotion();

  return (
    <div className="bg-background text-foreground flex min-h-0 w-full flex-1 flex-col">
      <ChatHeader />
      <div
        className={`mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 sm:px-8 ${selected ? "lg:grid-cols-[minmax(0,1fr)_24rem]" : ""}`}
      >
        <section className="flex min-h-[calc(100dvh-5rem)] min-w-0 flex-col">
          {messages.length > 0 && (
            <div className="flex justify-end pt-5">
              <Button
                variant="ghost"
                type="button"
                onClick={newChat}
                className="min-h-11 gap-2 rounded-xl px-3 text-sm font-normal tracking-normal normal-case"
              >
                <Plus className="size-4" aria-hidden="true" />
                New chat
              </Button>
            </div>
          )}

          <div
            className="mx-auto w-full max-w-3xl flex-1 py-8 sm:py-12"
            role="log"
            aria-live="polite"
            aria-label="Conversation"
          >
            {messages.length === 0 ? (
              <div className="flex min-h-[50dvh] flex-col justify-center">
                <h2 className="max-w-xl text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
                  What are you in the mood for?
                </h2>
                <p className="text-muted-foreground mt-5 max-w-xl text-base leading-7">
                  Ask about your saved books, or tell me what kind of story you
                  want. I’ll use their AI profiles to suggest a good fit.
                </p>
                {readyCount === 0 ? (
                  <p className="text-muted-foreground mt-7 text-sm">
                    Your library has no enriched books yet.{" "}
                    <Link
                      className="text-foreground underline underline-offset-4"
                      href="/import/books"
                    >
                      Enrich a batch
                    </Link>{" "}
                    to start chatting.
                  </p>
                ) : (
                  <div className="mt-9 flex flex-wrap gap-2">
                    {starters.map((starter) => (
                      <Button
                        key={starter}
                        render={
                          <motion.button
                            whileTap={
                              reduceMotion ? undefined : { scale: 0.98 }
                            }
                          />
                        }
                        variant="outline"
                        type="button"
                        onClick={() => void send(starter)}
                        className="bg-card h-auto min-h-11 rounded-xl py-2.5 text-left text-sm font-normal tracking-normal whitespace-normal normal-case"
                      >
                        {starter}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                <AnimatePresence initial={false}>
                  {messages.map((message) => (
                    <motion.article
                      key={message.id}
                      initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={
                        reduceMotion
                          ? { duration: 0.16 }
                          : { type: "spring", bounce: 0, duration: 0.38 }
                      }
                      className={
                        message.role === "user" ? "flex justify-end" : ""
                      }
                    >
                      {message.role === "user" ? (
                        <p className="bg-secondary text-secondary-foreground max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap">
                          {message.content}
                        </p>
                      ) : (
                        <div>
                          <p className="max-w-prose text-[0.95rem] leading-7 whitespace-pre-wrap">
                            {message.content}
                          </p>
                          {!!message.recommendations?.length && (
                            <div className="mt-5 space-y-2">
                              {message.recommendations.map((book) => (
                                <Button
                                  key={book.id}
                                  render={
                                    <motion.button
                                      whileTap={
                                        reduceMotion
                                          ? undefined
                                          : { scale: 0.99 }
                                      }
                                    />
                                  }
                                  variant="outline"
                                  type="button"
                                  onClick={(event) =>
                                    openDetails(book, event.currentTarget)
                                  }
                                  className="bg-card h-auto w-full justify-start rounded-xl p-4 text-left font-normal tracking-normal whitespace-normal normal-case"
                                >
                                  <span className="flex items-start gap-3">
                                    <BookOpen
                                      className="text-muted-foreground mt-1 size-4 shrink-0"
                                      aria-hidden="true"
                                    />
                                    <span className="min-w-0 break-words">
                                      <strong className="block font-semibold">
                                        {book.title}
                                      </strong>
                                      <span className="text-muted-foreground mt-0.5 block text-xs">
                                        {book.authors.join(" · ") ||
                                          "Author unknown"}
                                      </span>
                                      <span className="mt-2 block text-sm leading-6">
                                        {book.reason}
                                      </span>
                                    </span>
                                  </span>
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.article>
                  ))}
                </AnimatePresence>
                {pending && (
                  <p
                    role="status"
                    className="text-muted-foreground flex items-center gap-2 text-sm"
                  >
                    <Spinner aria-hidden="true" />
                    Reading your library…
                  </p>
                )}
              </div>
            )}
            <div ref={end} />
          </div>

          <div className="bg-background sticky bottom-0 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6">
            <form
              onSubmit={submit}
              className="border-border bg-card focus-within:ring-ring/40 mx-auto flex max-w-3xl items-end gap-2 rounded-xl border p-2 focus-within:ring-2"
            >
              <Label htmlFor="chat-message" className="sr-only">
                Message your library
              </Label>
              <Textarea
                id="chat-message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    void send(draft);
                  }
                }}
                rows={1}
                maxLength={2000}
                disabled={readyCount === 0}
                placeholder={
                  readyCount
                    ? "Ask about your next book…"
                    : "Enrich books to start chatting"
                }
                className="max-h-40 min-h-11 flex-1 resize-none overflow-y-auto border-0 px-2 py-2.5 text-base focus-visible:border-0 disabled:cursor-not-allowed"
              />
              {pending ? (
                <Button
                  variant="secondary"
                  size="icon-lg"
                  type="button"
                  onClick={stop}
                  className="rounded-xl"
                  aria-label="Stop response"
                >
                  <X className="size-5" aria-hidden="true" />
                </Button>
              ) : (
                <Button
                  render={
                    <motion.button
                      whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                    />
                  }
                  size="icon-lg"
                  type="submit"
                  disabled={!draft.trim() || readyCount === 0}
                  className="rounded-xl"
                  aria-label="Send message"
                >
                  <ArrowUp className="size-5" aria-hidden="true" />
                </Button>
              )}
            </form>
            {error && (
              <Alert variant="destructive" className="mx-auto mt-2 max-w-3xl">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <p className="text-muted-foreground mx-auto mt-2 max-w-3xl text-center text-xs">
              Recommendations use your enriched Stephen King books.
            </p>
          </div>
        </section>

        <ChatBookDetails
          selected={selected}
          details={details}
          closeButton={closeButton}
          closeDetails={closeDetails}
        />
      </div>
    </div>
  );
}
