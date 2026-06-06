import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import type { auth } from "@/lib/auth";

type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

export function clientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? null;
}

interface AuditEntry {
  action: "create" | "update" | "delete" | "status";
  entity: string;
  entityId?: string | number | null;
  summary?: string;
}

// Fire-and-forget audit record. Never throws — auditing must not break a request.
export async function logAudit(req: Request, session: Session, entry: AuditEntry): Promise<void> {
  try {
    const user = session?.user as { id?: string; name?: string; email?: string } | undefined;
    await db.insert(auditLogs).values({
      userId: user?.id ?? null,
      userName: user?.name ?? user?.email ?? null,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId != null ? String(entry.entityId) : null,
      summary: entry.summary ?? null,
      ip: clientIp(req),
    });
  } catch {
    /* swallow — auditing is best-effort */
  }
}

// Build a "field: a → b" summary from changed keys between two objects.
export function diffSummary(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields?: string[],
): string {
  const keys = fields ?? Object.keys(after);
  const parts: string[] = [];
  for (const k of keys) {
    if (k in after && before[k] !== after[k]) {
      parts.push(`${k}: ${fmt(before[k])} → ${fmt(after[k])}`);
    }
  }
  return parts.join(", ");
}

function fmt(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "yes" : "no";
  return String(v);
}
