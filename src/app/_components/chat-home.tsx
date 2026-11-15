"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUp, BookOpen, X } from "lucide-react";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ChatActions } from "~/app/_components/chat-actions";
import { ChatBookDetails } from "~/app/_components/chat-book-details";
import { ChatLoadingStatus } from "~/app/_components/chat-loading-status";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { useChatHome } from "~/hooks/use-chat-home";
import {
  displayAuthorNames,
  displayBookTitle,
} from "~/lib/display-author-names";

const starters = [
  "I want a tense, character-driven story",
  "What should I read after It?",
  "Something shorter and less graphic",
];

export function ChatHome({
  readyCount,
  totalCount,
}: {
  readyCount: number;
  totalCount: number;
}) {
  const [transfer, setTransfer] = useState<{
    id: string;
    content: string;
    from: { left: number; top: number };
    to?: { left: number; top: number; width: number; height: number };
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const flightRef = useRef<HTMLParagraphElement>(null);
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
    openDetails,
    closeDetails,
    details,
  } = useChatHome(readyCount);
  const reduceMotion = useReducedMotion();

  function sendFromComposer(value: string) {
    const content = value.trim();
    if (!content || pending || readyCount === 0) return;
    const input = textareaRef.current?.getBoundingClientRect();
    if (!input) return void send(content);
    const id = crypto.randomUUID();
    setTransfer({
      id,
      content,
      from: {
        left: input.left + window.scrollX,
        top: input.top + window.scrollY,
      },
    });
    requestAnimationFrame(() => void send(content, id));
  }

  useLayoutEffect(() => {
    if (!transfer || transfer.to) return;
    const target = document.querySelector<HTMLElement>(
      `[data-user-message-id="${transfer.id}"]`,
    );
    if (!target) return;
    const rect = target.getBoundingClientRect();
    setTransfer((current) =>
      current?.id === transfer.id
        ? {
            ...current,
            to: {
              left: rect.left + window.scrollX,
              top: rect.top + window.scrollY,
              width: rect.width,
              height: rect.height,
            },
          }
        : current,
    );
  }, [messages, transfer]);

  useLayoutEffect(() => {
    if (!transfer?.to || !flightRef.current) return;
    if (reduceMotion) {
      setTransfer(null);
      return;
    }
    const animation = flightRef.current.animate(
      [
        { transform: "translate3d(0, 0, 0)" },
        {
          transform: `translate3d(${transfer.to.left - transfer.from.left}px, ${transfer.to.top - transfer.from.top}px, 0)`,
        },
      ],
      {
        duration: 260,
        easing: "cubic-bezier(0.23, 1, 0.32, 1)",
        fill: "forwards",
      },
    );
    animation.onfinish = () => setTransfer(null);
    return () => animation.cancel();
  }, [reduceMotion, transfer]);

  return (
    <div className="bg-background text-foreground flex min-h-dvh w-full flex-1 flex-col">
      <h1 className="sr-only">COBISS Book Finder</h1>
      <div
        className={`mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 sm:px-8 ${selected ? "lg:grid-cols-[minmax(0,1fr)_24rem]" : ""}`}
      >
        <section className="relative flex min-h-[calc(100dvh-5rem)] min-w-0 flex-col">
          <ChatActions newChat={newChat} hasMessages={messages.length > 0} />

          <div
            className="mx-auto w-full max-w-3xl flex-1 pt-16 pb-8"
            role="log"
            aria-live="polite"
            aria-label="Conversation"
          >
            {messages.length === 0 ? (
              <motion.div
                initial={{
                  opacity: 0,
                  transform: reduceMotion ? "none" : "translateY(10px)",
                }}
                animate={{ opacity: 1, transform: "translateY(0px)" }}
                transition={{
                  duration: reduceMotion ? 0.16 : 0.25,
                  ease: [0.23, 1, 0.32, 1],
                }}
                className="flex min-h-[50dvh] flex-col justify-center"
              >
                <h2 className="max-w-xl text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
                  What are you in the mood for?
                </h2>
                <p className="text-muted-foreground mt-5 max-w-xl text-base leading-7">
                  Ask about your saved books, or tell me what kind of story you
                  want. I’ll use their AI profiles to suggest a good fit.
                </p>
                <dl className="border-border mt-8 grid max-w-xl grid-cols-3 divide-x border-y py-4">
                  {[
                    ["Saved", totalCount],
                    ["Enriched", readyCount],
                    ["Need profile", Math.max(0, totalCount - readyCount)],
                  ].map(([label, value]) => (
                    <div key={label} className="px-3 first:pl-0 last:pr-0">
                      <dt className="text-muted-foreground text-xs">{label}</dt>
                      <dd className="mt-1 text-xl font-semibold tabular-nums">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
                {readyCount === 0 ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      duration: 0.2,
                      delay: reduceMotion ? 0 : 0.06,
                    }}
                    className="text-muted-foreground mt-7 text-sm"
                  >
                    Your library has no enriched books yet.{" "}
                    <Link
                      className="text-foreground underline underline-offset-4"
                      href="/import/books"
                    >
                      Enrich a batch
                    </Link>{" "}
                    to start chatting.
                  </motion.p>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      duration: 0.2,
                      delay: reduceMotion ? 0 : 0.06,
                    }}
                    className="mt-9 flex flex-wrap gap-2"
                  >
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
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <div className="space-y-8">
                <AnimatePresence initial={false}>
                  {messages.map((message) => (
                    <motion.article
                      key={message.id}
                      initial={{
                        opacity: message.role === "user" ? 1 : 0,
                        transform:
                          message.role === "user" || reduceMotion
                            ? "none"
                            : "translateY(10px)",
                      }}
                      animate={{
                        opacity: 1,
                        transform:
                          message.role === "user" || reduceMotion
                            ? "none"
                            : "translateY(0px)",
                      }}
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
                        <p
                          data-user-message-id={message.id}
                          style={{
                            opacity: transfer?.id === message.id ? 0 : 1,
                          }}
                          className="bg-secondary text-secondary-foreground max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap"
                        >
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
                                      className="text-primary mt-1 size-4 shrink-0"
                                      aria-hidden="true"
                                    />
                                    <span className="min-w-0 break-words">
                                      <strong className="block text-base font-semibold">
                                        {displayBookTitle(book.title)}
                                      </strong>
                                      <span className="text-muted-foreground mt-1 block text-xs">
                                        {displayAuthorNames(book.authors) ||
                                          "Author unknown"}
                                      </span>
                                      <span className="text-muted-foreground mt-2 block text-sm leading-6">
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
                  <ChatLoadingStatus reduceMotion={Boolean(reduceMotion)} />
                )}
              </div>
            )}
            <div ref={end} />
          </div>

          <div className="sticky bottom-0 z-10 bg-transparent pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendFromComposer(draft);
              }}
              className="border-border bg-card/50 focus-within:ring-ring/40 relative mx-auto flex max-w-3xl items-end justify-center gap-2 rounded-xl border p-2 backdrop-blur-sm focus-within:ring-2"
            >
              <Label htmlFor="chat-message" className="sr-only">
                Message your library
              </Label>
              <Textarea
                id="chat-message"
                ref={textareaRef}
                value={draft}
                style={{ opacity: transfer ? 0 : undefined }}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    sendFromComposer(draft);
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
              {transfer?.to &&
                createPortal(
                  <p
                    ref={flightRef}
                    className="bg-secondary text-secondary-foreground pointer-events-none absolute z-[60] rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap"
                    style={{
                      left: transfer.from.left,
                      top: transfer.from.top,
                      width: transfer.to.width,
                      height: transfer.to.height,
                    }}
                  >
                    {transfer.content}
                  </p>,
                  document.body,
                )}
              {pending ? (
                <Button
                  variant="secondary"
                  size="icon-lg"
                  type="button"
                  onClick={stop}
                  className="rounded-lg"
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
                  className="rounded-lg"
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
