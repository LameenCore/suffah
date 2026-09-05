"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitSupportAction } from "@/app/help/actions";
import { Button } from "@/components/ui/Button";

const CATS = [
  { value: "question", label: "Question" },
  { value: "bug", label: "Something's broken" },
  { value: "idea", label: "Idea / feedback" },
];

export function HelpForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [category, setCategory] = useState("question");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    start(async () => {
      setError(null);
      try {
        await submitSupportAction({ category, subject, body });
        setDone(true);
        setSubject("");
        setBody("");
        router.refresh();
        setTimeout(() => setDone(false), 5000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "could not send");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {CATS.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategory(c.value)}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
              category === c.value
                ? "border-terracotta bg-terracotta-soft font-medium text-terracotta-strong"
                : "border-border text-ink-3 hover:border-border-strong"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject"
        maxLength={160}
        className="w-full rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-terracotta"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Tell the masjid admin what's going on..."
        rows={5}
        className="w-full resize-y rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-terracotta"
      />

      <div className="flex items-center gap-3">
        <Button
          variant="accent"
          disabled={pending || !subject.trim() || !body.trim()}
          onClick={submit}
        >
          {pending ? "Sending..." : "Send to the masjid"}
        </Button>
        {done ? <span className="text-sm text-success">Sent. The admin has been notified.</span> : null}
        {error ? <span className="text-sm text-danger">{error}</span> : null}
      </div>
    </div>
  );
}
