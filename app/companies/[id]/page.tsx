"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive, ArrowLeft, Building2, CalendarCheck2, ChevronLeft, ChevronRight,
  ExternalLink, Link2, Mail, MessageSquare, Pencil, Phone, RotateCcw, Save,
  Search, UserPlus, UsersRound, X,
} from "lucide-react";
import { useParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { CrmShell } from "../../../components/crm-shell";
import { SafeLink as Link } from "../../../components/safe-link";
import { api } from "../../../lib/api";
import { Company, Contact, Interaction, companyId, contactName, formatDate, initials, normalizeWebsite } from "../../../lib/crm";

type CompanyDraft = {
  companyName: string; shortName: string; industry: string; segment: string;
  genericEmail: string; phone: string; website: string; staffNumber: string; annualIncome: string;
};

const emptyDraft: CompanyDraft = { companyName: "", shortName: "", industry: "", segment: "", genericEmail: "", phone: "", website: "", staffNumber: "", annualIncome: "" };

export default function CompanyDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CompanyDraft>(emptyDraft);
  const [formError, setFormError] = useState("");
  const [contactModal, setContactModal] = useState<"add" | "assign" | null>(null);
  const [newContact, setNewContact] = useState({ fullName: "", email: "", jobTitle: "", phone: "" });
  const [contactSearch, setContactSearch] = useState("");
  const [contactError, setContactError] = useState("");
  const [selectedInteractionId, setSelectedInteractionId] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);
  const [interactionModal, setInteractionModal] = useState(false);
  const [interactionSearch, setInteractionSearch] = useState("");
  const [interactionError, setInteractionError] = useState("");
  const companyQuery = useQuery({ queryKey: ["company", id], queryFn: () => api<Company>(`/companies/${id}`), enabled: Boolean(id) });
  const interactionsQuery = useQuery({ queryKey: ["interactions"], queryFn: () => api<Interaction[]>("/interactions") });
  const contactsQuery = useQuery({ queryKey: ["contacts"], queryFn: () => api<Contact[]>("/contacts") });
  const company = companyQuery.data;

  const openEditor = () => {
    if (!company) return;
    setDraft({
      companyName: company.name.companyName || "", shortName: company.name.shortName || "", industry: company.industry || "",
      segment: company.segment || "", genericEmail: company.genericEmail || "", phone: company.phone?.[0] || "", website: company.website || "",
      staffNumber: company.staffNumber?.toString() || "", annualIncome: company.annualIncome?.toString() || "",
    });
    setFormError("");
    setEditing(true);
  };

  const updateCompany = useMutation({
    mutationFn: (body: object) => api<Company>(`/companies/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["company", id], updated);
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setEditing(false);
      setFormError("");
    },
    onError: (error) => setFormError(error instanceof Error ? error.message : "The company could not be updated"),
  });

  const interactions = useMemo(() => (interactionsQuery.data ?? [])
    .filter((item) => item.company === id || (company?.name.companyName && item.companyName === company.name.companyName))
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 8), [company, id, interactionsQuery.data]);
  const selectedInteraction = interactions.find((item) => item._id === selectedInteractionId) || interactions[0];
  const messages = useMemo(() => [...(selectedInteraction?.comms ?? [])].sort((a, b) => Date.parse(b.timeStamp || "") - Date.parse(a.timeStamp || "")), [selectedInteraction]);
  const currentMessage = messages[Math.min(messageIndex, Math.max(messages.length - 1, 0))];
  const assignableContacts = useMemo(() => {
    const term = contactSearch.trim().toLowerCase();
    return (contactsQuery.data ?? []).filter((contact) => companyId(contact) !== id && (!term || [contactName(contact), contact.email, contact.jobTitle].some((value) => value?.toLowerCase().includes(term))));
  }, [contactSearch, contactsQuery.data, id]);
  const assignableInteractions = useMemo(() => {
    const term = interactionSearch.trim().toLowerCase();
    return (interactionsQuery.data ?? []).filter((item) => {
      const alreadyAssigned = item.company === id || item.companyName === company?.name.companyName;
      const matches = !term || [item.fullName, item.companyName, item.type, item.leadStatus, item.note].some((value) => value?.toLowerCase().includes(term));
      return !alreadyAssigned && matches;
    }).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }, [company?.name.companyName, id, interactionSearch, interactionsQuery.data]);

  const contactMutation = useMutation({
    mutationFn: ({ path, method, body }: { path: string; method: "POST" | "PATCH"; body: object }) => api<Contact>(path, { method, body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company", id] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setContactModal(null);
      setContactError("");
      setNewContact({ fullName: "", email: "", jobTitle: "", phone: "" });
    },
    onError: (error) => setContactError(error instanceof Error ? error.message : "The contact could not be saved"),
  });

  const addContact = (event: FormEvent) => {
    event.preventDefault();
    if (!newContact.fullName.trim()) return setContactError("Contact name is required");
    contactMutation.mutate({ path: "/contacts/add", method: "POST", body: {
      name: { fullName: newContact.fullName.trim() }, email: newContact.email.trim(), jobTitle: newContact.jobTitle.trim(),
      phone: { generic: newContact.phone.trim() }, company: id,
    } });
  };

  const assignContact = (contactId: string) => contactMutation.mutate({ path: `/contacts/${contactId}`, method: "PATCH", body: { company: id } });
  const interactionMutation = useMutation({
    mutationFn: (interactionId: string) => api<Interaction>(`/interactions/${interactionId}`, {
      method: "PATCH", body: JSON.stringify({ company: id, companyName: company?.name.companyName || "" }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interactions"] });
      setInteractionModal(false);
      setInteractionSearch("");
      setInteractionError("");
    },
    onError: (error) => setInteractionError(error instanceof Error ? error.message : "The interaction could not be assigned"),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.companyName.trim()) return setFormError("Company name is required");
    updateCompany.mutate({
      name: { companyName: draft.companyName.trim(), ...(draft.shortName.trim() ? { shortName: draft.shortName.trim() } : {}) },
      industry: draft.industry.trim(), segment: draft.segment.trim(), genericEmail: draft.genericEmail.trim(),
      phone: draft.phone.trim() ? [draft.phone.trim()] : [], website: normalizeWebsite(draft.website),
      staffNumber: draft.staffNumber ? Number(draft.staffNumber) : null,
      annualIncome: draft.annualIncome ? Number(draft.annualIncome) : null,
    });
  };

  const toggleArchive = () => {
    if (!company) return;
    const action = company.archivedAt ? "restore" : "archive";
    if (!window.confirm(`${action === "archive" ? "Archive" : "Restore"} ${company.name.companyName}?`)) return;
    updateCompany.mutate({ archivedAt: company.archivedAt ? null : new Date().toISOString() });
  };

  if (companyQuery.isLoading) return <CrmShell activePath="/companies"><div className="grid min-h-[60vh] place-items-center text-sm text-slate-500">Loading company…</div></CrmShell>;
  if (!company) return <CrmShell activePath="/companies"><div className="grid min-h-[60vh] place-items-center px-6 text-center"><div><Building2 className="mx-auto text-slate-300" size={36} /><h1 className="mt-4 text-xl font-bold">Company not found</h1><Link href="/companies" className="mt-3 inline-block text-sm font-semibold text-indigo-600">Return to companies</Link></div></div></CrmShell>;

  return <CrmShell activePath="/companies"><div className="mx-auto max-w-[1350px] px-4 py-7 md:px-8 md:py-9">
    <Link href="/companies" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600"><ArrowLeft size={16} />Companies</Link>
    <section className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div className="flex items-start gap-4"><div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-indigo-100 text-lg font-bold text-indigo-700">{initials(company.name.companyName)}</div><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-3xl font-bold tracking-tight text-slate-950">{company.name.companyName}</h1>{company.archivedAt && <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600">Archived</span>}</div><p className="mt-2 text-sm text-slate-500">{company.industry || company.segment || "Company record"} · Updated {formatDate(company.updatedAt)}</p></div></div><div className="flex gap-2"><button onClick={openEditor} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700"><Pencil size={16} />Edit</button><button onClick={toggleArchive} disabled={updateCompany.isPending} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700">{company.archivedAt ? <RotateCcw size={16} /> : <Archive size={16} />}{company.archivedAt ? "Restore" : "Archive"}</button></div></section>

    <section className="mt-7 grid gap-5 xl:grid-cols-[.78fr_1.4fr]">
      <div className="space-y-5"><article className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold text-slate-950">Company details</h2><div className="mt-5 space-y-4"><Detail icon={Mail} label="Email" value={company.genericEmail} href={company.genericEmail ? `mailto:${company.genericEmail}` : undefined} /><Detail icon={Phone} label="Phone" value={company.phone?.[0]} /><Detail icon={ExternalLink} label="Website" value={company.website} href={normalizeWebsite(company.website)} /><Detail icon={UsersRound} label="Staff" value={company.staffNumber?.toLocaleString()} /><Detail icon={Building2} label="Segment" value={company.segment} /></div></article>
      </div>
      <div className="space-y-5"><article className="rounded-2xl border border-slate-200 bg-white"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><div className="flex items-center gap-2"><h2 className="font-bold text-slate-950">Contacts</h2><span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">{company.contacts?.length ?? 0}</span></div><p className="mt-1 text-xs text-slate-500">People linked to this company</p></div><div className="flex gap-2"><button onClick={() => setContactModal("assign")} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Link2 size={14} />Assign contact</button><button onClick={() => setContactModal("add")} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"><UserPlus size={14} />Add contact</button></div></div><div className="divide-y divide-slate-100">{(company.contacts ?? []).map((contact, index) => <ContactRow key={contact._id} contact={contact} index={index} />)}{!company.contacts?.length && <p className="px-5 py-10 text-center text-sm text-slate-500">No contacts are linked yet.</p>}</div></article>
        <article className="rounded-2xl border border-slate-200 bg-white"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><h2 className="font-bold text-slate-950">Recent interactions</h2><p className="mt-1 text-xs text-slate-500">Select an interaction to read its conversation</p></div><button onClick={() => { setInteractionModal(true); setInteractionError(""); }} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Link2 size={14} />Assign interaction</button></div><div className="grid min-h-[320px] md:grid-cols-[1.1fr_.9fr]"><div className="divide-y divide-slate-100 border-b border-slate-100 md:border-b-0 md:border-r">{interactions.map((item) => { const selected = item._id === selectedInteraction?._id; return <button key={item._id} onClick={() => { setSelectedInteractionId(item._id); setMessageIndex(0); }} className={`flex w-full gap-3 px-5 py-4 text-left transition ${selected ? "bg-indigo-50" : "hover:bg-slate-50"}`}><div className={`mt-1 grid size-8 shrink-0 place-items-center rounded-full ${selected ? "bg-indigo-100 text-indigo-600" : "bg-emerald-50 text-emerald-600"}`}><CalendarCheck2 size={15} /></div><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><p className="truncate text-sm font-semibold capitalize">{item.type?.replaceAll("-", " ") || "Interaction"}</p><span className="shrink-0 text-xs text-slate-400">{formatDate(item.updatedAt)}</span></div><p className="mt-1 truncate text-xs text-slate-500">{item.fullName || item.leadStatus || "No contact"}{item.note ? ` · ${item.note}` : ""}</p><p className="mt-1 text-[11px] font-medium text-slate-400">{item.comms?.length ?? 0} {(item.comms?.length ?? 0) === 1 ? "message" : "messages"}</p></div></button>; })}{!interactions.length && <p className="px-5 py-10 text-center text-sm text-slate-500">No interactions found for this company.</p>}</div><ConversationPanel interaction={selectedInteraction} messages={messages} currentMessage={currentMessage} messageIndex={messageIndex} onOlder={() => setMessageIndex((index) => Math.min(messages.length - 1, index + 1))} onNewer={() => setMessageIndex((index) => Math.max(0, index - 1))} /></div></article></div>
    </section>

    {editing && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/45 p-4"><div role="dialog" aria-modal="true" aria-labelledby="edit-company-title" className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><h2 id="edit-company-title" className="text-lg font-bold">Edit company</h2><p className="mt-1 text-xs text-slate-500">Update the organisation’s core details.</p></div><button aria-label="Close" onClick={() => setEditing(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={19} /></button></div><form onSubmit={submit} className="p-6"><div className="grid gap-4 sm:grid-cols-2"><Field label="Company name" value={draft.companyName} onChange={(value) => setDraft({ ...draft, companyName: value })} required /><Field label="Short name" value={draft.shortName} onChange={(value) => setDraft({ ...draft, shortName: value })} /><Field label="Industry" value={draft.industry} onChange={(value) => setDraft({ ...draft, industry: value })} /><Field label="Segment" value={draft.segment} onChange={(value) => setDraft({ ...draft, segment: value })} /><Field label="Email" type="email" value={draft.genericEmail} onChange={(value) => setDraft({ ...draft, genericEmail: value })} /><Field label="Phone" value={draft.phone} onChange={(value) => setDraft({ ...draft, phone: value })} /><Field label="Website" type="url" value={draft.website} onChange={(value) => setDraft({ ...draft, website: value })} /><Field label="Staff number" type="number" value={draft.staffNumber} onChange={(value) => setDraft({ ...draft, staffNumber: value })} /><Field label="Annual income" type="number" value={draft.annualIncome} onChange={(value) => setDraft({ ...draft, annualIncome: value })} /></div>{formError && <p className="mt-4 text-sm text-rose-600">{formError}</p>}<div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setEditing(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Cancel</button><button disabled={updateCompany.isPending} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><Save size={16} />{updateCompany.isPending ? "Saving…" : "Save changes"}</button></div></form></div></div>}
    {contactModal && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/45 p-4"><div role="dialog" aria-modal="true" aria-labelledby="contact-modal-title" className="my-8 w-full max-w-lg rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><h2 id="contact-modal-title" className="text-lg font-bold">{contactModal === "add" ? "Add a new contact" : "Assign an existing contact"}</h2><p className="mt-1 text-xs text-slate-500">The contact will be linked to {company.name.companyName}.</p></div><button aria-label="Close" onClick={() => setContactModal(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={19} /></button></div>{contactModal === "add" ? <form onSubmit={addContact} className="space-y-4 p-6"><Field label="Full name" value={newContact.fullName} onChange={(value) => setNewContact({ ...newContact, fullName: value })} required /><Field label="Job title" value={newContact.jobTitle} onChange={(value) => setNewContact({ ...newContact, jobTitle: value })} /><Field label="Email" type="email" value={newContact.email} onChange={(value) => setNewContact({ ...newContact, email: value })} /><Field label="Phone" value={newContact.phone} onChange={(value) => setNewContact({ ...newContact, phone: value })} />{contactError && <p className="text-sm text-rose-600">{contactError}</p>}<div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setContactModal(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Cancel</button><button disabled={contactMutation.isPending} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{contactMutation.isPending ? "Adding…" : "Add contact"}</button></div></form> : <div className="p-6"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input value={contactSearch} onChange={(event) => setContactSearch(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" placeholder="Search contacts…" /></div>{contactError && <p className="mt-3 text-sm text-rose-600">{contactError}</p>}<div className="mt-4 max-h-80 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">{assignableContacts.map((contact) => <div key={contact._id} className="flex items-center gap-3 p-3"><div className="avatar avatar-indigo">{initials(contactName(contact))}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{contactName(contact)}</p><p className="truncate text-xs text-slate-400">{contact.email || contact.jobTitle || "No details"}</p></div><button disabled={contactMutation.isPending} onClick={() => assignContact(contact._id)} className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 disabled:opacity-60">Assign</button></div>)}{!assignableContacts.length && <p className="p-8 text-center text-sm text-slate-500">No matching contacts available.</p>}</div></div>}</div></div>}
    {interactionModal && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/45 p-4"><div role="dialog" aria-modal="true" aria-labelledby="interaction-modal-title" className="my-8 w-full max-w-xl rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><h2 id="interaction-modal-title" className="text-lg font-bold">Assign an interaction</h2><p className="mt-1 text-xs text-slate-500">The selected interaction will move to {company.name.companyName}.</p></div><button aria-label="Close" onClick={() => setInteractionModal(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={19} /></button></div><div className="p-6"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input value={interactionSearch} onChange={(event) => setInteractionSearch(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" placeholder="Search interactions by person, company, type or note…" /></div>{interactionError && <p className="mt-3 text-sm text-rose-600">{interactionError}</p>}<div className="mt-4 max-h-96 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">{assignableInteractions.map((item) => <div key={item._id} className="flex items-center gap-3 p-3"><div className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600"><CalendarCheck2 size={16} /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold capitalize">{item.fullName || item.type?.replaceAll("-", " ") || "Interaction"}</p><p className="truncate text-xs text-slate-400">{item.companyName || item.note || item.leadStatus || "No details"} · {formatDate(item.updatedAt)}</p></div><button disabled={interactionMutation.isPending} onClick={() => interactionMutation.mutate(item._id)} className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 disabled:opacity-60">Assign</button></div>)}{!assignableInteractions.length && <p className="p-8 text-center text-sm text-slate-500">No matching interactions available.</p>}</div></div></div></div>}
  </div></CrmShell>;
}

function ConversationPanel({ interaction, messages, currentMessage, messageIndex, onOlder, onNewer }: {
  interaction?: Interaction;
  messages: NonNullable<Interaction["comms"]>;
  currentMessage?: NonNullable<Interaction["comms"]>[number];
  messageIndex: number;
  onOlder: () => void;
  onNewer: () => void;
}) {
  if (!interaction) return <div className="grid place-items-center p-8 text-center"><div><MessageSquare className="mx-auto text-slate-300" size={30} /><p className="mt-3 text-sm text-slate-500">Select an interaction to view its messages.</p></div></div>;
  return <div className="flex min-h-[300px] flex-col bg-slate-50/60 p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Conversation</p><h3 className="mt-1 text-sm font-bold text-slate-900">{interaction.fullName || interaction.companyName || "Interaction"}</h3></div>{messages.length > 0 && <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 shadow-sm">{messageIndex + 1} / {messages.length}</span>}</div>
    <div className="mt-5 flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">{currentMessage ? <><p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{currentMessage.outcome || "Empty message"}</p><p className="mt-4 text-[11px] text-slate-400">{formatDate(currentMessage.timeStamp)}</p></> : <div className="grid h-full min-h-28 place-items-center text-center"><div><MessageSquare className="mx-auto text-slate-300" size={24} /><p className="mt-2 text-xs text-slate-400">No conversation messages recorded.</p></div></div>}</div>
    {messages.length > 1 && <div className="mt-4 flex items-center justify-between"><button onClick={onOlder} disabled={messageIndex >= messages.length - 1} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 disabled:opacity-35"><ChevronLeft size={15} />Older</button><button onClick={onNewer} disabled={messageIndex === 0} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 disabled:opacity-35">Newer<ChevronRight size={15} /></button></div>}
  </div>;
}

function Detail({ icon: Icon, label, value, href }: { icon: typeof Mail; label: string; value?: string; href?: string }) {
  return <div className="flex gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500"><Icon size={16} /></div><div className="min-w-0"><p className="text-xs text-slate-400">{label}</p>{href && value ? <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="mt-0.5 block truncate text-sm font-semibold text-indigo-600">{value}</a> : <p className="mt-0.5 truncate text-sm font-semibold text-slate-700">{value || "—"}</p>}</div></div>;
}

function ContactRow({ contact, index }: { contact: Contact; index: number }) {
  const name = contactName(contact);
  return <div className="flex items-center gap-3 px-5 py-4"><div className={`avatar avatar-${["indigo", "emerald", "amber", "rose"][index % 4]}`}>{initials(name)}</div><div className="min-w-0 flex-1"><Link href={`/contacts/${contact._id}`} className="truncate text-sm font-semibold text-slate-900 hover:text-indigo-600">{name}</Link><p className="mt-0.5 truncate text-xs text-slate-400">{contact.jobTitle || contact.email || "No details"}</p></div><p className="text-xs text-slate-400">{contact.interactions?.length ?? 0} activities</p></div>;
}

function Field({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span><input type={type === "url" ? "text" : type} inputMode={type === "url" ? "url" : undefined} value={value} onChange={(event) => onChange(event.target.value)} required={required} min={type === "number" ? 0 : undefined} className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" /></label>;
}
