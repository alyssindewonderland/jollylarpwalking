import { desc } from "drizzle-orm";
import { db } from "@/db";
import { events, members, reactions } from "@/db/schema";
import { getSessionMemberId } from "@/lib/auth";
import { describeEvent } from "@/lib/feed";
import { ReactionComposer } from "@/components/ReactionComposer";

export const dynamic = "force-dynamic";

function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default async function ActivityPage() {
  const selfId = (await getSessionMemberId())!;
  const [eventRows, memberRows, reactionRows] = await Promise.all([
    db.select().from(events).orderBy(desc(events.createdAt)).limit(50),
    db.select().from(members),
    db.select().from(reactions).orderBy(desc(reactions.createdAt)).limit(100),
  ]);

  const membersById = new Map(memberRows.map((m) => [m.id, m]));
  const reactionsByEvent = new Map<string, typeof reactionRows>();
  const standaloneReactions = reactionRows.filter((r) => !r.eventId);
  for (const r of reactionRows) {
    if (!r.eventId) continue;
    if (!reactionsByEvent.has(r.eventId)) reactionsByEvent.set(r.eventId, []);
    reactionsByEvent.get(r.eventId)!.push(r);
  }

  const memberOptions = memberRows
    .filter((m) => m.id !== selfId)
    .map((m) => ({ id: m.id, name: m.name, emoji: m.emoji }));

  type Item = { id: string; createdAt: Date; icon: string; text: string; reactions: typeof reactionRows };

  const items: Item[] = [
    ...eventRows.map((e) => {
      const { icon, text } = describeEvent(e, membersById);
      return { id: e.id, createdAt: e.createdAt, icon, text, reactions: reactionsByEvent.get(e.id) ?? [] };
    }),
    ...standaloneReactions.map((r) => {
      const from = membersById.get(r.fromMember);
      const to = membersById.get(r.toMember);
      return {
        id: r.id,
        createdAt: r.createdAt,
        icon: r.emoji ?? "💬",
        text: r.message
          ? `${from?.name ?? "Someone"} to ${to?.name ?? "someone"}: "${r.message}"`
          : `${from?.name ?? "Someone"} reacted ${r.emoji ?? ""} to ${to?.name ?? "someone"}`,
        reactions: [],
      };
    }),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-sm text-muted">Activity</p>
        <h1 className="font-display text-3xl leading-none mt-1">What&apos;s happening</h1>
      </header>

      {memberOptions.length > 0 && <ReactionComposer members={memberOptions} />}

      <div className="flex flex-col gap-2">
        {items.length === 0 && (
          <p className="text-sm text-muted text-center py-8">No activity yet — sync your steps to get started.</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-border bg-surface p-3 animate-fade-up">
            <div className="flex items-start gap-3">
              <span className="text-lg leading-none mt-0.5">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{item.text}</p>
                <p className="text-xs text-muted mt-1">{timeAgo(item.createdAt)}</p>
              </div>
            </div>
            {item.reactions.length > 0 && (
              <div className="flex gap-1 mt-2 pl-7 flex-wrap">
                {item.reactions.map((r) => (
                  <span key={r.id} className="text-xs bg-background rounded-full px-2 py-0.5 border border-border">
                    {r.emoji}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
