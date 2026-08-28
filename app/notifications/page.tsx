"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, CircleAlert, Clock3, FileWarning, Target, X } from "lucide-react";
import { useState } from "react";
import { CrmShell } from "../../components/crm-shell";
import { SafeLink as Link } from "../../components/safe-link";
import { api } from "../../lib/api";
import { CrmNotification, NotificationResponse, formatDate } from "../../lib/crm";

const icons = { follow_up: Clock3, closing: Target, invoice: FileWarning, stale_lead: CircleAlert };

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["notifications"], queryFn: () => api<NotificationResponse>("/notifications") });
  const refresh = () => client.invalidateQueries({ queryKey: ["notifications"] });
  const action = useMutation({ mutationFn: ({ key, action }: { key: string; action: "read" | "dismiss" }) => api(`/notifications/${encodeURIComponent(key)}`, { method: "PATCH", body: JSON.stringify({ action }) }), onSuccess: refresh });
  const readAll = useMutation({ mutationFn: () => api("/notifications/read-all", { method: "POST", body: "{}" }), onSuccess: refresh });
  const items = (query.data?.items ?? []).filter((item) => filter === "all" || !item.read);

  return <CrmShell activePath="/notifications"><div className="mx-auto max-w-[1100px] px-4 py-7 md:px-8 md:py-9">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-indigo-600">Attention centre</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Notifications</h1><p className="mt-2 text-sm text-slate-500">Follow-ups, approaching close dates, stale leads and overdue invoices.</p></div>{Boolean(query.data?.unreadCount) && <button onClick={() => readAll.mutate()} className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700"><CheckCheck size={17} />Mark all as read</button>}</div>
    <div className="mt-7 flex gap-2"><Filter active={filter === "all"} onClick={() => setFilter("all")}>All ({query.data?.items.length ?? 0})</Filter><Filter active={filter === "unread"} onClick={() => setFilter("unread")}>Unread ({query.data?.unreadCount ?? 0})</Filter></div>
    <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">{query.isLoading ? <p className="p-14 text-center text-sm text-slate-500">Checking notifications…</p> : query.isError ? <p className="p-14 text-center text-sm text-rose-600">Notifications could not be loaded.</p> : items.length ? items.map((item) => <NotificationRow key={item.key} item={item} onRead={() => action.mutate({ key: item.key, action: "read" })} onDismiss={() => action.mutate({ key: item.key, action: "dismiss" })} />) : <div className="p-16 text-center"><Bell className="mx-auto text-slate-300" size={34} /><p className="mt-3 font-semibold text-slate-700">Nothing needs your attention</p><p className="mt-1 text-sm text-slate-400">New reminders will appear here automatically.</p></div>}</section>
  </div></CrmShell>;
}

function NotificationRow({ item, onRead, onDismiss }: { item: CrmNotification; onRead: () => void; onDismiss: () => void }) {
  const Icon = icons[item.type];
  return <article className={`flex items-start gap-4 border-b border-slate-100 p-4 last:border-0 sm:p-5 ${item.read ? "bg-white" : "bg-indigo-50/40"}`}><div className={`grid size-10 shrink-0 place-items-center rounded-xl ${item.priority === "high" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}><Icon size={19} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-bold text-slate-900">{item.title}</h2>{!item.read && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-700">New</span>}</div><p className="mt-1 text-sm text-slate-500">{item.message}</p><p className="mt-2 text-xs text-slate-400">Due {formatDate(item.date)}</p><div className="mt-3 flex gap-3"><Link href={item.href} onClick={onRead} className="text-xs font-bold text-indigo-600">Open record</Link>{!item.read && <button onClick={onRead} className="text-xs font-semibold text-slate-500">Mark read</button>}</div></div><button onClick={onDismiss} aria-label={`Dismiss ${item.title}`} title="Dismiss" className="rounded-lg p-2 text-slate-300 hover:bg-slate-100 hover:text-slate-600"><X size={17} /></button></article>;
}

function Filter({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={`rounded-xl px-4 py-2 text-sm font-semibold ${active ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-500"}`}>{children}</button>;
}
