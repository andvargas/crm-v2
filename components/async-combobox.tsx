"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, LoaderCircle, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { api } from "../lib/api";

export type LookupOption = {
  value: string;
  label: string;
  description?: string;
  companyId?: string;
  companyName?: string;
};

type LookupResponse = { items: LookupOption[]; hasMore: boolean };

export function AsyncCombobox({ label, endpoint, value, selectedLabel, onChange, emptyLabel = "No selection", placeholder = "Type to search…" }: {
  label: string;
  endpoint: "/companies/lookup" | "/contacts/lookup";
  value: string;
  selectedLabel?: string;
  onChange: (option: LookupOption | null) => void;
  emptyLabel?: string;
  placeholder?: string;
}) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const query = useQuery({
    queryKey: ["lookup", endpoint, debouncedSearch],
    queryFn: () => api<LookupResponse>(`${endpoint}?search=${encodeURIComponent(debouncedSearch)}&limit=20`),
    enabled: open,
    staleTime: 30_000,
  });

  return <div ref={rootRef} className="relative">
    <label id={`${id}-label`} className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</label>
    <button type="button" aria-labelledby={`${id}-label`} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)} className="flex h-11 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-left text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100">
      <span className={`min-w-0 flex-1 truncate ${value ? "text-slate-900" : "text-slate-400"}`}>{value ? selectedLabel || "Selected record" : emptyLabel}</span>
      {value ? <span role="button" aria-label={`Clear ${label}`} tabIndex={0} onClick={(event) => { event.stopPropagation(); onChange(null); setSearch(""); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); onChange(null); } }} className="rounded p-0.5 text-slate-400 hover:bg-slate-100"><X size={15} /></span> : <ChevronsUpDown size={16} className="text-slate-400" />}
    </button>
    {open && <div className="absolute z-[120] mt-2 w-full min-w-[260px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
      <div className="relative border-b border-slate-100 p-2"><Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={placeholder} className="h-10 w-full rounded-lg bg-slate-50 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-100" /></div>
      <div role="listbox" aria-labelledby={`${id}-label`} className="max-h-64 overflow-y-auto p-1.5">
        {query.isFetching && <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-slate-500"><LoaderCircle size={16} className="animate-spin" />Searching…</div>}
        {!query.isFetching && query.data?.items.map((option) => <button type="button" role="option" aria-selected={option.value === value} key={option.value} onClick={() => { onChange(option); setSearch(""); setOpen(false); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50">
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800">{option.label}</span>{option.description && <span className="mt-0.5 block truncate text-xs text-slate-400">{option.description}</span>}</span>
          {option.value === value && <Check size={16} className="shrink-0 text-indigo-600" />}
        </button>)}
        {!query.isFetching && query.data?.items.length === 0 && <p className="px-3 py-7 text-center text-sm text-slate-500">No matching records.</p>}
        {!query.isFetching && query.data?.hasMore && <p className="border-t border-slate-100 px-3 py-2 text-center text-[11px] text-slate-400">Keep typing to narrow the results.</p>}
        {query.isError && <p className="px-3 py-7 text-center text-sm text-rose-600">Results could not be loaded.</p>}
      </div>
    </div>}
  </div>;
}
