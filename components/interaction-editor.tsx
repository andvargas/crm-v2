"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Trash2, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../lib/api";
import { Interaction, INTERACTION_CHANNELS, INTERACTION_TYPES, LEAD_STATUSES, formatDate } from "../lib/crm";

export function InteractionEditor({ interaction, onClose }: { interaction: Interaction | null; onClose: () => void }) {
  if (!interaction) return null;
  return <InteractionEditorModal key={interaction._id} interaction={interaction} onClose={onClose} />;
}

function InteractionEditorModal({ interaction, onClose }: { interaction: Interaction; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState({
    fullName: interaction.fullName || "", companyName: interaction.companyName || "", type: interaction.type || "",
    channel: interaction.channel || "", leadStatus: interaction.leadStatus || "", note: interaction.note || "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["interactions"] }),
      queryClient.invalidateQueries({ queryKey: ["activity-feed"] }),
      queryClient.invalidateQueries({ queryKey: ["contacts"] }),
      queryClient.invalidateQueries({ queryKey: ["companies"] }),
      queryClient.invalidateQueries({ queryKey: ["contact"] }),
      queryClient.invalidateQueries({ queryKey: ["company"] }),
      queryClient.invalidateQueries({ queryKey: ["reports"] }),
    ]);
  };
  const save = useMutation({
    mutationFn: async () => {
      await api<Interaction>(`/interactions/${interaction._id}`, { method: "PATCH", body: JSON.stringify(draft) });
      if (message.trim()) {
        await api<Interaction>(`/interactions/${interaction._id}/messages`, { method: "POST", body: JSON.stringify({ outcome: message.trim() }) });
      }
    },
    onSuccess: async () => { await refresh(); onClose(); },
    onError: (reason) => setError(reason instanceof Error ? reason.message : "The interaction could not be saved"),
  });
  const remove = useMutation({
    mutationFn: () => api<Interaction>(`/interactions/${interaction._id}`, { method: "DELETE" }),
    onSuccess: async () => { await refresh(); onClose(); },
    onError: (reason) => setError(reason instanceof Error ? reason.message : "The interaction could not be deleted"),
  });
  const deleteInteraction = () => {
    const name = interaction.fullName || interaction.companyName || "this interaction";
    if (window.confirm(`Delete ${name}? This will also remove its conversation messages and cannot be undone.`)) {
      setError("");
      remove.mutate();
    }
  };

  const submit = (event: FormEvent) => { event.preventDefault(); setError(""); save.mutate(); };
  const modal = <div className="fixed inset-0 z-[150] grid place-items-center overflow-y-auto bg-slate-950/45 p-4"><div role="dialog" aria-modal="true" aria-labelledby="interaction-editor-title" className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-slate-100 px-6 py-5"><div><div className="flex flex-wrap items-center gap-2"><h2 id="interaction-editor-title" className="text-lg font-bold text-slate-950">Edit interaction</h2>{interaction.createdAt && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">Created {formatDate(interaction.createdAt)}</span>}</div><p className="mt-1 text-xs text-slate-500">Update the activity or continue its conversation.</p></div><button type="button" aria-label="Close" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={19} /></button></div>
    <form onSubmit={submit}><div className="p-6"><div className="grid gap-4 sm:grid-cols-2"><Field label="Contact name" value={draft.fullName} onChange={(fullName) => setDraft({ ...draft, fullName })} /><Field label="Company name" value={draft.companyName} onChange={(companyName) => setDraft({ ...draft, companyName })} /><SelectField label="Type" value={draft.type} options={INTERACTION_TYPES} onChange={(type) => setDraft({ ...draft, type })} /><SelectField label="Channel" value={draft.channel} options={INTERACTION_CHANNELS} onChange={(channel) => setDraft({ ...draft, channel })} /><StatusField value={draft.leadStatus} onChange={(leadStatus) => setDraft({ ...draft, leadStatus })} /><label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Note</span><textarea rows={3} value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" /></label></div>{interaction.comms?.length ? <div className="mt-5"><p className="text-xs font-semibold text-slate-600">Conversation · {interaction.comms.length} messages</p><div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-2">{[...interaction.comms].reverse().map((item, index) => <div key={item._id || index} className="rounded-lg border border-slate-200 bg-white p-3"><p className="whitespace-pre-wrap text-sm leading-5 text-slate-700">{item.outcome || "Empty message"}</p>{item.timeStamp && <p className="mt-2 text-[11px] text-slate-400">{formatDate(item.timeStamp)}</p>}</div>)}</div></div> : null}</div><div className="border-t border-slate-100 bg-slate-50/60 p-6"><label><span className="mb-1.5 block text-xs font-semibold text-slate-600">New conversation message <span className="font-normal text-slate-400">(optional)</span></span><textarea rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Add the latest email, call summary or message…" className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" /></label>{error && <p className="mt-3 text-sm text-rose-600">{error}</p>}<div className="mt-4 flex items-center justify-between gap-3"><button type="button" onClick={deleteInteraction} disabled={save.isPending || remove.isPending} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-40"><Trash2 size={16} />{remove.isPending ? "Deleting…" : "Delete interaction"}</button><button disabled={save.isPending || remove.isPending} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save size={16} />{save.isPending ? "Saving…" : "Save"}</button></div></div></form>
  </div></div>;
  return createPortal(modal, document.body);
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" /></label>;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm capitalize outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100">{options.map((option) => <option key={option} value={option}>{option.replaceAll("-", " ")}</option>)}</select></label>;
}

function StatusField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label><span className="mb-1.5 block text-xs font-semibold text-slate-600">Status</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"><option value="">Select…</option>{LEAD_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}
