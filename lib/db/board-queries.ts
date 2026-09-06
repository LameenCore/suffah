// Pod discussion / Q&A board (T47) + moderation (T41). Every function is
// masjid-scoped and pod-scoped; a student only ever touches their own pod, a
// volunteer only pods they cover, an admin any pod in their masjid.

import { getServiceClient } from "@/lib/db";
import { getReadClient } from "@/lib/db/server";
import { recordAudit } from "@/lib/audit";
import { screenPost, maskPii } from "@/lib/moderation";
import type { SessionUser } from "@/lib/types";

export type PostStatus = "visible" | "held" | "hidden";

export interface BoardPost {
  id: string;
  threadId: string | null;
  authorUserId: string;
  authorName: string;
  authorRole: string;
  body: string;
  status: PostStatus;
  flagReason: string | null;
  createdAt: string;
  /** true for the viewer's own post */
  mine: boolean;
}

export interface BoardThread {
  question: BoardPost;
  replyCount: number;
  lastActivityAt: string;
  /** unresolved for the viewer: held (adult) */
  hasHeld: boolean;
}

const MAX_BODY = 2000;

function shape(r: Record<string, unknown>, viewerId: string): BoardPost {
  const author = (Array.isArray(r.author) ? r.author[0] : r.author) as
    | { name: string }
    | null;
  return {
    id: r.id as string,
    threadId: (r.thread_id as string | null) ?? null,
    authorUserId: r.author_user_id as string,
    authorName: author?.name ?? "—",
    authorRole: r.author_role as string,
    body: r.body as string,
    status: (r.status as PostStatus) ?? "visible",
    flagReason: (r.flag_reason as string | null) ?? null,
    createdAt: r.created_at as string,
    mine: r.author_user_id === viewerId,
  };
}

/** What a given viewer is allowed to see. Adults see everything; a student sees
 *  visible posts + their own held posts, never `hidden`. */
function canView(post: BoardPost, viewer: SessionUser): boolean {
  if (viewer.role === "admin" || viewer.role === "volunteer") return true;
  if (post.status === "visible") return true;
  if (post.status === "held" && post.mine) return true;
  return false;
}

/** Held posts are shown to their author with PII masked and no free text leak. */
function present(post: BoardPost, viewer: SessionUser): BoardPost {
  if (post.status === "held" && viewer.role === "student") {
    return { ...post, body: maskPii(post.body) };
  }
  return post;
}

export async function listPodThreads(
  podId: string,
  viewer: SessionUser,
): Promise<BoardThread[]> {
  const { data, error } = await (await getReadClient())
    .from("pod_board_posts")
    .select("*, author:users!pod_board_posts_author_user_id_fkey ( name )")
    .eq("pod_id", podId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`listPodThreads: ${error.message}`);

  const posts = ((data ?? []) as Record<string, unknown>[]).map((r) =>
    shape(r, viewer.id),
  );
  const questions = posts.filter((p) => p.threadId === null);
  const repliesByThread = new Map<string, BoardPost[]>();
  for (const p of posts) {
    if (p.threadId) {
      const list = repliesByThread.get(p.threadId) ?? [];
      list.push(p);
      repliesByThread.set(p.threadId, list);
    }
  }

  return questions
    .filter((q) => canView(q, viewer))
    .map((q) => {
      const replies = (repliesByThread.get(q.id) ?? []).filter((r) =>
        canView(r, viewer),
      );
      const times = [q.createdAt, ...replies.map((r) => r.createdAt)];
      return {
        question: present(q, viewer),
        replyCount: replies.length,
        lastActivityAt: times.sort().at(-1) ?? q.createdAt,
        hasHeld:
          (viewer.role === "admin" || viewer.role === "volunteer") &&
          [q, ...replies].some((p) => p.status === "held"),
      };
    })
    .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
}

export async function getThread(
  threadId: string,
  podId: string,
  viewer: SessionUser,
): Promise<{ question: BoardPost; replies: BoardPost[] } | null> {
  const { data, error } = await (await getReadClient())
    .from("pod_board_posts")
    .select("*, author:users!pod_board_posts_author_user_id_fkey ( name )")
    .eq("pod_id", podId)
    .or(`id.eq.${threadId},thread_id.eq.${threadId}`)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`getThread: ${error.message}`);

  const posts = ((data ?? []) as Record<string, unknown>[]).map((r) =>
    shape(r, viewer.id),
  );
  const question = posts.find((p) => p.id === threadId && p.threadId === null);
  if (!question || !canView(question, viewer)) return null;
  const replies = posts
    .filter((p) => p.threadId === threadId && canView(p, viewer))
    .map((p) => present(p, viewer));
  return { question: present(question, viewer), replies };
}

/** Create a question (threadId omitted) or a reply. Screens the body first. */
export async function createPost(input: {
  user: SessionUser;
  podId: string;
  threadId?: string | null;
  body: string;
}): Promise<{ held: boolean }> {
  const body = input.body.trim();
  if (!body) throw new Error("Write something first.");
  if (body.length > MAX_BODY) throw new Error(`Keep it under ${MAX_BODY} characters.`);

  const db = getServiceClient();

  // The reply must attach to a real question in this pod.
  let threadAuthorId: string | null = null;
  if (input.threadId) {
    const { data: parent } = await db
      .from("pod_board_posts")
      .select("id, pod_id, thread_id, author_user_id")
      .eq("id", input.threadId)
      .maybeSingle();
    if (!parent || parent.pod_id !== input.podId || parent.thread_id !== null) {
      throw new Error("That question no longer exists.");
    }
    threadAuthorId = parent.author_user_id as string;
  }

  const screen = screenPost(body);
  const { error } = await db.from("pod_board_posts").insert({
    masjid_id: input.user.masjidId,
    pod_id: input.podId,
    thread_id: input.threadId ?? null,
    author_user_id: input.user.id,
    author_role: input.user.role,
    body,
    status: screen.held ? "held" : "visible",
    flag_reason: screen.reason,
  });
  if (error) throw new Error(`createPost: ${error.message}`);

  // Barakah "helps others": a student answering another student's question.
  if (
    !screen.held &&
    input.threadId &&
    input.user.role === "student" &&
    threadAuthorId &&
    threadAuthorId !== input.user.id
  ) {
    await noteHelpfulReply(db, input.user, input.podId).catch(() => {});
  }

  return { held: screen.held };
}

/** One "cooperation" barakah note per student per pod per day for board help. */
async function noteHelpfulReply(
  db: ReturnType<typeof getServiceClient>,
  user: SessionUser,
  podId: string,
) {
  const dayAgo = new Date(Date.now() - 20 * 3600_000).toISOString();
  const { data: recent } = await db
    .from("pod_barakah_log")
    .select("id")
    .eq("student_user_id", user.id)
    .eq("indicator", "cooperation")
    .eq("recorded_by", "system")
    .gte("recorded_at", dayAgo)
    .limit(1);
  if (recent && recent.length > 0) return;

  await db.from("pod_barakah_log").insert({
    masjid_id: user.masjidId,
    pod_id: podId,
    student_user_id: user.id,
    indicator: "cooperation",
    note: "Answered a peer's question on the pod board.",
    recorded_by: "system",
  });
}

export async function reportPost(
  postId: string,
  reporter: SessionUser,
  reason: string,
): Promise<void> {
  const db = getServiceClient();
  const { data: post } = await db
    .from("pod_board_posts")
    .select("id, masjid_id, status")
    .eq("id", postId)
    .maybeSingle();
  if (!post || post.masjid_id !== reporter.masjidId) {
    throw new Error("Post not found.");
  }

  const { error } = await db.from("pod_board_reports").insert({
    post_id: postId,
    reporter_user_id: reporter.id,
    reason: reason.trim().slice(0, 500) || null,
  });
  // duplicate report from the same person is fine — swallow it
  if (error && !error.message.includes("duplicate")) {
    throw new Error(`reportPost: ${error.message}`);
  }

  // A reported post that's currently visible gets held for review.
  if (post.status === "visible") {
    await db
      .from("pod_board_posts")
      .update({ status: "held", flag_reason: "reported" })
      .eq("id", postId);
  }
}

/** Adult moderation: release a held post, or take one down. */
export async function moderatePost(
  postId: string,
  admin: SessionUser,
  action: "release" | "hide",
): Promise<void> {
  const db = getServiceClient();
  const { data: post } = await db
    .from("pod_board_posts")
    .select("id, masjid_id")
    .eq("id", postId)
    .maybeSingle();
  if (!post || post.masjid_id !== admin.masjidId) throw new Error("Post not found.");

  const { error } = await db
    .from("pod_board_posts")
    .update({
      status: action === "release" ? "visible" : "hidden",
      moderated_at: new Date().toISOString(),
      moderated_by: admin.id,
    })
    .eq("id", postId);
  if (error) throw new Error(`moderatePost: ${error.message}`);

  await db
    .from("pod_board_reports")
    .update({ resolved_at: new Date().toISOString(), resolved_by: admin.id })
    .eq("post_id", postId)
    .is("resolved_at", null);

  await recordAudit({
    actor: admin,
    action: action === "release" ? "board.post_released" : "board.post_hidden",
    targetType: "pod_board_post",
    targetId: postId,
  });
}

export interface QueueItem extends BoardPost {
  podName: string;
  reports: number;
}

/** Held / reported posts across the masjid, for the admin moderation queue. */
export async function listModerationQueue(masjidId: string): Promise<QueueItem[]> {
  const db = getServiceClient();
  const { data, error } = await db
    .from("pod_board_posts")
    .select(
      "*, author:users!pod_board_posts_author_user_id_fkey ( name ), pod:pods ( name ), reports:pod_board_reports ( id, resolved_at )",
    )
    .eq("masjid_id", masjidId)
    .eq("status", "held")
    .order("created_at", { ascending: true });
  if (error) throw new Error(`listModerationQueue: ${error.message}`);

  return ((data ?? []) as Record<string, unknown>[]).map((r) => {
    const pod = (Array.isArray(r.pod) ? r.pod[0] : r.pod) as { name: string } | null;
    const reports = (r.reports as { resolved_at: string | null }[] | null) ?? [];
    return {
      ...shape(r, ""),
      podName: pod?.name ?? "—",
      reports: reports.filter((x) => !x.resolved_at).length,
    };
  });
}

export async function countModerationQueue(masjidId: string): Promise<number> {
  const { count, error } = await getServiceClient()
    .from("pod_board_posts")
    .select("id", { count: "exact", head: true })
    .eq("masjid_id", masjidId)
    .eq("status", "held");
  if (error) throw new Error(`countModerationQueue: ${error.message}`);
  return count ?? 0;
}
