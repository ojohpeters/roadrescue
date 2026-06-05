"use client";

import { useState, useEffect } from "react";
import { Users, Activity, CheckCircle2, Clock, XCircle, RefreshCw } from "lucide-react";
import dynamic from "next/dynamic";
import type { RequestWithUsers } from "@/types";
import { ISSUE_TYPES, STATUS_LABELS, STATUS_COLORS } from "@/types";

const AdminMap = dynamic(() => import("@/components/map/AdminMap"), { ssr: false });

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  role: string;                              
  phone: string | null;
  isAvailable: boolean;
  createdAt: string;
  _count: { driverRequests: number; mechanicJobs: number };
}

type Tab = "overview" | "map" | "requests" | "users";

export default function AdminDashboard() {
  const [requests, setRequests] = useState<RequestWithUsers[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [view, setView] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    const [rRes, uRes] = await Promise.all([
      fetch("/api/requests"),
      fetch("/api/users"),
    ]);
    const [rData, uData] = await Promise.all([rRes.json(), uRes.json()]);
    if (Array.isArray(rData)) setRequests(rData);
    if (Array.isArray(uData)) setUsers(uData);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // Poll every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, []);

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "PENDING").length,
    active: requests.filter((r) => ["ACCEPTED", "ON_THE_WAY"].includes(r.status)).length,
    completed: requests.filter((r) => r.status === "COMPLETED").length,
    cancelled: requests.filter((r) => r.status === "CANCELLED").length,
    drivers: users.filter((u) => u.role === "DRIVER").length,
    mechanics: users.filter((u) => u.role === "MECHANIC").length,
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-8">
      <div className="max-w-5xl mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-white/50 text-sm mt-0.5">Live operations overview</p>
          </div>
          <button
            onClick={fetchAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-sm text-white/60 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/8 mb-6 overflow-x-auto">
          {(["overview", "map", "requests", "users"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setView(tab)}
              className={`flex-1 min-w-[80px] py-2 rounded-lg text-sm font-medium capitalize transition-all whitespace-nowrap ${
                view === tab ? "bg-orange-500 text-white" : "text-white/50 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {view === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Requests", value: stats.total, icon: Activity, color: "text-white" },
                { label: "Pending", value: stats.pending, icon: Clock, color: "text-yellow-400" },
                { label: "Active", value: stats.active, icon: RefreshCw, color: "text-blue-400" },
                { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-green-400" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="glass rounded-2xl p-4 border border-white/8">
                  <Icon className={`w-4 h-4 ${color} mb-2`} />
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-white/40 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "Cancelled", value: stats.cancelled, icon: XCircle, color: "text-red-400" },
                { label: "Registered Drivers", value: stats.drivers, icon: Users, color: "text-orange-400" },
                { label: "Active Mechanics", value: stats.mechanics, icon: Users, color: "text-purple-400" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="glass rounded-2xl p-4 border border-white/8">
                  <Icon className={`w-4 h-4 ${color} mb-2`} />
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-white/40 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Recent activity */}
            <div className="glass rounded-2xl p-5 border border-white/8">
              <h3 className="font-semibold mb-4 text-sm text-white/70">Recent Requests</h3>
              {loading ? (
                <div className="flex justify-center py-4"><RefreshCw className="w-5 h-5 animate-spin text-white/30" /></div>
              ) : requests.slice(0, 5).map((req) => (
                <div key={req.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{req.driver.name ?? req.driver.email}</p>
                    <p className="text-xs text-white/40">
                      {ISSUE_TYPES.find((i) => i.value === req.issueType)?.label ?? req.issueType}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[req.status]}`}>
                    {STATUS_LABELS[req.status]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LIVE MAP */}
        {view === "map" && (
          <div className="glass rounded-2xl p-4 border border-white/8">
            <h3 className="font-semibold mb-4 text-sm text-white/70">Live Operations Map</h3>
            <AdminMap requests={requests.filter((r) => r.status !== "COMPLETED" && r.status !== "CANCELLED")} />
          </div>
        )}

        {/* ALL REQUESTS */}
        {view === "requests" && (
          <div className="glass rounded-2xl border border-white/8 overflow-hidden">
            <div className="p-4 border-b border-white/8">
              <h3 className="font-semibold text-sm text-white/70">All Requests ({requests.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    {["Driver", "Issue", "Status", "Mechanic", "Time"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-white/40 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-8 text-white/30">Loading...</td></tr>
                  ) : requests.map((req) => (
                    <tr key={req.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">{req.driver.name ?? req.driver.email}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-white/60">
                        {ISSUE_TYPES.find((i) => i.value === req.issueType)?.label ?? req.issueType}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[req.status]}`}>
                          {STATUS_LABELS[req.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-white/60">
                        {req.mechanic?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-white/40 text-xs">
                        {new Date(req.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* USERS */}
        {view === "users" && (
          <div className="glass rounded-2xl border border-white/8 overflow-hidden">
            <div className="p-4 border-b border-white/8">
              <h3 className="font-semibold text-sm text-white/70">All Users ({users.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    {["Name", "Email", "Role", "Phone", "Requests", "Joined"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-white/40 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-8 text-white/30">Loading...</td></tr>
                  ) : users.map((u) => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap font-medium">{u.name ?? "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-white/60">{u.email}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          u.role === "ADMIN" ? "bg-purple-500/10 text-purple-400" :
                          u.role === "MECHANIC" ? "bg-blue-500/10 text-blue-400" :
                          "bg-orange-500/10 text-orange-400"
                        }`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-white/60">{u.phone ?? "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-white/60 text-xs">
                        {u._count.driverRequests + u._count.mechanicJobs}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-white/40 text-xs">
                        {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
