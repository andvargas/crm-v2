"use client";

import { useQuery } from "@tanstack/react-query";
import { Archive, ArrowUpRight, AtSign, Building2, ContactRound, Phone } from "lucide-react";
import { useMemo, useState } from "react";
import { CrmShell } from "../../components/crm-shell";
import { api } from "../../lib/api";
import { Company, Contact, companyId, contactName, formatDate, initials } from "../../lib/crm";

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"active" | "archived">("active");
  const contactsQuery = useQuery({ queryKey: ["contacts"], queryFn: () => api<Contact[]>("/contacts") });
  const companiesQuery = useQuery({ queryKey: ["companies"], queryFn: () => api<Company[]>("/companies") });
  const companyNames = useMemo(() => new Map((companiesQuery.data ?? []).map((company) => [company._id, company.name.companyName])), [companiesQuery.data]);
  const contacts = useMemo(() => (contactsQuery.data ?? []).filter((contact) => {
    const matchesView = view === "archived" ? Boolean(contact.archivedAt) : !contact.archivedAt;
    const term = search.trim().toLowerCase();
    return matchesView && (!term || [contactName(contact), contact.email, contact.jobTitle, companyNames.get(companyId(contact) || "")].some((value) => value?.toLowerCase().includes(term)));
  }).sort((a, b) => contactName(a).localeCompare(contactName(b))), [companyNames, contactsQuery.data, search, view]);
  const active = (contactsQuery.data ?? []).filter((contact) => !contact.archivedAt);

  return <CrmShell activePath="/contacts" search={search} onSearch={setSearch}><div className="mx-auto max-w-[1500px] px-4 py-7 md:px-8 md:py-9">
    <div><p className="text-sm font-semibold text-indigo-600">CRM core</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Contacts</h1><p className="mt-2 text-sm text-slate-500">Manage people, company relationships and interaction history.</p></div>
    {!search.trim() && <section className="mt-7 grid gap-4 sm:grid-cols-3"><Stat icon={ContactRound} label="Active contacts" value={active.length} /><Stat icon={Building2} label="Linked to companies" value={active.filter((contact) => companyId(contact)).length} /><Stat icon={AtSign} label="With email" value={active.filter((contact) => contact.email).length} /></section>}
    <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div className="flex rounded-xl bg-slate-100 p-1"><button onClick={() => setView("active")} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${view === "active" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Active</button><button onClick={() => setView("archived")} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${view === "archived" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Archived</button></div><p className="text-xs text-slate-400">{contacts.length} {contacts.length === 1 ? "contact" : "contacts"}</p></div>
      {contactsQuery.isLoading ? <div className="p-10 text-center text-sm text-slate-500">Loading contacts…</div> : contactsQuery.error ? <div className="p-10 text-center text-sm text-rose-600">Contacts could not be loaded.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left"><thead><tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400"><th className="px-5 py-3 font-semibold">Contact</th><th className="px-4 py-3 font-semibold">Company</th><th className="px-4 py-3 font-semibold">Phone</th><th className="px-4 py-3 font-semibold">Interactions</th><th className="px-4 py-3 font-semibold">Updated</th><th /></tr></thead><tbody>{contacts.map((contact, index) => <tr key={contact._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className={`avatar avatar-${["indigo", "emerald", "amber", "rose"][index % 4]}`}>{initials(contactName(contact))}</div><div><a href={`/contacts/${contact._id}`} className="font-semibold text-slate-900 hover:text-indigo-600">{contactName(contact)}</a><p className="mt-1 text-xs text-slate-400">{contact.jobTitle || contact.email || "No contact details"}</p></div></div></td><td className="px-4 py-4 text-sm text-slate-600">{companyNames.get(companyId(contact) || "") || "—"}</td><td className="px-4 py-4 text-sm text-slate-500">{contact.phone?.mobile || contact.phone?.generic || contact.phone?.office || "—"}</td><td className="px-4 py-4 text-sm font-semibold text-slate-700">{contact.interactions?.length ?? 0}</td><td className="px-4 py-4 text-sm text-slate-500">{formatDate(contact.updatedAt)}</td><td className="px-4"><a aria-label={`Open ${contactName(contact)}`} href={`/contacts/${contact._id}`} className="inline-flex rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"><ArrowUpRight size={18} /></a></td></tr>)}</tbody></table>{contacts.length === 0 && <div className="grid place-items-center px-6 py-14 text-center"><Archive className="text-slate-300" size={30} /><p className="mt-3 text-sm font-semibold text-slate-700">No {view} contacts</p><p className="mt-1 text-xs text-slate-400">Try changing your search or view.</p></div>}</div>}
    </section>
  </div></CrmShell>;
}

function Stat({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: number }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-950">{value}</p></div><div className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Icon size={19} /></div></div></article>;
}
