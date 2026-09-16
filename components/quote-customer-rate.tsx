"use client";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';
import { money } from '../lib/quotes';
type CustomerRate = { customer: { type: 'company' | 'contact'; id: string; name: string } | null; hourlyRate: number | null; canEdit: boolean };
const button = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50';
export function QuoteCustomerRate({ opportunity, currency, hasHourlyItems, onApply }: { opportunity: string; currency: string; hasHourlyItems: boolean; onApply: (rate: number) => void }) {
  const client = useQueryClient();
  const key = ['quote-customer-rate', opportunity, currency];
  const query = useQuery({ queryKey: key, queryFn: () => api<CustomerRate>(`/quotes/customer-rate?opportunity=${encodeURIComponent(opportunity)}&currency=${encodeURIComponent(currency)}`), enabled: Boolean(opportunity) });
  const save = useMutation({ mutationFn: (hourlyRate: number) => api<CustomerRate>('/quotes/customer-rate', { method: 'PUT', body: JSON.stringify({ opportunity, currency, hourlyRate }) }), onSuccess: data => { client.setQueryData(key, data); client.invalidateQueries({ queryKey: ['quote-customer-rate'] }); } });
  return <section className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4"><h3 className="font-bold">Customer hourly rate</h3>
    {!opportunity ? <p className="mt-2 text-sm text-slate-500">Select an opportunity to look up its customer rate.</p> : query.isLoading ? <p className="mt-2 text-sm text-slate-500">Loading customer rate…</p> : query.isError ? <p role="alert" className="mt-2 text-sm text-rose-600">Customer rate could not be loaded. <button type="button" className="underline" onClick={() => query.refetch()}>Retry</button></p> : !query.data?.customer ? <p className="mt-2 text-sm text-slate-500">Link this opportunity to a company or contact to remember their rate. You can still enter a rate on each item below.</p> : <>
      <p className="mt-2 text-sm text-slate-600">{query.data.customer.name} · {query.data.hourlyRate === null ? `No saved rate in ${currency}` : `${money(query.data.hourlyRate, currency)} / hour`}</p>
      <RateControls key={`${opportunity}-${currency}-${query.data.hourlyRate}`} rate={query.data.hourlyRate} currency={currency} canEdit={query.data.canEdit} hasHourlyItems={hasHourlyItems} saving={save.isPending} onSave={rate => save.mutate(rate)} onApply={onApply} />
      <p className="mt-3 text-xs leading-5 text-slate-500">Save a rate for this {query.data.customer.type} in {currency}, then apply it to this quote’s hourly items. Saved rates do not change existing quotes or daily rates.</p>
    </>}{save.error && <p role="alert" className="mt-2 text-sm text-rose-600">{save.error.message}</p>}{save.isSuccess && <p role="status" className="mt-2 text-sm text-emerald-700">Customer rate saved.</p>}
  </section>;
}
function RateControls({ rate, currency, canEdit, hasHourlyItems, saving, onSave, onApply }: { rate: number | null; currency: string; canEdit: boolean; hasHourlyItems: boolean; saving: boolean; onSave: (rate: number) => void; onApply: (rate: number) => void }) {
  const [value, setValue] = useState(rate === null ? '' : String(rate));
  const [applied, setApplied] = useState(false);
  const valid = value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 10000000;
  return <><div className="mt-3 flex flex-wrap items-end gap-3">{canEdit && <><label className="text-sm font-semibold">Saved hourly rate ({currency})<input aria-label={`Saved hourly rate (${currency})`} className="mt-1 block w-44 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal" type="number" min="0" max="10000000" step="any" value={value} onChange={event => setValue(event.target.value)} /></label><button type="button" className={button} disabled={!valid || saving} onClick={() => onSave(Number(value))}>{saving ? 'Saving…' : 'Save customer rate'}</button></>}
    <button type="button" className={button} disabled={rate === null || !hasHourlyItems} onClick={() => { if (rate !== null) { onApply(rate); setApplied(true); } }}>Apply saved rate to hourly items</button></div>{applied && <p role="status" className="mt-2 text-sm text-emerald-700">Saved rate applied to the current hourly items.</p>}{!hasHourlyItems && <p className="mt-2 text-xs text-slate-500">Add a time estimate in hours to use the saved rate.</p>}</>;
}
