"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, CalendarPlus, ChevronDown, Plus, UserPlus, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../lib/api";
import { AsyncCombobox, LookupOption } from "./async-combobox";
import { INTERACTION_CHANNELS, INTERACTION_TYPES, LEAD_STATUSES, normalizeWebsite } from "../lib/crm";

type Kind = "company" | "contact" | "interaction";

export function QuickAdd() {
  const [menu, setMenu] = useState(false);
  const [kind, setKind] = useState<Kind | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", jobTitle: "", phone: "", industry: "", website: "", company: "", companyName: "", contact: "", contactName: "", type: "enquiry", channel: "email", status: "new", note: "", outcome: "" });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ path, body }: { path: string; body: object }) => api(path, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries();
      setKind(null); setError("");
      setForm({ name: "", email: "", jobTitle: "", phone: "", industry: "", website: "", company: "", companyName: "", contact: "", contactName: "", type: "enquiry", channel: "email", status: "new", note: "", outcome: "" });
    },
    onError: (reason) => setError(reason instanceof Error ? reason.message : "The record could not be created"),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!kind) return;
    if (kind === "company") return mutation.mutate({ path: "/companies/add", body: { name: { companyName: form.name.trim() }, industry: form.industry.trim(), website: normalizeWebsite(form.website) } });
    if (kind === "contact") return mutation.mutate({ path: "/contacts/add", body: { name: { fullName: form.name.trim() }, email: form.email.trim(), jobTitle: form.jobTitle.trim(), phone: { generic: form.phone.trim() }, ...(form.company ? { company: form.company } : {}) } });
    mutation.mutate({ path: "/interactions/add", body: {
      fullName: form.contactName || form.name.trim(), companyName: form.companyName,
      type: form.type, channel: form.channel, leadStatus: form.status, leadStages: [form.status], note: form.note.trim(),
      comms: form.outcome.trim() ? [{ outcome: form.outcome.trim(), timeStamp: new Date().toISOString() }] : [],
      ...(form.contact ? { contact: form.contact } : {}), ...(form.company ? { company: form.company } : {}),
    } });
  };

  const chooseContact = (option: LookupOption | null) => {
    setForm((current) => ({
      ...current,
      contact: option?.value || "",
      contactName: option?.label || "",
      company: option?.companyId || current.company,
      companyName: option?.companyName || current.companyName,
    }));
  };

  const modal = kind && <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate-950/45 p-4"><div role="dialog" aria-modal="true" aria-labelledby="quick-add-title" className="my-8 w-full max-w-xl rounded-2xl bg-white text-slate-900 shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><h2 id="quick-add-title" className="text-lg font-bold">Add {kind}</h2><p className="mt-1 text-xs text-slate-500">Create a new CRM record.</p></div><button aria-label="Close" onClick={() => setKind(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={19} /></button></div><form onSubmit={submit} className="p-6"><div className="grid gap-4 sm:grid-cols-2">
      {kind === "company" && <><Field label="Company name" value={form.name} change={(name) => setForm({ ...form, name })} required /><Field label="Industry" value={form.industry} change={(industry) => setForm({ ...form, industry })} /><Field label="Website" value={form.website} change={(website) => setForm({ ...form, website })} blur={() => setForm((current) => ({ ...current, website: normalizeWebsite(current.website) }))} /></>}
      {kind === "contact" && <><Field label="Full name" value={form.name} change={(name) => setForm({ ...form, name })} required /><Field label="Job title" value={form.jobTitle} change={(jobTitle) => setForm({ ...form, jobTitle })} /><Field label="Email" type="email" value={form.email} change={(email) => setForm({ ...form, email })} /><Field label="Phone" value={form.phone} change={(phone) => setForm({ ...form, phone })} /><AsyncCombobox label="Company (optional)" endpoint="/companies/lookup" value={form.company} selectedLabel={form.companyName} emptyLabel="Standalone contact" placeholder="Search companies…" onChange={(option) => setForm({ ...form, company: option?.value || "", companyName: option?.label || "" })} /></>}
      {kind === "interaction" && <><AsyncCombobox label="Contact (optional)" endpoint="/contacts/lookup" value={form.contact} selectedLabel={form.contactName} emptyLabel="No contact" placeholder="Search contacts…" onChange={chooseContact} /><AsyncCombobox label="Company (optional)" endpoint="/companies/lookup" value={form.company} selectedLabel={form.companyName} emptyLabel="No company" placeholder="Search companies…" onChange={(option) => setForm({ ...form, company: option?.value || "", companyName: option?.label || "" })} /><Field label="Name when no contact" value={form.name} change={(name) => setForm({ ...form, name })} /><Select label="Type" value={form.type} change={(type) => setForm({ ...form, type })} options={INTERACTION_TYPES.map((value) => ({ value, label: value.replaceAll("-", " ") }))} /><Select label="Channel" value={form.channel} change={(channel) => setForm({ ...form, channel })} options={INTERACTION_CHANNELS.map((value) => ({ value, label: value.replaceAll("-", " ") }))} /><Select label="Status" value={form.status} change={(status) => setForm({ ...form, status })} options={LEAD_STATUSES} /><Field label="Note" value={form.note} change={(note) => setForm({ ...form, note })} /><label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold text-slate-600">First message</span><textarea value={form.outcome} onChange={(event) => setForm({ ...form, outcome: event.target.value })} rows={4} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" /></label></>}
      </div>{error && <p className="mt-4 text-sm text-rose-600">{error}</p>}<div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setKind(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Cancel</button><button disabled={mutation.isPending} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{mutation.isPending ? "Creating…" : `Add ${kind}`}</button></div></form></div></div>;

  return <><div className="relative"><button onClick={() => setMenu((value) => !value)} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white"><Plus size={18} /><span className="hidden sm:inline">Quick add</span><ChevronDown size={14} /></button>{menu && <div className="absolute right-0 top-12 z-30 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"><QuickChoice icon={Building2} label="Company" click={() => { setKind("company"); setMenu(false); }} /><QuickChoice icon={UserPlus} label="Contact" click={() => { setKind("contact"); setMenu(false); }} /><QuickChoice icon={CalendarPlus} label="Interaction" click={() => { setKind("interaction"); setMenu(false); }} /></div>}</div>{modal ? createPortal(modal, document.body) : null}</>;
}

function QuickChoice({ icon: Icon, label, click }: { icon: typeof Building2; label: string; click: () => void }) { return <button onClick={click} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Icon size={17} className="text-slate-400" />{label}</button>; }
function Field({ label, value, change, blur, type = "text", required }: { label: string; value: string; change: (value: string) => void; blur?: () => void; type?: string; required?: boolean }) { return <label><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span><input type={type} value={value} onChange={(event) => change(event.target.value)} onBlur={blur} required={required} className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" /></label>; }
function Select({ label, value, change, options, empty }: { label: string; value: string; change: (value: string) => void; options: { value: string; label: string }[]; empty?: string }) { return <label><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span><select value={value} onChange={(event) => change(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"><option value="">{empty || "Select"}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
