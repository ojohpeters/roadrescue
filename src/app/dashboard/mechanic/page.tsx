"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Wrench, MapPin, Clock, CheckCircle2, Loader2, Navigation } from "lucide-react";
import dynamic from "next/dynamic";
import type { RequestWithUsers } from "@/types";
import { ISSUE_TYPES, STATUS_LABELS, STATUS_COLORS } from "@/types";

const TrackingMap = dynamic(() => import("@/components/map/TrackingMap"), { ssr: false });

function timeSince(date: Date | string): string {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

export default function MechanicDashboard() {
  const { data: session } = useSession();
  const [pendingJobs, setPendingJobs] = useState<RequestWithUsers[]>([]);
  const [activeJob, setActiveJob] = useState<RequestWithUsers | null>(null);
  const [view, setView] = useState<"jobs" | "active">("jobs");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");

  const fetchJobs = useCallback(async () => {
    const res = await fetch("/api/requests?status=PENDING");
    const data = await res.json();
    if (Array.isArray(data)) setPendingJobs(data);
  }, []);

  const fetchActive = useCallback(async () => {
    const res = await fetch("/api/requests");
    const all: RequestWithUsers[] = await res.json();
    if (!Array.isArray(all)) return;
    const mine = all.find(
      (r) => r.mechanicId === session?.user?.id && ["ACCEPTED", "ON_THE_WAY"].includes(r.status)
    );
    if (mine) {
      setActiveJob(mine);
      setView("active");
    } else if (activeJob) {
      setActiveJob(null);
      setView("jobs");
    }
  }, [session?.user?.id, activeJob]);

  // Initial load
  useEffect(() => {
    Promise.all([fetchJobs(), fetchActive()]).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchJobs();
      fetchActive();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchJobs, fetchActive]);

  async function patchRequest(id: string, status: string) {
    setActionLoading(id + status);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data: RequestWithUsers = await res.json();
      if (!res.ok) return;
      if (status === "ACCEPTED") {
        setActiveJob(data);
        setPendingJobs((prev) => prev.filter((r) => r.id !== id));
        setView("active");
      } else if (status === "ON_THE_WAY") {
        setActiveJob(data);
      } else if (status === "COMPLETED") {
        setActiveJob(null);
        setView("jobs");
        fetchJobs();
      }
    } finally {
      setActionLoading("");
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-8">
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            Hi, {session?.user?.name?.split(" ")[0] ?? "Mechanic"}
          </h1>
          <p className="text-white/50 text-sm mt-0.5">
            {activeJob ? "You have an active job" : `${pendingJobs.length} job${pendingJobs.length !== 1 ? "s" : ""} available nearby`}
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/8 mb-6">
          {(["jobs", "active"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setView(tab)}
              disabled={tab === "active" && !activeJob}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                view === tab ? "bg-orange-500 text-white" : "text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              }`}
            >
              {tab === "jobs" ? `Available Jobs${pendingJobs.length > 0 ? ` (${pendingJobs.length})` : ""}` : "Active Job"}
            </button>
          ))}
        </div>

        {/* AVAILABLE JOBS */}
        {view === "jobs" && (
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-white/40" />
              </div>
            ) : pendingJobs.length === 0 ? (
              <div className="glass rounded-2xl p-10 border border-white/8 text-center">
                <Wrench className="w-8 h-8 text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm">No pending jobs right now.</p>
                <p className="text-white/25 text-xs mt-1">New requests will appear here instantly.</p>
              </div>
            ) : (
              pendingJobs.map((job) => (
                <div key={job.id} className="glass rounded-2xl p-5 border border-white/8 hover:border-white/15 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">
                        {ISSUE_TYPES.find((i) => i.value === job.issueType)?.label ?? job.issueType}
                      </p>
                      <p className="text-xs text-white/40 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" /> {timeSince(job.createdAt)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[job.status]}`}>
                      {STATUS_LABELS[job.status]}
                    </span>
                  </div>

                  <p className="text-sm text-white/60 mb-3 line-clamp-2">{job.description}</p>

                  {job.address && (
                    <p className="text-xs text-white/40 flex items-start gap-1 mb-2">
                      <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {job.address.slice(0, 80)}
                    </p>
                  )}

                  {job.locationDescription && (
                    <p className="text-xs text-white/60 flex items-start gap-1 mb-2">
                      <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-400" />
                      {job.locationDescription}
                    </p>
                  )}

                  {job.willProvideDirections && (
                    <p className="text-[11px] text-amber-400 flex items-center gap-1 mb-3">
                      <Navigation className="w-3 h-3" /> No GPS pin — driver will guide you in by phone
                    </p>
                  )}

                  <button
                    onClick={() => patchRequest(job.id, "ACCEPTED")}
                    disabled={actionLoading === job.id + "ACCEPTED" || !!activeJob}
                    className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {actionLoading === job.id + "ACCEPTED" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <><CheckCircle2 className="w-4 h-4" /> Accept Mission</>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ACTIVE JOB */}
        {view === "active" && activeJob && (
          <div className="space-y-4">
            {/* Status */}
            <div className="glass rounded-2xl p-5 border border-white/8">
              <p className="text-xs text-white/40 mb-2">Current Status</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[activeJob.status]}`}>
                {STATUS_LABELS[activeJob.status]}
              </span>
            </div>

            {/* Driver info */}
            <div className="glass rounded-2xl p-5 border border-white/8">
              <p className="text-xs text-white/40 mb-3">Driver Details</p>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                  <span className="text-orange-400 font-bold text-sm">
                    {(activeJob.driver.name ?? "D")[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{activeJob.driver.name ?? "Driver"}</p>
                  {activeJob.driver.phone && (
                    <a href={`tel:${activeJob.driver.phone}`} className="text-sm text-orange-400 hover:underline">
                      {activeJob.driver.phone}
                    </a>
                  )}
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-3 mb-4">
                <p className="text-xs text-white/40 mb-1">Issue</p>
                <p className="text-sm font-medium">
                  {ISSUE_TYPES.find((i) => i.value === activeJob.issueType)?.label ?? activeJob.issueType}
                </p>
                <p className="text-sm text-white/60 mt-1">{activeJob.description}</p>
              </div>

              {activeJob.address && (
                <p className="text-xs text-white/40 flex items-start gap-1">
                  <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" /> {activeJob.address}
                </p>
              )}

              {activeJob.locationDescription && (
                <p className="text-xs text-white/60 flex items-start gap-1 mt-2">
                  <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-400" /> {activeJob.locationDescription}
                </p>
              )}

              {activeJob.willProvideDirections && (
                <p className="text-[11px] text-amber-400 flex items-center gap-1 mt-2">
                  <Navigation className="w-3 h-3" /> No GPS pin — call the driver for directions
                </p>
              )}
            </div>

            {/* Map */}
            <TrackingMap request={activeJob} />

            {/* Action buttons */}
            <div className="space-y-2">
              {activeJob.status === "ACCEPTED" && (
                <button
                  onClick={() => patchRequest(activeJob.id, "ON_THE_WAY")}
                  disabled={!!actionLoading}
                  className="w-full py-4 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Navigation className="w-4 h-4" /> I&apos;m On My Way</>}
                </button>
              )}
              {activeJob.status === "ON_THE_WAY" && (
                <button
                  onClick={() => patchRequest(activeJob.id, "COMPLETED")}
                  disabled={!!actionLoading}
                  className="w-full py-4 rounded-xl bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Mark as Completed</>}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
