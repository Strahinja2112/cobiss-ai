"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUp, BookOpen, Plus, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

import type { ChatRecommendation } from "~/app/api/_lib/chat";
import { ThemeToggle } from "~/components/theme-toggle";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendations?: ChatRecommendation[];
};

const starters = [
  "I want a tense, character-driven story",
  "What should I read after It?",
  "Something shorter and less graphic",
];

export function ChatHome({ readyCount }: { readyCount: number }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<ChatRecommendation | null>(null);
  const active = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const bookTrigger = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => () => active.current?.abort(), []);
  useEffect(() => {
    if (messages.length) end.current?.scrollIntoView({ block: "end" });
  }, [messages, pending]);
  useEffect(() => {
    if (!selected) return;
    closeButton.current?.focus();
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(null);
        bookTrigger.current?.focus();
      }
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [selected]);

  function newChat() {
    active.current?.abort();
    active.current = null;
    setMessages([]);
    setDraft("");
    setSelected(null);
    setError("");
    setPending(false);
  }

  async function send(value: string) {
    const content = value.trim();
    if (!content || active.current || readyCount === 0) return;
    const next: Message[] = [
      ...messages,
      { id: crypto.randomUUID(), role: "user", content },
    ];
    setMessages(next);
    setDraft("");
    setError("");
    setPending(true);
    const controller = new AbortController();
    active.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next
            .slice(-12)
            .map(({ role, content, recommendations }) => ({
              role,
              content:
                role === "assistant" && recommendations?.length
                  ? `${content}\nRecommended: ${recommendations.map((book) => book.title).join(", ")}`.slice(
                      0,
                      2000,
                    )
                  : content,
            })),
        }),
        signal: controller.signal,
      });
      const data = (await response.json()) as {
        answer?: string;
        recommendations?: ChatRecommendation[];
        error?: string;
      };
      const answer = data.answer;
      if (!response.ok || !answer)
        throw new Error(data.error ?? "Could not answer. Please try again.");
      if (!controller.signal.aborted) {
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: answer,
            recommendations: data.recommendations ?? [],
          },
        ]);
      }
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not answer. Try again.",
        );
    } finally {
      if (active.current === controller) {
        active.current = null;
        setPending(false);
      }
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(draft);
  }

  const profile =
    selected?.profile &&
    typeof selected.profile === "object" &&
    !Array.isArray(selected.profile)
      ? (selected.profile as Record<string, unknown>)
      : {};
  const profileFields = Object.entries(profile).flatMap(([key, value]) => {
    const values = Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : typeof value === "string" && value
        ? [value]
        : [];
    return values.length
      ? [{ label: key.replace(/([A-Z])/g, " $1"), values }]
      : [];
  });
  const details: [string, string[]][] = selected
    ? [
        ["Genres", selected.genres],
        ["Themes", selected.themes],
        ["Mood", selected.mood],
        ...profileFields.map(({ label, values }): [string, string[]] => [
          label,
          values,
        ]),
      ]
    : [];

  return (
    <div className="bg-background text-foreground flex min-h-0 w-full flex-1 flex-col">
      <div
        className={`mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 sm:px-8 ${selected ? "lg:grid-cols-[minmax(0,1fr)_24rem]" : ""}`}
      >
        <section className="flex min-h-[calc(100dvh-5rem)] min-w-0 flex-col">
          {messages.length > 0 && (
            <div className="flex justify-end pt-5">
              <button
                type="button"
                onClick={newChat}
                className="hover:bg-accent focus-visible:outline-ring inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <Plus className="size-4" aria-hidden="true" />
                New chat
              </button>
            </div>
          )}

          <div
            className="mx-auto w-full max-w-3xl flex-1 py-8 sm:py-12"
            role="log"
            aria-live="polite"
            aria-label="Conversation"
          >
            {messages.length === 0 ? (
              <div className="flex min-h-[52dvh] flex-col justify-center">
                <h2 className="max-w-xl text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
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
                      <motion.button
                        key={starter}
                        type="button"
                        onClick={() => void send(starter)}
                        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                        className="border-border bg-card hover:bg-accent focus-visible:outline-ring rounded-md border px-4 py-2.5 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                      >
                        {starter}
                      </motion.button>
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
                        <p className="bg-secondary text-secondary-foreground max-w-[85%] rounded-md px-4 py-3 text-sm leading-6 whitespace-pre-wrap">
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
                                <motion.button
                                  key={book.id}
                                  type="button"
                                  onClick={(event) => {
                                    bookTrigger.current = event.currentTarget;
                                    setSelected(book);
                                  }}
                                  whileTap={
                                    reduceMotion ? undefined : { scale: 0.99 }
                                  }
                                  className="border-border bg-card hover:bg-accent focus-visible:outline-ring w-full rounded-md border p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2"
                                >
                                  <span className="flex items-start gap-3">
                                    <BookOpen
                                      className="text-muted-foreground mt-1 size-4 shrink-0"
                                      aria-hidden="true"
                                    />
                                    <span className="min-w-0">
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
                                </motion.button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.article>
                  ))}
                </AnimatePresence>
                {pending && (
                  <p role="status" className="text-muted-foreground text-sm">
                    Reading your library…
                  </p>
                )}
              </div>
            )}
            <div ref={end} />
          </div>

          <div className="bg-background/95 sticky bottom-0 pt-3 pb-4 backdrop-blur-md sm:pb-6">
            <form
              onSubmit={submit}
              className="border-border bg-card mx-auto flex max-w-3xl items-end gap-3 rounded-md border p-3"
            >
              <label htmlFor="chat-message" className="sr-only">
                Message your library
              </label>
              <textarea
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
                rows={2}
                maxLength={2000}
                disabled={readyCount === 0}
                placeholder={
                  readyCount
                    ? "Ask about your next book…"
                    : "Enrich books to start chatting"
                }
                className="placeholder:text-muted-foreground max-h-40 min-h-12 flex-1 resize-y bg-transparent px-2 py-2 text-base outline-none disabled:cursor-not-allowed"
              />
              {pending ? (
                <button
                  type="button"
                  onClick={() => active.current?.abort()}
                  className="bg-secondary text-secondary-foreground hover:bg-accent focus-visible:outline-ring flex size-11 shrink-0 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2"
                  aria-label="Stop response"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              ) : (
                <motion.button
                  type="submit"
                  disabled={!draft.trim() || readyCount === 0}
                  whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex size-11 shrink-0 items-center justify-center rounded-md disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Send message"
                >
                  <ArrowUp className="size-5" aria-hidden="true" />
                </motion.button>
              )}
            </form>
            {error && (
              <p
                role="alert"
                className="text-destructive mx-auto mt-2 max-w-3xl text-sm"
              >
                {error}
              </p>
            )}
            <p className="text-muted-foreground mx-auto mt-2 max-w-3xl text-center text-xs">
              Recommendations use your enriched Stephen King books.
            </p>
          </div>
        </section>

        <AnimatePresence>
          {selected && (
            <motion.aside
              key={selected.id}
              initial={{ opacity: 0, x: reduceMotion ? 0 : 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reduceMotion ? 0 : 24 }}
              transition={
                reduceMotion
                  ? { duration: 0.16 }
                  : { type: "spring", bounce: 0, duration: 0.38 }
              }
              aria-label={`Details for ${selected.title}`}
              className="bg-card text-card-foreground lg:border-border fixed inset-0 z-30 overflow-y-auto p-6 lg:sticky lg:top-6 lg:mt-6 lg:h-[calc(100dvh-3rem)] lg:rounded-md lg:border"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {selected.title}
                  </h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {selected.authors.join(" · ") || "Author unknown"}
                  </p>
                </div>
                <button
                  ref={closeButton}
                  type="button"
                  onClick={() => {
                    setSelected(null);
                    bookTrigger.current?.focus();
                  }}
                  className="hover:bg-accent focus-visible:outline-ring rounded-md p-2 focus-visible:outline-2 focus-visible:outline-offset-2"
                  aria-label="Close book details"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>
              <p className="mt-6 text-sm leading-7">{selected.summary}</p>
              <div className="border-border mt-6 space-y-4 border-t pt-5 text-sm">
                {details.map(([label, values]) =>
                  values.length ? (
                    <div key={label}>
                      <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                        {label}
                      </h3>
                      <p className="mt-1 leading-6">{values.join(", ")}</p>
                    </div>
                  ) : null,
                )}
              </div>
              <a
                href={selected.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-block text-sm underline underline-offset-4"
              >
                View COBISS record
              </a>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
