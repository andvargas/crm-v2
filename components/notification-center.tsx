"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { NotificationResponse } from "../lib/crm";
import { SafeLink as Link } from "./safe-link";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["notifications"], queryFn: () => api<NotificationResponse>("/notifications"), refetchInterval: 60_000 });
  const refresh = () => client.invalidateQueries({ queryKey: ["notifications"] });
  const readAll = useMutation({ mutationFn: () => api<{ updated: number }>("/notifications/read-all", { method: "POST", body: "{}" }), onSuccess: refresh });
  const markRead = (key: string) => api(`/notifications/${encodeURIComponent(key)}`, { method: "PATCH", body: JSON.stringify({ action: "read" }) }).catch(() => undefined);
  const unread = query.data?.unreadCount ?? 0;

  useEffect(() => {
    const update = () => { client.invalidateQueries({ queryKey: ["notifications"] }); };
    window.addEventListener("crm-notifications-changed", update);
    return () => window.removeEventListener("crm-notifications-changed", update);
  }, [client]);

  return <div className="relative">
    <button aria-label={`${unread} unread notifications`} onClick={() => setOpen((value) => !value)} className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50"><Bell size={19} />{unread > 0 && <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-5 text-white">{unread > 99 ? "99+" : unread}</span>}</button>
    {open && <><button aria-label="Close notifications" onClick={() => setOpen(false)} className="fixed inset-0 z-30 cursor-default" /><section className="absolute right-0 top-14 z-40 w-[min(92vw,390px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"><header className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5"><div><h2 className="text-sm font-bold text-slate-900">Notifications</h2><p className="text-xs text-slate-400">{unread ? `${unread} unread` : "You're up to date"}</p></div>{unread > 0 && <button onClick={() => readAll.mutate()} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600"><CheckCheck size={15} />Mark all read</button>}</header><div className="max-h-[430px] overflow-y-auto p-2">{query.isLoading && <p className="p-8 text-center text-sm text-slate-400">Checking notifications…</p>}{query.data?.items.slice(0, 6).map((item) => <Link key={item.key} href={item.href} onClick={() => markRead(item.key)} className={`mb-1 block rounded-xl px-3 py-3 hover:bg-slate-50 ${item.read ? "opacity-60" : "bg-indigo-50/60"}`}><div className="flex gap-3"><span className={`mt-1 size-2 shrink-0 rounded-full ${item.priority === "high" ? "bg-rose-500" : "bg-amber-400"}`} /><span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-800">{item.title}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{item.message}</span></span></div></Link>)}{query.data?.items.length === 0 && <div className="p-9 text-center"><CheckCheck className="mx-auto text-emerald-500" size={27} /><p className="mt-2 text-sm font-semibold text-slate-700">Nothing needs attention</p></div>}</div><Link href="/notifications" onClick={() => setOpen(false)} className="block border-t border-slate-100 px-4 py-3 text-center text-xs font-bold text-indigo-600 hover:bg-slate-50">View all notifications</Link></section></>}
  </div>;
}
