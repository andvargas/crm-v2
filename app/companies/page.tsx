"use client";

import { useQuery } from "@tanstack/react-query";
import { Archive, ArrowUpRight, Building2, Globe2, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import { CrmShell } from "../../components/crm-shell";
import { api } from "../../lib/api";
import { Company, formatDate } from "../../lib/crm";

export default function CompaniesPage() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"active" | "archived">("active");
  const query = useQuery({ queryKey: ["companies"], queryFn: () => api<Company[]>("/companies") });
  const companies = useMemo(() => (query.data ?? []).filter((company) => {
    const matchesView = view === "archived" ? Boolean(company.archivedAt) : !company.archivedAt;
    const term = search.trim().toLowerCase();
    return matchesView && (!term || [company.name.companyName, company.name.shortName, company.industry, company.segment].some((value) => value?.toLowerCase().includes(term)));
  }).sort((a, b) => a.name.companyName.localeCompare(b.name.companyName)), [query.data, search, view]);
  const active = (query.data ?? []).filter((company) => !company.archivedAt);
  const linkedContacts = active.reduce((total, company) => total + (company.contacts?.length ?? 0), 0);

  return <CrmShell activePath="/companies" search={search} onSearch={setSearch}><div className="mx-auto max-w-[1500px] px-4 py-7 md:px-8 md:py-9">
    <div><p className="text-sm font-semibold text-indigo-600">CRM core</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Companies</h1><p className="mt-2 text-sm text-slate-500">Manage organisations and the relationships connected to them.</p></div>
    {!search.trim() && <section className="mt-7 grid gap-4 sm:grid-cols-3"><Stat icon={Building2} label="Active companies" value={active.length} /><Stat icon={UsersRound} label="Linked contacts" value={linkedContacts} /><Stat icon={Globe2} label="With websites" value={active.filter((company) => company.website).length} /></section>}
    <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div className="flex rounded-xl bg-slate-100 p-1"><button onClick={() => setView("active")} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${view === "active" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Active</button><button onClick={() => setView("archived")} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${view === "archived" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Archived</button></div><p className="text-xs text-slate-400">{companies.length} {companies.length === 1 ? "company" : "companies"}</p></div>
      {query.isLoading ? <div className="p-10 text-center text-sm text-slate-500">Loading companies…</div> : query.error ? <div className="p-10 text-center text-sm text-rose-600">Companies could not be loaded.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400"><th className="px-5 py-3 font-semibold">Company</th><th className="px-4 py-3 font-semibold">Industry</th><th className="px-4 py-3 font-semibold">Contacts</th><th className="px-4 py-3 font-semibold">Updated</th><th /></tr></thead><tbody>{companies.map((company) => <tr key={company._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50"><td className="px-5 py-4"><a href={`/companies/${company._id}`} className="font-semibold text-slate-900 hover:text-indigo-600">{company.name.companyName}</a><p className="mt-1 text-xs text-slate-400">{company.genericEmail || company.website || "No contact details"}</p></td><td className="px-4 py-4 text-sm text-slate-600">{company.industry || company.segment || "—"}</td><td className="px-4 py-4 text-sm font-semibold text-slate-700">{company.contacts?.length ?? 0}</td><td className="px-4 py-4 text-sm text-slate-500">{formatDate(company.updatedAt)}</td><td className="px-4"><a aria-label={`Open ${company.name.companyName}`} href={`/companies/${company._id}`} className="inline-flex rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"><ArrowUpRight size={18} /></a></td></tr>)}</tbody></table>{companies.length === 0 && <div className="grid place-items-center px-6 py-14 text-center"><Archive className="text-slate-300" size={30} /><p className="mt-3 text-sm font-semibold text-slate-700">No {view} companies</p><p className="mt-1 text-xs text-slate-400">Try changing your search or view.</p></div>}</div>}
    </section>
  </div></CrmShell>;
}

function Stat({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: number }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-950">{value}</p></div><div className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Icon size={19} /></div></div></article>;
}
