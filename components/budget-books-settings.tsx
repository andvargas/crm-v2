"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Archive, ArchiveRestore, Check, LockKeyhole, Pencil, Plus, Trash2, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { api } from "../lib/api";
import { BUDGET_CURRENCIES, BUILT_IN_BUDGETS, useBudgetBooks } from "../lib/budget-books";
import { BudgetBook } from "../lib/crm";

const input = "h-10 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100";
const currencySelect = "h-10 shrink-0 rounded-xl border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";
const iconButton = "grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";

export function BudgetBooksSettings() {
  const queryClient = useQueryClient();
  const books = useBudgetBooks(true);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("GBP");
  const [error, setError] = useState("");
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["budget-books"] });
  const fail = (reason: unknown) => setError(reason instanceof Error ? reason.message : "The budget could not be saved");

  const create = useMutation({
    mutationFn: () => api<BudgetBook>("/budget-books", { method: "POST", body: JSON.stringify({ name: name.trim(), currency }) }),
    onSuccess: () => { setName(""); setCurrency("GBP"); setError(""); void refresh(); },
    onError: fail,
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { name?: string; currency?: string; archived?: boolean } }) => api<BudgetBook>(`/budget-books/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => { setError(""); void refresh(); },
    onError: fail,
  });
  const remove = useMutation({
    mutationFn: (id: string) => api<BudgetBook>(`/budget-books/${id}`, { method: "DELETE" }),
    onSuccess: () => { setError(""); void refresh(); },
    onError: fail,
  });

  const submit = (event: FormEvent) => { event.preventDefault(); if (name.trim()) create.mutate(); };
  const busy = create.isPending || update.isPending || remove.isPending;

  return <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
    <div className="mb-5"><h2 className="font-bold text-slate-950">Budgets</h2><p className="mt-1 text-xs text-slate-500">Each budget is a tab on the Budget and Cashflow pages. New budgets use the personal-style form, can use their own currency, and are not counted in the dashboard&apos;s combined net.</p></div>
    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
      {BUILT_IN_BUDGETS.map((budget) => <li key={budget.scope} className="flex items-center gap-3 px-4 py-3"><p className="flex-1 text-sm font-semibold text-slate-900">{budget.label}</p><span className="text-xs font-semibold text-slate-400">GBP</span><span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500"><LockKeyhole size={11} />Built-in</span></li>)}
      {books.data?.items.map((book) => <BudgetRow key={book._id} book={book} busy={busy}
        onRename={(value) => update.mutate({ id: book._id, body: { name: value } })}
        onCurrency={(value) => update.mutate({ id: book._id, body: { currency: value } })}
        onArchive={(archived) => update.mutate({ id: book._id, body: { archived } })}
        onDelete={() => { if (window.confirm(`Delete the "${book.name}" budget? This cannot be undone.`)) remove.mutate(book._id); }} />)}
    </ul>
    {books.isError && <p className="mt-3 text-sm text-rose-600">Custom budgets could not be loaded.</p>}
    <form onSubmit={submit} className="mt-4 flex gap-2"><input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} placeholder="New budget name, e.g. Household" aria-label="New budget name" className={input} /><select value={currency} onChange={(event) => setCurrency(event.target.value)} aria-label="New budget currency" className={currencySelect}>{BUDGET_CURRENCIES.map((code) => <option key={code}>{code}</option>)}</select><button disabled={busy || !name.trim()} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-50"><Plus size={16} />Add budget</button></form>
    {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
  </section>;
}

function BudgetRow({ book, busy, onRename, onCurrency, onArchive, onDelete }: { book: BudgetBook; busy: boolean; onRename: (name: string) => void; onCurrency: (currency: string) => void; onArchive: (archived: boolean) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(book.name);
  const archived = !!book.archivedAt;
  const save = (event: FormEvent) => { event.preventDefault(); if (name.trim() && name.trim() !== book.name) onRename(name.trim()); setEditing(false); };

  if (editing) return <li className="px-4 py-2.5"><form onSubmit={save} className="flex items-center gap-2"><input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} aria-label="Budget name" className={input} /><button aria-label="Save name" className={iconButton}><Check size={15} /></button><button type="button" aria-label="Cancel rename" onClick={() => { setName(book.name); setEditing(false); }} className={iconButton}><X size={15} /></button></form></li>;

  return <li className="flex items-center gap-3 px-4 py-3">
    <div className="min-w-0 flex-1"><p className={`truncate text-sm font-semibold ${archived ? "text-slate-400" : "text-slate-900"}`}>{book.name}</p><p className="mt-0.5 text-xs text-slate-400">{book.transactions} transaction{book.transactions === 1 ? "" : "s"}{archived ? " · Archived, hidden from tabs" : ""}</p></div>
    <select value={book.currency || "GBP"} disabled={busy || book.transactions > 0} onChange={(event) => onCurrency(event.target.value)} aria-label={`Currency of ${book.name}`} title={book.transactions > 0 ? "The currency is locked once the budget has transactions." : "Currency"} className={currencySelect}>{[...new Set([book.currency || "GBP", ...BUDGET_CURRENCIES])].map((code) => <option key={code}>{code}</option>)}</select>
    <button type="button" disabled={busy} onClick={() => setEditing(true)} aria-label={`Rename ${book.name}`} title="Rename" className={iconButton}><Pencil size={15} /></button>
    <button type="button" disabled={busy} onClick={() => onArchive(!archived)} aria-label={archived ? `Restore ${book.name}` : `Archive ${book.name}`} title={archived ? "Restore" : "Archive"} className={iconButton}>{archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}</button>
    <button type="button" disabled={busy || book.transactions > 0} onClick={onDelete} aria-label={`Delete ${book.name}`} title={book.transactions > 0 ? "Only empty budgets can be deleted. Archive it instead." : "Delete"} className={`${iconButton} hover:text-rose-600`}><Trash2 size={15} /></button>
  </li>;
}
