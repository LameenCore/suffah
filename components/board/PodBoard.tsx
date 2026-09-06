"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import type { BoardThread, BoardPost } from "@/lib/db/board-queries";

type CreateAction = (form: FormData) => Promise<{ error?: string; held?: boolean } | void>;
type ThreadLoader = (threadId: string) => Promise<{ question: BoardPost; replies: BoardPost[] } | null>;
type ReportAction = (form: FormData) => Promise<{ error?: string } | void>;

export function PodBoard({
  podId,
  podName,
  threads,
  createAction,
  loadThread,
  reportAction,
  canModerate = false,
}: {
  podId: string;
  podName: string;
  threads: BoardThread[];
  createAction: CreateAction;
  loadThread: ThreadLoader;
  reportAction: ReportAction;
  canModerate?: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [thread, setThread] = useState<{ question: BoardPost; replies: BoardPost[] } | null>(null);
  const [newQ, setNewQ] = useState("");
  const [reply, setReply] = useState("");

  function submit(form: FormData, isReply: boolean) {
    setError(null);
    setNotice(null);
    start(async () => {
      const r = await createAction(form);
      if (r && "error" in r && r.error) return setError(r.error);
      if (r && r.held) setNotice(t("board.heldNotice"));
      if (isReply) {
        setReply("");
        if (open) void openThread(open);
      } else {
        setNewQ("");
      }
      router.refresh();
    });
  }

  async function openThread(id: string) {
    setOpen(id);
    setThread(null);
    const data = await loadThread(id);
    setThread(data);
  }

  function report(postId: string) {
    const reason = window.prompt(t("board.reportPrompt")) ?? "";
    const fd = new FormData();
    fd.set("postId", postId);
    fd.set("reason", reason);
    start(async () => {
      const r = await reportAction(fd);
      if (r && "error" in r && r.error) setError(r.error);
      else {
        setNotice(t("board.reportedNotice"));
        router.refresh();
        if (open) void openThread(open);
      }
    });
  }

  return (
    <div className="space-y-5">
      {notice ? (
        <p className="rounded-[var(--radius)] border border-teal/30 bg-teal-soft px-3 py-2 text-sm text-teal-strong">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-[var(--radius)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-[color:var(--ink)]">
          {error}
        </p>
      ) : null}

      <form
        action={(fd) => submit(fd, false)}
        className="space-y-2 rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]"
      >
        <input type="hidden" name="podId" value={podId} />
        <label className="block text-sm">
          <span className="text-ink-2">{t("board.askLabel")}</span>
          <textarea
            name="body"
            required
            rows={3}
            maxLength={2000}
            value={newQ}
            onChange={(e) => setNewQ(e.target.value)}
            className="mt-1 w-full rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-teal"
          />
        </label>
        <button
          type="submit"
          disabled={pending || !newQ.trim()}
          className="rounded-full bg-teal px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-strong disabled:opacity-60"
        >
          {t("board.askSubmit")}
        </button>
        <p className="text-xs text-ink-4">{t("board.adultNote")}</p>
      </form>

      {threads.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-border bg-surface-2 p-6 text-sm text-ink-3">
          {t("board.empty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {threads.map((th) => (
            <li
              key={th.question.id}
              className="rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-card)]"
            >
              <button
                type="button"
                onClick={() =>
                  open === th.question.id ? setOpen(null) : void openThread(th.question.id)
                }
                className="flex w-full items-start justify-between gap-3 p-4 text-left"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink">
                    {th.question.body}
                  </span>
                  <span className="mt-1 block text-xs text-ink-4">
                    {th.question.authorName} · {t("board.replies", { n: th.replyCount })}
                    {th.question.status === "held" ? ` · ${t("board.heldTag")}` : ""}
                    {th.hasHeld ? ` · ${t("board.hasHeldTag")}` : ""}
                  </span>
                </span>
                <span aria-hidden className="shrink-0 text-ink-4">
                  {open === th.question.id ? "−" : "+"}
                </span>
              </button>

              {open === th.question.id ? (
                <div className="border-t border-border p-4">
                  {!thread ? (
                    <p className="text-sm text-ink-4">{t("common.loading")}</p>
                  ) : (
                    <div className="space-y-3">
                      <Post post={thread.question} onReport={report} t={t} canModerate={canModerate} />
                      {thread.replies.map((r) => (
                        <div key={r.id} className="ml-4 border-l border-border pl-3">
                          <Post post={r} onReport={report} t={t} canModerate={canModerate} />
                        </div>
                      ))}
                      <form
                        action={(fd) => submit(fd, true)}
                        className="ml-4 space-y-2 border-l border-border pl-3"
                      >
                        <input type="hidden" name="podId" value={podId} />
                        <input type="hidden" name="threadId" value={th.question.id} />
                        <textarea
                          name="body"
                          required
                          rows={2}
                          maxLength={2000}
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          placeholder={t("board.replyPlaceholder")}
                          className="w-full rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-teal"
                        />
                        <button
                          type="submit"
                          disabled={pending || !reply.trim()}
                          className="rounded-full border border-border-strong bg-surface px-3.5 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:border-teal hover:text-teal disabled:opacity-60"
                        >
                          {t("board.replySubmit")}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-ink-4">{t("board.podScope", { pod: podName })}</p>
    </div>
  );
}

function Post({
  post,
  onReport,
  t,
  canModerate,
}: {
  post: BoardPost;
  onReport: (id: string) => void;
  t: ReturnType<typeof useT>;
  canModerate: boolean;
}) {
  return (
    <div className="text-sm">
      <p className="text-ink-2">{post.body}</p>
      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-4">
        <span>
          {post.authorName} · {post.authorRole}
        </span>
        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
        {post.status === "held" ? (
          <span className="text-mustard">{t("board.heldTag")}</span>
        ) : null}
        {!post.mine && !canModerate ? (
          <button
            type="button"
            onClick={() => onReport(post.id)}
            className="text-ink-4 underline hover:text-danger"
          >
            {t("board.report")}
          </button>
        ) : null}
      </p>
    </div>
  );
}
