"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, UserPlus, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../lib/api";
import { AsyncCombobox, LookupOption } from "./async-combobox";
import { Contact, Interaction } from "../lib/crm";

type LookupResponse = { items: LookupOption[]; hasMore: boolean };
type Mode = "create" | "assign";

export function ActivityContactModal({ interaction, mode, onClose }: {
  interaction: Interaction | null;
  mode: Mode;
  onClose: () => void;
}) {
  if (!interaction) return null;
  return <Modal key={`${interaction._id}-${mode}`} interaction={interaction} mode={mode} onClose={onClose} />;
}

function Modal({ interaction, mode, onClose }: { interaction: Interaction; mode: Mode; onClose: () => void }) {
  const queryClient = useQueryClient();
  const existingContact = interaction.contact && typeof interaction.contact === "object" ? interaction.contact : null;
  const linkedCompany = interaction.company && typeof interaction.company === "object" ? interaction.company : null;
  const activityCompanyName = linkedCompany?.name?.companyName || interaction.companyName || "";
  const [name, setName] = useState(existingContact?.name?.fullName || interaction.fullName || "");
  const [company, setCompany] = useState<LookupOption | null>(linkedCompany ? {
    value: linkedCompany._id, label: linkedCompany.name?.companyName || activityCompanyName,
  } : null);
  const [contact, setContact] = useState<LookupOption | null>(null);
  const [error, setError] = useState("");

  const companyMatches = useQuery({
    queryKey: ["company-exact-match", activityCompanyName],
    queryFn: () => api<LookupResponse>(`/companies/lookup?search=${encodeURIComponent(activityCompanyName)}&limit=20`),
    enabled: mode === "create" && !company && Boolean(activityCompanyName),
  });
  useEffect(() => {
    if (company || !activityCompanyName) return;
    const exact = companyMatches.data?.items.find((item) => item.label.trim().toLocaleLowerCase() === activityCompanyName.trim().toLocaleLowerCase());
    if (exact) setCompany(exact);
  }, [activityCompanyName, company, companyMatches.data]);

  const refresh = async () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["activity-feed"] }),
    queryClient.invalidateQueries({ queryKey: ["interactions"] }),
    queryClient.invalidateQueries({ queryKey: ["contacts"] }),
    queryClient.invalidateQueries({ queryKey: ["companies"] }),
  ]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (mode === "assign") {
        if (!contact) throw new Error("Select a contact to assign");
        return api<Interaction>(`/interactions/${interaction._id}`, { method: "PATCH", body: JSON.stringify({
          contact: contact.value, fullName: contact.label,
          ...(contact.companyId ? { company: contact.companyId, companyName: contact.companyName || "" } : {}),
        }) });
      }
      if (!name.trim()) throw new Error("Contact name is required");
      const created = await api<Contact>("/contacts/add", { method: "POST", body: JSON.stringify({
        name: { fullName: name.trim() }, ...(company ? { company: company.value } : {}),
      }) });
      return api<Interaction>(`/interactions/${interaction._id}`, { method: "PATCH", body: JSON.stringify({
        contact: created._id, fullName: name.trim(),
        ...(company ? { company: company.value, companyName: company.label } : {}),
      }) });
    },
    onSuccess: async () => { await refresh(); onClose(); },
    onError: (reason) => setError(reason instanceof Error ? reason.message : "The contact could not be linked"),
  });

  const submit = (event: FormEvent) => { event.preventDefault(); setError(""); mutation.mutate(); };
  return createPortal(<div className="fixed inset-0 z-[160] grid place-items-center overflow-y-auto bg-slate-950/45 p-4"><div role="dialog" aria-modal="true" className="my-8 w-full max-w-lg rounded-2xl bg-white shadow-2xl">
    <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5"><div><h2 className="text-lg font-bold">{mode === "create" ? "Create contact from activity" : "Assign activity to contact"}</h2><p className="mt-1 text-xs text-slate-500">{mode === "create" ? "Review the available activity details before creating the contact." : "Search for the existing contact that owns this activity."}</p></div><button type="button" aria-label="Close" onClick={onClose} className="rounded-lg p-2 text-slate-400"><X size={19} /></button></div>
    <form onSubmit={submit} className="space-y-4 p-6">{mode === "create" ? <><Field label="Contact name" value={name} onChange={setName} /><AsyncCombobox label="Company" endpoint="/companies/lookup" value={company?.value || ""} selectedLabel={company?.label} emptyLabel={activityCompanyName ? `No exact match for ${activityCompanyName}` : "No company"} placeholder="Search companies…" onChange={setCompany} />{activityCompanyName && !company && <p className="text-xs text-amber-700">Activity company: {activityCompanyName}. Search and select it if it already exists.</p>}</> : <AsyncCombobox label="Contact" endpoint="/contacts/lookup" value={contact?.value || ""} selectedLabel={contact?.label} emptyLabel="Select a contact" placeholder="Search contacts…" onChange={setContact} />}
      {error && <p className="text-sm text-rose-600">{error}</p>}<div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Cancel</button><button disabled={mutation.isPending} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{mode === "create" ? <UserPlus size={16} /> : <Save size={16} />}{mutation.isPending ? "Saving…" : mode === "create" ? "Create and link" : "Assign contact"}</button></div>
    </form>
  </div></div>, document.body);
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} required className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" /></label>;
}
