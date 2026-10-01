import type { Member } from "@/db/schema";

export type FeedEvent = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: Date;
};

export function describeEvent(event: FeedEvent, membersById: Map<string, Member>): { icon: string; text: string } {
  const p = event.payload;
  switch (event.type) {
    case "overtake": {
      const overtaken = membersById.get(p.overtakenId as string);
      return {
        icon: "👀",
        text: `${p.actorName} passed ${overtaken?.name ?? "someone"} (−${(p.diff as number).toLocaleString()})`,
      };
    }
    case "lead_change":
      return { icon: "🥇", text: `${p.actorName} took the #1 spot for today` };
    case "milestone":
      if (p.kind === "streak") return { icon: "🔥", text: `${p.actorName} hit a ${p.streak}-day streak` };
      return { icon: "🎉", text: `${p.actorName} broke 20,000 steps today` };
    case "crown":
      return { icon: "👑", text: `${p.toName} took the crown this week` };
    case "weekly_recap":
      return { icon: "🏆", text: `Week over — ${p.winnerName ?? "someone"} won` };
    default:
      return { icon: "📣", text: event.type };
  }
}
