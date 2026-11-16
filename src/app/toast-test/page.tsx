"use client";

import Link from "next/link";

import { Button } from "~/components/ui/button";
import { toast } from "~/components/ui/toast";

const examples = [
  { label: "Default", title: "A regular notification" },
  { label: "Success", title: "Changes saved", type: "success" },
  { label: "Info", title: "New books are available", type: "info" },
  { label: "Warning", title: "Check your selection", type: "warning" },
  { label: "Error", title: "Something went wrong", type: "error" },
  { label: "Loading", title: "Working on it", type: "loading" },
] as const;

const frequencies = {
  Default: 440,
  Success: 660,
  Info: 520,
  Warning: 350,
  Error: 220,
  Loading: 440,
  Action: 600,
  Promise: 440,
} as const;

function playSound(kind: keyof typeof frequencies) {
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequencies[kind];
  gain.gain.setValueAtTime(0.08, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.15);
  oscillator.connect(gain).connect(context.destination);
  oscillator.onended = () => void context.close();
  oscillator.start();
  oscillator.stop(context.currentTime + 0.15);
}

export default function ToastTestPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12 sm:px-8">
      <div>
        <Link href="/" className="text-muted-foreground text-sm underline">
          Back to chat
        </Link>
        <h1 className="mt-6 text-3xl font-semibold">Toast test</h1>
        <p className="text-muted-foreground mt-2">
          Try each notification style and sound. Toasts appear at the bottom of
          the screen.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {examples.map(({ label, title, ...options }) => (
          <Button
            key={label}
            variant="outline"
            className="rounded-full"
            onClick={() => {
              playSound(label);
              toast.add({
                title,
                description: `${label} toast example`,
                ...options,
              });
            }}
          >
            {label}
          </Button>
        ))}
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => {
            playSound("Action");
            toast.add({
              title: "Action available",
              description: "Try the button inside this toast.",
              actionProps: {
                children: "Try action",
                onClick: () => {
                  playSound("Success");
                  toast.add({ title: "Action clicked", type: "success" });
                },
              },
            });
          }}
        >
          Action
        </Button>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => {
            playSound("Promise");
            void toast.promise(
              new Promise<void>((resolve) => setTimeout(resolve, 1500)),
              {
                loading: { title: "Saving…", type: "loading" },
                success: { title: "Saved", type: "success" },
                error: { title: "Save failed", type: "error" },
              },
            );
          }}
        >
          Promise
        </Button>
        <Button
          variant="secondary"
          className="rounded-full"
          onClick={() => toast.close()}
        >
          Dismiss all
        </Button>
      </div>
    </div>
  );
}
