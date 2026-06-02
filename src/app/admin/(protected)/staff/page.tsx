"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { UserPlus, Trash2, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";

interface StaffUser {
  id: string;
  name?: string;
  email?: string;
  role: string;
  createdAt: string;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "staff" });
  const { data: session } = authClient.useSession();
  const myRole = (session?.user as { role?: string })?.role;

  const fetchStaff = async () => {
    const res = await fetch("/api/admin/staff");
    const data = await res.json();
    setStaff(data.staff ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error("All fields are required");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${form.role === "admin" ? "Admin" : "Staff"} account created`);
        setShowForm(false);
        setForm({ name: "", email: "", password: "", role: "staff" });
        fetchStaff();
      } else {
        toast.error(data.error ?? "Failed to create account");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name}? They won't be able to log in.`)) return;
    const res = await fetch(`/api/admin/staff/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Account removed");
      fetchStaff();
    } else {
      toast.error("Failed to remove");
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Accounts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage who can access Admin and Cord</p>
        </div>
        {myRole === "admin" && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700"
          >
            <UserPlus size={15} /> Add Account
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
          <h2 className="font-semibold text-gray-900">New Account</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Full Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Ravi Kumar"
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400/30"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="ravi@sadrax.in"
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400/30"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Min 8 characters"
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400/30"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none"
              >
                <option value="staff">Staff (Cord + limited admin)</option>
                <option value="admin">Admin (full access)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowForm(false)} className="flex-1 h-10 border border-gray-200 rounded-xl text-sm text-gray-600">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={saving} className="flex-1 h-10 bg-green-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
              {saving ? "Creating…" : "Create Account"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-10 flex justify-center">
            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : staff.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No staff accounts yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {staff.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.role === "admin" ? "bg-green-100" : "bg-gray-100"}`}>
                  {s.role === "admin" ? (
                    <ShieldCheck size={16} className="text-green-600" />
                  ) : (
                    <User size={16} className="text-gray-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{s.name ?? "—"}</p>
                  <p className="text-xs text-gray-400 truncate">{s.email}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.role === "admin" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {s.role}
                </span>
                {myRole === "admin" && s.id !== session?.user.id && (
                  <button
                    onClick={() => handleDelete(s.id, s.name ?? s.email ?? "user")}
                    className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
