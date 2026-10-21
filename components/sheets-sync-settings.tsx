"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, CircleDashed, ExternalLink, Link2Off, PlugZap, RefreshCw } from "lucide-react";
import { FormEvent, useState } from "react";
import { api } from "../lib/api";
import { BudgetTab, useBudgetTabs } from "../lib/budget-books";

type SyncStatus = { configured: boolean; lastSuccessAt: string | null; lastError: { message: string; at: string } | null; pending: number };
type FullSyncResult = SyncStatus & { budgets: { scope: string; transactions: number }[] };
type SheetLink = { scope: string; spreadsheetId: string; title?: string };

const sheetUrl = (id: string) => `https://docs.google.com/spreadsheets/d/${id}/edit`;

const when = (value: string) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const button = "flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

export function SheetsSyncSettings() {
  const queryClient = useQueryClient();
  const status = useQuery({ queryKey: ["sheets-sync-status"], queryFn: () => api<SyncStatus>("/sheets-sync/status"), refetchInterval: (query) => (query.state.data?.pending ? 3000 : false) });
  const store = (data: SyncStatus) => queryClient.setQueryData(["sheets-sync-status"], data);
  const refreshStatus = () => queryClient.invalidateQueries({ queryKey: ["sheets-sync-status"] });
  const test = useMutation({ mutationFn: () => api<SyncStatus>("/sheets-sync/test", { method: "POST" }), onSuccess: store, onSettled: refreshStatus });
  const full = useMutation({ mutationFn: () => api<FullSyncResult>("/sheets-sync/full", { method: "POST" }), onSuccess: store, onSettled: refreshStatus });
  const data = status.data;
  const busy = test.isPending || full.isPending;
  const failure = test.error || full.error;

  return <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
    <div className="mb-5"><h2 className="font-bold text-slate-950">Google Sheets sync</h2><p className="mt-1 text-xs text-slate-500">Link each budget to its own Google spreadsheet, so you can share one budget without the others. Every transaction you add, edit or delete is copied there. Saving in the CRM never waits for Google.</p></div>
    {status.isLoading ? <p className="text-sm text-slate-500">Checking sync…</p> : !data?.configured ? <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"><CircleDashed className="mt-0.5 shrink-0 text-slate-400" size={18} /><div className="text-sm text-slate-600"><p className="font-semibold text-slate-800">Not set up</p><p className="mt-1">Deploy <code className="rounded bg-white px-1 text-xs">scripts/google-sheets-sync.gs</code> from the backend in your spreadsheet, then add <code className="rounded bg-white px-1 text-xs">GOOGLE_SHEETS_SYNC_URL</code> and <code className="rounded bg-white px-1 text-xs">GOOGLE_SHEETS_SYNC_SECRET</code> to the backend <code className="rounded bg-white px-1 text-xs">.env</code> and restart it.</p></div></div> : <>
      <div className={`flex items-start gap-3 rounded-xl border p-4 ${data.lastError ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
        {data.lastError ? <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={18} /> : <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18} />}
        <div className="min-w-0 text-sm"><p className={`font-semibold ${data.lastError ? "text-amber-900" : "text-emerald-900"}`}>{data.lastError ? "Last sync failed" : "Connected"}{data.pending ? ` · ${data.pending} change${data.pending === 1 ? "" : "s"} sending…` : ""}</p>
          {data.lastError && <p className="mt-1 break-words text-amber-800">{data.lastError.message} <span className="text-amber-600">({when(data.lastError.at)})</span></p>}
          <p className={`mt-1 text-xs ${data.lastError ? "text-amber-700" : "text-emerald-700"}`}>{data.lastSuccessAt ? `Last successful sync ${when(data.lastSuccessAt)}` : "Nothing synced since the backend started."}{data.lastError ? " Use Sync all now to catch up after fixing it." : ""}</p></div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" disabled={busy} onClick={() => test.mutate()} className={button}><PlugZap size={16} />{test.isPending ? "Testing…" : "Test connection"}</button>
        <button type="button" disabled={busy} onClick={() => full.mutate()} className={button}><RefreshCw size={16} className={full.isPending ? "animate-spin" : ""} />{full.isPending ? "Syncing…" : "Sync all now"}</button>
        {test.isSuccess && !busy && <span className="text-xs font-semibold text-emerald-700">Connection works.</span>}
        {full.isSuccess && !busy && <span className="text-xs font-semibold text-emerald-700">{full.data.budgets.length ? `Synced ${full.data.budgets.reduce((total, budget) => total + budget.transactions, 0)} transactions across ${full.data.budgets.length} spreadsheet${full.data.budgets.length === 1 ? "" : "s"}.` : "No budget is linked to a spreadsheet yet."}</span>}
      </div>
      <p className="mt-3 text-xs text-slate-400">Sync all now rewrites every linked spreadsheet from the CRM. Use it after a failed sync.</p>
      <SpreadsheetLinks onChanged={refreshStatus} />
    </>}
    {failure && <p className="mt-3 text-sm text-rose-600">{failure instanceof Error ? failure.message : "Sync failed"}</p>}
  </section>;
}

function SpreadsheetLinks({ onChanged }: { onChanged: () => void }) {
  const { tabs } = useBudgetTabs();
  const links = useQuery({ queryKey: ["sheets-sync-links"], queryFn: () => api<{ items: SheetLink[] }>("/sheets-sync/links") });
  return <div className="mt-6"><h3 className="text-sm font-bold text-slate-900">Spreadsheet per budget</h3><p className="mt-1 text-xs text-slate-500">Create an empty Google spreadsheet, copy its link from the address bar and paste it here. The CRM fills a &quot;Transactions&quot; tab and keeps it up to date. Budgets without a link are not synced.</p>
    <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">{tabs.map((tab) => <SpreadsheetLinkRow key={tab.scope} tab={tab} link={links.data?.items.find((item) => item.scope === tab.scope)} onChanged={onChanged} />)}</ul>
    {links.isError && <p className="mt-3 text-sm text-rose-600">Spreadsheet links could not be loaded.</p>}
  </div>;
}

function SpreadsheetLinkRow({ tab, link, onChanged }: { tab: BudgetTab; link?: SheetLink; onChanged: () => void }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState("");
  const [editing, setEditing] = useState(false);
  const save = useMutation({
    mutationFn: (spreadsheet: string) => api<SheetLink & { transactions?: number | null }>(`/sheets-sync/links/${encodeURIComponent(tab.scope)}`, { method: "PUT", body: JSON.stringify({ spreadsheet }) }),
    onSuccess: () => { setValue(""); setEditing(false); void queryClient.invalidateQueries({ queryKey: ["sheets-sync-links"] }); onChanged(); },
  });
  const submit = (event: FormEvent) => { event.preventDefault(); if (value.trim()) save.mutate(value.trim()); };
  const unlink = () => { if (window.confirm(`Stop syncing ${tab.label}? The spreadsheet itself is kept.`)) save.mutate(""); };

  return <li className="px-4 py-3">
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <p className="w-28 shrink-0 truncate text-sm font-semibold text-slate-900">{tab.label}</p>
      {link && !editing ? <>
        <a href={sheetUrl(link.spreadsheetId)} target="_blank" rel="noopener noreferrer" className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:underline"><ExternalLink size={14} className="shrink-0" /><span className="truncate">{link.title || "Open spreadsheet"}</span></a>
        <button type="button" disabled={save.isPending} onClick={() => setEditing(true)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Change</button>
        <button type="button" disabled={save.isPending} onClick={unlink} aria-label={`Stop syncing ${tab.label}`} title="Stop syncing" className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Link2Off size={15} /></button>
      </> : <form onSubmit={submit} className="flex min-w-0 flex-1 gap-2">
        <input value={value} onChange={(event) => setValue(event.target.value)} placeholder="https://docs.google.com/spreadsheets/d/…" aria-label={`Spreadsheet link for ${tab.label}`} className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" />
        <button disabled={save.isPending || !value.trim()} className="shrink-0 rounded-xl bg-indigo-600 px-3.5 text-sm font-semibold text-white disabled:opacity-50">{save.isPending ? "Linking…" : "Link"}</button>
        {editing && <button type="button" onClick={() => { setEditing(false); setValue(""); save.reset(); }} className="shrink-0 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600">Cancel</button>}
      </form>}
    </div>
    {save.isError && <p className="mt-2 text-xs text-rose-600">{save.error instanceof Error ? save.error.message : "The spreadsheet could not be linked"}</p>}
  </li>;
}
