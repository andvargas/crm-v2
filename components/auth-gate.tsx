"use client";

import { BriefcaseBusiness, Eye, EyeOff } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { api } from "../lib/api";

type User = { id: string; name: string; email: string; role: "admin" | "salesperson" | "demo" };
type AuthResponse = { token: string; user: User };

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const load = () => {
      try { setUser(JSON.parse(localStorage.getItem("crm_user") || "null")); }
      catch { setUser(null); }
      setReady(true);
    };
    load(); window.addEventListener("crm-auth-changed", load);
    return () => window.removeEventListener("crm-auth-changed", load);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const result = await api<AuthResponse>(demo ? "/auth/demo" : "/auth/login", { method: "POST", body: JSON.stringify(values) });
      localStorage.setItem("crm_token", result.token);
      localStorage.setItem("crm_user", JSON.stringify(result.user));
      setUser(result.user);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to sign in"); }
    finally { setBusy(false); }
  }

  if (!ready) return <div className="min-h-screen bg-slate-50" />;
  if (user && localStorage.getItem("crm_token")) return <>{children}</>;
  return <main className="grid min-h-screen place-items-center bg-[#f7f8fb] p-5">
    <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-9">
      <div className="mb-7 flex items-center gap-3"><div className="grid size-11 place-items-center rounded-xl bg-indigo-600 text-white"><BriefcaseBusiness size={22} /></div><div><h1 className="text-xl font-bold text-slate-950">Studio CRM</h1><p className="text-sm text-slate-500">Secure business workspace</p></div></div>
      <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-semibold"><button type="button" onClick={() => { setDemo(false); setError(""); }} className={`rounded-lg px-3 py-2.5 ${!demo ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"}`}>Sign in</button><button type="button" onClick={() => { setDemo(true); setError(""); }} className={`rounded-lg px-3 py-2.5 ${demo ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"}`}>Private demo</button></div>
      <form onSubmit={submit} className="space-y-4">
        {demo && <Field name="name" label="Your name" autoComplete="name" />}
        <Field name="email" label="Email address" type="email" autoComplete="email" />
        <label className="block text-sm font-semibold text-slate-700">Password<div className="relative mt-2"><input name="password" type={showPassword ? "text" : "password"} autoComplete={demo ? "new-password" : "current-password"} minLength={demo ? 8 : undefined} required className="h-12 w-full rounded-xl border border-slate-200 px-3.5 pr-12 font-normal outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-slate-400 transition hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500">{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div></label>
        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <button disabled={busy} className="h-12 w-full rounded-xl bg-indigo-600 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-60">{busy ? "Please wait…" : demo ? "Create private demo" : "Sign in"}</button>
        {demo && <p className="text-xs leading-5 text-slate-500">Your demo workspace is isolated. It cannot access organization data.</p>}
      </form>
    </section>
  </main>;
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...input } = props;
  return <label className="block text-sm font-semibold text-slate-700">{label}<input {...input} required className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3.5 font-normal outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" /></label>;
}
