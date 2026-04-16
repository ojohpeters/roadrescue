"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Wrench, Mail, Lock, User, Phone, AlertCircle, CheckCircle2 } from "lucide-react";
import type { Role } from "@/lib/models";

const ROLES: { value: Role; label: string; desc: string }[] = [
  { value: "DRIVER", label: "Driver", desc: "I need roadside assistance" },
  { value: "MECHANIC", label: "Mechanic", desc: "I provide roadside assistance" },
];

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = (searchParams.get("role") as Role) ?? "DRIVER";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: defaultRole as Role,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed");
        return;
      }
      router.push("/login?registered=1");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-white/50 text-sm mt-1">Join Road Rescue today</p>
        </div>

        <div className="glass rounded-2xl p-6 border border-white/8">
          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => update("role", r.value)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  form.role === r.value
                    ? "border-orange-500/50 bg-orange-500/10"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  {form.role === r.value && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />
                  )}
                  <span className="text-sm font-medium">{r.label}</span>
                </div>
                <p className="text-xs text-white/40">{r.desc}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {[
              { field: "name", label: "Full Name", icon: User, type: "text", placeholder: "John Doe" },
              { field: "email", label: "Email", icon: Mail, type: "email", placeholder: "you@example.com" },
              { field: "phone", label: "Phone (optional)", icon: Phone, type: "tel", placeholder: "+234 800 000 0000" },
              { field: "password", label: "Password", icon: Lock, type: "password", placeholder: "Min 8 characters" },
            ].map(({ field, label, icon: Icon, type, placeholder }) => (
              <div key={field}>
                <label className="block text-sm text-white/60 mb-1.5">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type={type}
                    value={form[field as keyof typeof form]}
                    onChange={(e) => update(field, e.target.value)}
                    placeholder={placeholder}
                    required={field !== "phone"}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50 transition-colors text-sm"
                  />
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors text-sm"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-white/40 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-orange-400 hover:text-orange-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
