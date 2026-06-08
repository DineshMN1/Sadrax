"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { LottiePlayer } from "@/components/lottie-player";
import loadingAnim from "@/lottie/loading.json";
import { formatDistanceToNow } from "date-fns";

interface Log {
  id: number;
  userName: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  summary: string | null;
  ip: string | null;
  createdAt: string;
}

const ACTION_TONE: Record<string, string> = {
  create: "bg-green-50 text-green-700",
  update: "bg-blue-50 text-blue-700",
  delete: "bg-red-50 text-red-600",
  status: "bg-amber-50 text-amber-700",
};

export default function AuditPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [entity, setEntity] = useState("all");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/audit");
      if (res.status === 403) { setForbidden(true); setLoading(false); return; }
      const data = await res.json();
      setLogs(data.logs ?? []);
      setLoading(false);
    })();
  }, []);

  const entities = useMemo(() => ["all", ...Array.from(new Set(logs.map((l) => l.entity)))], [logs]);
  const shown = entity === "all" ? logs : logs.filter((l) => l.entity === entity);

  if (forbidden) {
    return (
      <div className="flex flex-col items-center py-20 text-center text-gray-400">
        <ShieldAlert size={32} className="mb-3" />
        <p className="font-semibold text-gray-600">Admins only</p>
        <p className="text-sm">The audit trail is restricted to admin accounts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-400 mt-0.5">Every change made in the admin panel — who, what, when and from where.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {entities.map((e) => (
          <button key={e} onClick={() => setEntity(e)}
            className={`px-3 py-1.5 rounded-xl text-sm font-semibold capitalize transition-colors ${entity === e ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {e}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-4 flex justify-center"><LottiePlayer animationData={loadingAnim} loop className="w-28 h-28" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-150">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["When", "Who", "Action", "Change", "IP"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {shown.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50/50 align-top">
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDistanceToNow(new Date(l.createdAt), { addSuffix: true })}</td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{l.userName ?? "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ACTION_TONE[l.action] ?? "bg-gray-100 text-gray-600"}`}>{l.action}</span>
                    <span className="ml-1.5 text-xs text-gray-400 capitalize">{l.entity}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{l.summary ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs font-mono whitespace-nowrap">{l.ip ?? "—"}</td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-sm">No activity logged yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
