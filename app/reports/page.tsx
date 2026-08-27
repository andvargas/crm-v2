"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, CalendarDays, CheckCircle2, Clock3, Download, Target, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { CrmShell } from "../../components/crm-shell";
import { InteractionEditor } from "../../components/interaction-editor";
import { api } from "../../lib/api";
import { formatDate, Interaction, LEAD_STATUSES } from "../../lib/crm";

type Report = {
  period: { from: string; to: string };
  kpis: { interactions: number; newContacts: number; newCompanies: number; messages: number; meetingsBooked: number; closedWon: number };
  stages: { status: string; count: number }[];
  channels: { channel: string; count: number }[];
  freelance: { income: number; expenses: number; net: number; months: { month: string; income: number; expenses: number; net: number }[]; categories: { category: string; amount: number }[] };
  staleLeads: Interaction[];
  followUps: { contactId: string; name: string; lastInteractionAt: string; interactionCount: number }[];
  trackingNote: string;
};

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => `${today().slice(0, 7)}-01`;
const money = (value: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value || 0);
const label = (value: string) => LEAD_STATUSES.find((item) => item.value === value)?.label || value.replaceAll("-", " ");

export default function ReportsPage() {
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);
  const params = useMemo(() => new URLSearchParams({ from, to }).toString(), [from, to]);
  const query = useQuery({ queryKey: ["reports", params], queryFn: () => api<Report>(`/reports?${params}`) });
  const report = query.data;
  const stageCounts = new Map(report?.stages.map((item) => [item.status, item.count]) || []);
  const maxStage = Math.max(1, ...(report?.stages.map((item) => item.count) || []));
  const maxChannel = Math.max(1, ...(report?.channels.map((item) => item.count) || []));
  const maxMonth = Math.max(1, ...(report?.freelance.months.flatMap((item) => [item.income, item.expenses]) || []));
  const isThisMonth = from === monthStart() && to === today();

  const exportCsv = () => {
    if (!report) return;
    const rows = [
      ["Report", "Value"], ["From", from], ["To", to], ["Interactions", report.kpis.interactions], ["New contacts", report.kpis.newContacts],
      ["New companies", report.kpis.newCompanies], ["Messages", report.kpis.messages], ["Meetings booked", report.kpis.meetingsBooked], ["Closed won", report.kpis.closedWon],
      ["Freelance income", report.freelance.income], ["Freelance expenses", report.freelance.expenses], ["Freelance net", report.freelance.net],
      [], ["Lead stage", "Entries"], ...report.stages.map((item) => [label(item.status), item.count]),
      [], ["Channel", "Interactions"], ...report.channels.map((item) => [label(item.channel), item.count]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `crm-report-${from}-${to}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };

  return <><CrmShell activePath="/reports"><div className="mx-auto max-w-[1500px] px-4 py-7 md:px-8 md:py-9">
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="text-sm font-semibold text-indigo-600">Performance overview</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Reports</h1><p className="mt-2 text-sm text-slate-500">CRM progress, follow-ups and freelance cash-flow for the selected period.</p></div><div className="flex flex-wrap items-end gap-3"><DateField label="From" value={from} onChange={setFrom} /><DateField label="To" value={to} onChange={setTo} />{!isThisMonth && <button onClick={() => { setFrom(monthStart()); setTo(today()); }} className="h-11 rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-semibold text-indigo-700">This month</button>}<button onClick={exportCsv} disabled={!report} className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-40"><Download size={16} />Export CSV</button></div></div>

    {query.isLoading ? <div className="mt-7 grid min-h-80 place-items-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">Preparing report…</div> : query.isError || !report ? <div className="mt-7 rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">The report could not be loaded.</div> : <>
      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Kpi icon={Activity} label="Interactions" value={report.kpis.interactions} detail={`${report.kpis.messages} messages added`} tone="indigo" /><Kpi icon={UserPlus} label="New contacts" value={report.kpis.newContacts} detail={`${report.kpis.newCompanies} new companies`} tone="sky" /><Kpi icon={CalendarDays} label="Meetings booked" value={report.kpis.meetingsBooked} detail="Stage entries in this period" tone="amber" /><Kpi icon={CheckCircle2} label="Closed won" value={report.kpis.closedWon} detail="Stage entries in this period" tone="emerald" /></section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_.65fr]"><Panel title="Lead-stage progression" subtitle={report.trackingNote}><div className="space-y-3">{LEAD_STATUSES.map((stage) => { const count = stageCounts.get(stage.value) || 0; return <div key={stage.value} className="grid grid-cols-[minmax(135px,1fr)_3fr_32px] items-center gap-3"><span className="truncate text-xs font-medium text-slate-600">{stage.label}</span><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${count ? Math.max(4, count / maxStage * 100) : 0}%` }} /></div><span className="text-right text-xs font-bold text-slate-700">{count}</span></div>; })}</div></Panel><Panel title="Activity by channel" subtitle={`${report.kpis.interactions} interactions updated`}><div className="space-y-4">{report.channels.map((item) => <div key={item.channel}><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="capitalize text-slate-600">{label(item.channel)}</span><strong>{item.count}</strong></div><div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-sky-500" style={{ width: `${item.count / maxChannel * 100}%` }} /></div></div>)}{!report.channels.length && <Empty text="No activity in this period" />}</div></Panel></section>

      <section className="mt-5"><Panel title="Freelance cash-flow" subtitle={`${money(report.freelance.income)} income · ${money(report.freelance.expenses)} expenses`} action={<span className={`text-lg font-bold ${report.freelance.net >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{money(report.freelance.net)} net</span>}><div className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]"><div className="flex min-h-56 items-end gap-3 rounded-xl bg-slate-50 p-4">{report.freelance.months.map((item) => <div key={item.month} className="flex min-w-0 flex-1 flex-col items-center"><div className="flex h-40 w-full items-end justify-center gap-1"><div title={`Income ${money(item.income)}`} className="w-1/3 rounded-t bg-emerald-400" style={{ height: `${Math.max(item.income ? 4 : 0, item.income / maxMonth * 100)}%` }} /><div title={`Expenses ${money(item.expenses)}`} className="w-1/3 rounded-t bg-rose-400" style={{ height: `${Math.max(item.expenses ? 4 : 0, item.expenses / maxMonth * 100)}%` }} /></div><span className="mt-2 text-[11px] text-slate-500">{item.month}</span></div>)}{!report.freelance.months.length && <div className="m-auto"><Empty text="No freelance transactions in this period" /></div>}</div><div><p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Expense categories</p><div className="space-y-3">{report.freelance.categories.map((item) => <div key={item.category} className="flex justify-between gap-3 text-sm"><span className="truncate text-slate-600">{item.category}</span><strong className="text-slate-800">{money(item.amount)}</strong></div>)}{!report.freelance.categories.length && <Empty text="No expenses in this period" />}</div></div></div></Panel></section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2"><Panel title="Stale open leads" subtitle="Open interactions with no update for 14 days"><List>{report.staleLeads.map((item) => <button type="button" key={item._id} onClick={() => setEditingInteraction(item)} className="flex w-full items-center justify-between gap-4 rounded-xl px-3 py-3 text-left hover:bg-slate-50"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{item.contact && typeof item.contact === "object" ? item.contact.name?.fullName : item.fullName || (item.company && typeof item.company === "object" ? item.company.name?.companyName : item.companyName) || "Unnamed lead"}</p><p className="mt-1 text-xs capitalize text-slate-400">{label(item.leadStatus || "new")}</p></div><span className="shrink-0 text-xs text-slate-400">{formatDate(item.updatedAt)}</span></button>)}</List>{!report.staleLeads.length && <Empty text="No stale open leads" />}</Panel><Panel title="Contacts needing follow-up" subtitle="No interaction during the last 30 days"><List>{report.followUps.map((item) => <a key={item.contactId} href={`/contacts/${item.contactId}`} className="flex items-center justify-between gap-4 rounded-xl px-3 py-3 hover:bg-slate-50"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{item.name}</p><p className="mt-1 text-xs text-slate-400">{item.interactionCount} recorded interactions</p></div><span className="shrink-0 text-xs text-slate-400">{formatDate(item.lastInteractionAt)}</span></a>)}</List>{!report.followUps.length && <Empty text="No overdue follow-ups" />}</Panel></section>
    </>}
  </div></CrmShell><InteractionEditor interaction={editingInteraction} onClose={() => setEditingInteraction(null)} /></>;
}

function Kpi({ icon: Icon, label, value, detail, tone }: { icon: typeof Target; label: string; value: number; detail: string; tone: string }) { return <article className="rounded-2xl border border-slate-200 bg-white p-5"><div className={`metric-icon metric-icon-${tone}`}><Icon size={19} /></div><p className="mt-5 text-sm font-medium text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-950">{value}</p><p className="mt-2 text-xs text-slate-400">{detail}</p></article>; }
function Panel({ title, subtitle, action, children }: { title: string; subtitle: string; action?: React.ReactNode; children: React.ReactNode }) { return <article className="rounded-2xl border border-slate-200 bg-white"><div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4"><div><h2 className="font-bold text-slate-950">{title}</h2><p className="mt-1 text-xs text-slate-400">{subtitle}</p></div>{action}</div><div className="p-5">{children}</div></article>; }
function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label><span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span><input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm" /></label>; }
function List({ children }: { children: React.ReactNode }) { return <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">{children}</div>; }
function Empty({ text }: { text: string }) { return <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400"><Clock3 size={16} />{text}</div>; }
