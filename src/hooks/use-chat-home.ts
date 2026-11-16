import { useEffect, useRef, useState, type FormEvent } from "react";

import type { ChatRecommendation } from "~/app/api/_lib/chat";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendations?: ChatRecommendation[];
};

export function useChatHome(readyCount: number) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<ChatRecommendation | null>(null);
  const active = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const bookTrigger = useRef<HTMLButtonElement>(null);

  useEffect(() => () => active.current?.abort(), []);
  useEffect(() => {
    if (messages.length)
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
  }, [messages, pending]);
  useEffect(() => {
    if (!selected) return;
    closeButton.current?.focus();
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDetails();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [selected]);

  function openDetails(book: ChatRecommendation, trigger: HTMLButtonElement) {
    bookTrigger.current = trigger;
    setSelected(book);
  }

  function closeDetails() {
    setSelected(null);
    bookTrigger.current?.focus();
  }

  function newChat() {
    active.current?.abort();
    active.current = null;
    setMessages([]);
    setDraft("");
    setSelected(null);
    setError("");
    setPending(false);
  }

  async function send(value: string, id = crypto.randomUUID()) {
    const content = value.trim();
    if (!content || active.current || readyCount === 0) return;
    const next: Message[] = [...messages, { id, role: "user", content }];
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

  function stop() {
    active.current?.abort();
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

  return {
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
  };
}
