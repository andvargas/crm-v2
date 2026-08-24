"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive, ArrowLeft, Building2, CalendarCheck2, ChevronLeft, ChevronRight,
  Mail, MapPin, MessageSquare, Pencil, Phone, Plus, RotateCcw, Save, UserRound, X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { CrmShell } from "../../../components/crm-shell";
import { api } from "../../../lib/api";
import { Company, Contact, Interaction, companyId, companyName, contactName, formatDate, initials } from "../../../lib/crm";

type Draft = { fullName: string; jobTitle: string; email: string; phone: string; mobile: string; contactType: string; connectionType: string; notes: string; company: string };
const emptyDraft: Draft = { fullName: "", jobTitle: "", email: "", phone: "", mobile: "", contactType: "", connectionType: "", notes: "", company: "" };

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [formError, setFormError] = useState("");
  const [selectedInteractionId, setSelectedInteractionId] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);
  const [addingInteraction, setAddingInteraction] = useState(false);
  const [interactionDraft, setInteractionDraft] = useState({ type: "enquiry", channel: "email", status: "enquired", note: "", outcome: "" });
  const [interactionError, setInteractionError] = useState("");
  const contactQuery = useQuery({ queryKey: ["contact", id], queryFn: () => api<Contact>(`/contacts/${id}`), enabled: Boolean(id) });
  const companiesQuery = useQuery({ queryKey: ["companies"], queryFn: () => api<Company[]>("/companies") });
  const contact = contactQuery.data;
  const interactions = useMemo(() => ((contact?.interactions ?? []) as Interaction[]).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)), [contact?.interactions]);
  const selectedInteraction = interactions.find((item) => item._id === selectedInteractionId) || interactions[0];
  const messages = useMemo(() => [...(selectedInteraction?.comms ?? [])].sort((a, b) => Date.parse(b.timeStamp || "") - Date.parse(a.timeStamp || "")), [selectedInteraction]);
  const currentMessage = messages[Math.min(messageIndex, Math.max(messages.length - 1, 0))];

  const updateContact = useMutation({
    mutationFn: (body: object) => api<Contact>(`/contacts/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["contact", id], updated);
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setEditing(false);
      setFormError("");
    },
    onError: (error) => setFormError(error instanceof Error ? error.message : "The contact could not be updated"),
  });
  const addInteraction = useMutation({
    mutationFn: () => api<Interaction>("/interactions/add", { method: "POST", body: JSON.stringify({
      contact: id, ...(companyId(contact!) ? { company: companyId(contact!) } : {}), fullName: contactName(contact!), companyName: companyName(contact!) || "",
      type: interactionDraft.type, channel: interactionDraft.channel, leadStatus: interactionDraft.status, leadStages: [interactionDraft.status], note: interactionDraft.note.trim(),
      comms: interactionDraft.outcome.trim() ? [{ outcome: interactionDraft.outcome.trim(), timeStamp: new Date().toISOString() }] : [],
    }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact", id] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["interactions"] });
      setAddingInteraction(false); setInteractionError("");
      setInteractionDraft({ type: "enquiry", channel: "email", status: "enquired", note: "", outcome: "" });
    },
    onError: (error) => setInteractionError(error instanceof Error ? error.message : "The interaction could not be created"),
  });

  const openEditor = () => {
    if (!contact) return;
    setDraft({ fullName: contactName(contact), jobTitle: contact.jobTitle || "", email: contact.email || "", phone: contact.phone?.generic || contact.phone?.office || "", mobile: contact.phone?.mobile || "", contactType: contact.contactType || "", connectionType: contact.connectionType || "", notes: contact.notes || "", company: companyId(contact) || "" });
    setFormError("");
    setEditing(true);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.fullName.trim()) return setFormError("Contact name is required");
    updateContact.mutate({ name: { fullName: draft.fullName.trim() }, jobTitle: draft.jobTitle.trim(), email: draft.email.trim(), phone: { generic: draft.phone.trim(), mobile: draft.mobile.trim() }, contactType: draft.contactType.trim(), connectionType: draft.connectionType.trim(), notes: draft.notes.trim(), company: draft.company || null });
  };

  const toggleArchive = () => {
    if (!contact) return;
    const label = contact.archivedAt ? "Restore" : "Archive";
    if (!window.confirm(`${label} ${contactName(contact)}?`)) return;
    updateContact.mutate({ archivedAt: contact.archivedAt ? null : new Date().toISOString() });
  };

  if (contactQuery.isLoading) return <CrmShell activePath="/contacts"><div className="grid min-h-[60vh] place-items-center text-sm text-slate-500">Loading contact…</div></CrmShell>;
  if (!contact) return <CrmShell activePath="/contacts"><div className="grid min-h-[60vh] place-items-center text-center"><div><UserRound className="mx-auto text-slate-300" size={36} /><h1 className="mt-4 text-xl font-bold">Contact not found</h1><Link href="/contacts" className="mt-3 inline-block text-sm font-semibold text-indigo-600">Return to contacts</Link></div></div></CrmShell>;
  const name = contactName(contact);

  return <CrmShell activePath="/contacts"><div className="mx-auto max-w-[1350px] px-4 py-7 md:px-8 md:py-9">
    <Link href="/contacts" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600"><ArrowLeft size={16} />Contacts</Link>
    <section className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div className="flex items-start gap-4"><div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-indigo-100 text-lg font-bold text-indigo-700">{initials(name)}</div><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-3xl font-bold tracking-tight text-slate-950">{name}</h1>{contact.archivedAt && <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600">Archived</span>}</div><p className="mt-2 text-sm text-slate-500">{contact.jobTitle || contact.contactType || "Contact record"} · Updated {formatDate(contact.updatedAt)}</p></div></div><div className="flex gap-2"><button onClick={openEditor} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700"><Pencil size={16} />Edit</button><button onClick={toggleArchive} disabled={updateContact.isPending} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700">{contact.archivedAt ? <RotateCcw size={16} /> : <Archive size={16} />}{contact.archivedAt ? "Restore" : "Archive"}</button></div></section>
    <section className="mt-7 grid gap-5 xl:grid-cols-[.78fr_1.4fr]"><div className="space-y-5"><article className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Contact details</h2><div className="mt-5 space-y-4"><Detail icon={Mail} label="Email" value={contact.email} href={contact.email ? `mailto:${contact.email}` : undefined} /><Detail icon={Phone} label="Phone" value={contact.phone?.mobile || contact.phone?.generic || contact.phone?.office} /><Detail icon={Building2} label="Company" value={companyName(contact)} href={companyId(contact) ? `/companies/${companyId(contact)}` : undefined} /><Detail icon={MapPin} label="Relationship" value={contact.connectionType || contact.contactType} /></div></article>{contact.notes && <article className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Notes</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{contact.notes}</p></article>}</div>
      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><div className="flex items-center gap-2"><h2 className="font-bold">Interactions</h2><span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">{interactions.length}</span></div><p className="mt-1 text-xs text-slate-500">Select an interaction to read its conversation</p></div><button onClick={() => setAddingInteraction(true)} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"><Plus size={14} />Add interaction</button></div><div className="grid min-h-[420px] md:grid-cols-[1.1fr_.9fr]"><div className="divide-y divide-slate-100 border-b md:border-b-0 md:border-r">{interactions.map((item) => { const selected = item._id === selectedInteraction?._id; return <button key={item._id} onClick={() => { setSelectedInteractionId(item._id); setMessageIndex(0); }} className={`flex w-full gap-3 px-5 py-4 text-left ${selected ? "bg-indigo-50" : "hover:bg-slate-50"}`}><div className={`mt-1 grid size-8 shrink-0 place-items-center rounded-full ${selected ? "bg-indigo-100 text-indigo-600" : "bg-emerald-50 text-emerald-600"}`}><CalendarCheck2 size={15} /></div><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><p className="truncate text-sm font-semibold capitalize">{item.type?.replaceAll("-", " ") || "Interaction"}</p><span className="shrink-0 text-xs text-slate-400">{formatDate(item.updatedAt)}</span></div><p className="mt-1 truncate text-xs text-slate-500">{item.companyName || item.leadStatus || item.note || "No details"}</p><p className="mt-1 text-[11px] text-slate-400">{item.comms?.length ?? 0} {(item.comms?.length ?? 0) === 1 ? "message" : "messages"}</p></div></button>; })}{!interactions.length && <p className="p-10 text-center text-sm text-slate-500">No interactions linked to this contact.</p>}</div><Conversation interaction={selectedInteraction} messages={messages} current={currentMessage} index={messageIndex} older={() => setMessageIndex((value) => Math.min(messages.length - 1, value + 1))} newer={() => setMessageIndex((value) => Math.max(0, value - 1))} /></div></article>
    </section>
    {editing && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/45 p-4"><div role="dialog" aria-modal="true" aria-labelledby="edit-contact-title" className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><h2 id="edit-contact-title" className="text-lg font-bold">Edit contact</h2><p className="mt-1 text-xs text-slate-500">Update personal details and company assignment.</p></div><button aria-label="Close" onClick={() => setEditing(false)} className="rounded-lg p-2 text-slate-400"><X size={19} /></button></div><form onSubmit={submit} className="p-6"><div className="grid gap-4 sm:grid-cols-2"><Field label="Full name" value={draft.fullName} change={(value) => setDraft({ ...draft, fullName: value })} required /><Field label="Job title" value={draft.jobTitle} change={(value) => setDraft({ ...draft, jobTitle: value })} /><Field label="Email" type="email" value={draft.email} change={(value) => setDraft({ ...draft, email: value })} /><Field label="Phone" value={draft.phone} change={(value) => setDraft({ ...draft, phone: value })} /><Field label="Mobile" value={draft.mobile} change={(value) => setDraft({ ...draft, mobile: value })} /><Field label="Contact type" value={draft.contactType} change={(value) => setDraft({ ...draft, contactType: value })} /><Field label="Relationship" value={draft.connectionType} change={(value) => setDraft({ ...draft, connectionType: value })} /><label><span className="mb-1.5 block text-xs font-semibold text-slate-600">Company</span><select value={draft.company} onChange={(event) => setDraft({ ...draft, company: event.target.value })} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"><option value="">No company</option>{(companiesQuery.data ?? []).filter((company) => !company.archivedAt).map((company) => <option key={company._id} value={company._id}>{company.name.companyName}</option>)}</select></label><label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Notes</span><textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} rows={4} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" /></label></div>{formError && <p className="mt-4 text-sm text-rose-600">{formError}</p>}<div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setEditing(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Cancel</button><button disabled={updateContact.isPending} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><Save size={16} />{updateContact.isPending ? "Saving…" : "Save changes"}</button></div></form></div></div>}
    {addingInteraction && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/45 p-4"><div role="dialog" aria-modal="true" aria-labelledby="add-interaction-title" className="my-8 w-full max-w-lg rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><h2 id="add-interaction-title" className="text-lg font-bold">Add interaction</h2><p className="mt-1 text-xs text-slate-500">This interaction will be linked to {name}.</p></div><button aria-label="Close" onClick={() => setAddingInteraction(false)} className="rounded-lg p-2 text-slate-400"><X size={19} /></button></div><form onSubmit={(event) => { event.preventDefault(); addInteraction.mutate(); }} className="p-6"><div className="grid gap-4 sm:grid-cols-2"><Field label="Type" value={interactionDraft.type} change={(type) => setInteractionDraft({ ...interactionDraft, type })} /><Field label="Channel" value={interactionDraft.channel} change={(channel) => setInteractionDraft({ ...interactionDraft, channel })} /><Field label="Status" value={interactionDraft.status} change={(status) => setInteractionDraft({ ...interactionDraft, status })} /><Field label="Note" value={interactionDraft.note} change={(note) => setInteractionDraft({ ...interactionDraft, note })} /><label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Message</span><textarea value={interactionDraft.outcome} onChange={(event) => setInteractionDraft({ ...interactionDraft, outcome: event.target.value })} rows={5} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" /></label></div>{interactionError && <p className="mt-4 text-sm text-rose-600">{interactionError}</p>}<div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setAddingInteraction(false)} className="rounded-xl border px-4 py-2.5 text-sm font-semibold">Cancel</button><button disabled={addInteraction.isPending} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{addInteraction.isPending ? "Adding…" : "Add interaction"}</button></div></form></div></div>}
  </div></CrmShell>;
}

function Conversation({ interaction, messages, current, index, older, newer }: { interaction?: Interaction; messages: NonNullable<Interaction["comms"]>; current?: NonNullable<Interaction["comms"]>[number]; index: number; older: () => void; newer: () => void }) {
  if (!interaction) return <div className="grid place-items-center p-8 text-center"><div><MessageSquare className="mx-auto text-slate-300" size={30} /><p className="mt-3 text-sm text-slate-500">Select an interaction to view its messages.</p></div></div>;
  return <div className="flex min-h-[340px] flex-col bg-slate-50/60 p-5"><div className="flex justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Conversation</p><h3 className="mt-1 text-sm font-bold">{interaction.companyName || interaction.type || "Interaction"}</h3></div>{messages.length > 0 && <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 shadow-sm">{index + 1} / {messages.length}</span>}</div><div className="mt-5 flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">{current ? <><p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{current.outcome || "Empty message"}</p><p className="mt-4 text-[11px] text-slate-400">{formatDate(current.timeStamp)}</p></> : <div className="grid h-full place-items-center text-xs text-slate-400">No conversation messages recorded.</div>}</div>{messages.length > 1 && <div className="mt-4 flex justify-between"><button onClick={older} disabled={index >= messages.length - 1} className="flex items-center gap-1 rounded-lg border bg-white px-2.5 py-2 text-xs font-semibold disabled:opacity-35"><ChevronLeft size={15} />Older</button><button onClick={newer} disabled={index === 0} className="flex items-center gap-1 rounded-lg border bg-white px-2.5 py-2 text-xs font-semibold disabled:opacity-35">Newer<ChevronRight size={15} /></button></div>}</div>;
}

function Detail({ icon: Icon, label, value, href }: { icon: typeof Mail; label: string; value?: string; href?: string }) { return <div className="flex gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500"><Icon size={16} /></div><div className="min-w-0"><p className="text-xs text-slate-400">{label}</p>{href && value ? <a href={href} className="mt-0.5 block truncate text-sm font-semibold text-indigo-600">{value}</a> : <p className="mt-0.5 truncate text-sm font-semibold text-slate-700">{value || "—"}</p>}</div></div>; }
function Field({ label, value, change, type = "text", required }: { label: string; value: string; change: (value: string) => void; type?: string; required?: boolean }) { return <label><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span><input type={type} value={value} onChange={(event) => change(event.target.value)} required={required} className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" /></label>; }
