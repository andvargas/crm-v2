"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft, ChevronRight, FilterX, MessageSquarePlus, Pencil, Radio, SearchCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AsyncCombobox } from "../../components/async-combobox";
import { CrmShell } from "../../components/crm-shell";
import { InteractionEditor } from "../../components/interaction-editor";
import { api } from "../../lib/api";
import { Interaction, formatDate } from "../../lib/crm";

type ActivityResponse = {
  items: Interaction[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  filters: { types: string[]; channels: string[]; statuses: string[] };
};

const normalize = (value?: string) => (value || "Unspecified").replaceAll("-", " ");
const contactLabel = (activity: Interaction) => activity.contact && typeof activity.contact === "object"
  ? activity.contact.name?.fullName || [activity.contact.name?.firstName, activity.contact.name?.lastName].filter(Boolean).join(" ")
  : activity.fullName;
const companyLabel = (activity: Interaction) => activity.company && typeof activity.company === "object" ? activity.company.name?.companyName : activity.companyName;

export default function ActivitiesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [channel, setChannel] = useState("");
  const [status, setStatus] = useState("");
  const [company, setCompany] = useState({ value: "", label: "" });
  const [contact, setContact] = useState({ value: "", label: "" });
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const params = useMemo(() => {
    const values = new URLSearchParams({ page: String(page), limit: "25" });
    if (debouncedSearch) values.set("search", debouncedSearch);
    if (type) values.set("type", type);
    if (channel) values.set("channel", channel);
    if (status) values.set("status", status);
    if (company.value) values.set("company", company.value);
    if (contact.value) values.set("contact", contact.value);
    if (from) values.set("from", from);
    if (to) values.set("to", to);
    return values.toString();
  }, [channel, company.value, contact.value, debouncedSearch, from, page, status, to, type]);

  const query = useQuery({ queryKey: ["activity-feed", params], queryFn: () => api<ActivityResponse>(`/interactions/activity-feed?${params}`), placeholderData: keepPreviousData });
  const data = query.data;
  const filtersActive = Boolean(search || type || channel || status || company.value || contact.value || from || to);
  const clearFilters = () => { setSearch(""); setType(""); setChannel(""); setStatus(""); setCompany({ value: "", label: "" }); setContact({ value: "", label: "" }); setFrom(""); setTo(""); setPage(1); };
  const changeFilter = (change: () => void) => { change(); setPage(1); };

  return <><CrmShell activePath="/activities" search={search} onSearch={(value) => { setSearch(value); setPage(1); }}><div className="mx-auto max-w-[1500px] px-4 py-7 md:px-8 md:py-9">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-indigo-600">Operational timeline</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Activities</h1><p className="mt-2 text-sm text-slate-500">Every enquiry, call, meeting and message in one place.</p></div><div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500"><span className="font-bold text-slate-900">{data?.total ?? 0}</span> matching activities</div></div>

    <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-4"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Filter label="Type" value={type} options={data?.filters.types ?? []} onChange={(value) => changeFilter(() => setType(value))} /><Filter label="Channel" value={channel} options={data?.filters.channels ?? []} onChange={(value) => changeFilter(() => setChannel(value))} /><Filter label="Status" value={status} options={data?.filters.statuses ?? []} onChange={(value) => changeFilter(() => setStatus(value))} /><AsyncCombobox label="Company" endpoint="/companies/lookup" value={company.value} selectedLabel={company.label} emptyLabel="All companies" placeholder="Search companies…" onChange={(option) => changeFilter(() => setCompany({ value: option?.value || "", label: option?.label || "" }))} /><AsyncCombobox label="Contact" endpoint="/contacts/lookup" value={contact.value} selectedLabel={contact.label} emptyLabel="All contacts" placeholder="Search contacts…" onChange={(option) => changeFilter(() => setContact({ value: option?.value || "", label: option?.label || "" }))} /><DateField label="From" value={from} onChange={(value) => changeFilter(() => setFrom(value))} /><DateField label="To" value={to} onChange={(value) => changeFilter(() => setTo(value))} /><div className="flex items-end"><button type="button" onClick={clearFilters} disabled={!filtersActive} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"><FilterX size={16} />Clear filters</button></div></div></section>

    <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="grid grid-cols-[1.4fr_.8fr_.8fr_.8fr_auto] gap-4 border-b border-slate-100 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 max-lg:hidden"><span>Contact / company</span><span>Type</span><span>Channel</span><span>Updated</span><span className="w-6" /></div>
      {query.isLoading ? <p className="p-12 text-center text-sm text-slate-500">Loading activities…</p> : query.isError ? <p className="p-12 text-center text-sm text-rose-600">Activities could not be loaded.</p> : data?.items.length ? <div className="divide-y divide-slate-100">{data.items.map((activity) => {
        const isExpanded = expanded === activity._id;
        return <article key={activity._id}><button type="button" onClick={() => setExpanded(isExpanded ? null : activity._id)} className="grid w-full gap-3 px-5 py-4 text-left hover:bg-slate-50 lg:grid-cols-[1.4fr_.8fr_.8fr_.8fr_auto] lg:items-center lg:gap-4"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{contactLabel(activity) || companyLabel(activity) || "Unnamed activity"}</p><p className="mt-1 truncate text-xs text-slate-400">{companyLabel(activity) || activity.note || "No company linked"}</p></div><div><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold capitalize text-indigo-700">{normalize(activity.type)}</span></div><div className="flex items-center gap-1.5 text-sm capitalize text-slate-600"><Radio size={14} className="text-slate-400" />{normalize(activity.channel)}</div><div><p className="text-sm text-slate-600">{formatDate(activity.updatedAt)}</p><p className="mt-1 text-xs capitalize text-slate-400">{normalize(activity.leadStatus)}</p></div><ChevronDown size={18} className={`text-slate-400 transition ${isExpanded ? "rotate-180" : ""}`} /></button>{isExpanded && <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-5"><div className="mb-4 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setEditingInteraction(activity)} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"><Pencil size={14} />Edit activity</button><button type="button" onClick={() => setEditingInteraction(activity)} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"><MessageSquarePlus size={14} />Add message</button></div><div className="grid gap-5 lg:grid-cols-[.7fr_1.3fr]"><div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Activity note</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{activity.note || "No note recorded."}</p></div><div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Conversation · {activity.comms?.length ?? 0} messages</p><div className="mt-2 max-h-64 space-y-2 overflow-y-auto">{activity.comms?.length ? [...activity.comms].reverse().map((message, index) => <div key={message._id || index} className="rounded-xl border border-slate-200 bg-white p-3"><p className="whitespace-pre-wrap text-sm leading-5 text-slate-700">{message.outcome || "Empty message"}</p><p className="mt-2 text-[11px] text-slate-400">{formatDate(message.timeStamp)}</p></div>) : <p className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-400">No messages recorded.</p>}</div></div></div></div>}</article>;
      })}</div> : <div className="grid place-items-center px-6 py-16 text-center"><SearchCheck size={32} className="text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">No matching activities</p><p className="mt-1 text-xs text-slate-400">Try clearing or changing the filters.</p></div>}
      {data && data.total > 0 && <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4"><p className="text-xs text-slate-500">Page {data.page} of {data.pages}</p><div className="flex gap-2"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || query.isFetching} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold disabled:opacity-40"><ChevronLeft size={14} />Previous</button><button type="button" onClick={() => setPage((current) => Math.min(data.pages, current + 1))} disabled={page >= data.pages || query.isFetching} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold disabled:opacity-40">Next<ChevronRight size={14} /></button></div></div>}
    </section>
  </div></CrmShell><InteractionEditor interaction={editingInteraction} onClose={() => setEditingInteraction(null)} /></>;
}

function Filter({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm capitalize outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"><option value="">All {label.toLowerCase()}s</option>{options.map((option) => <option key={option} value={option}>{normalize(option)}</option>)}</select></label>;
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span><input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" /></label>;
}
