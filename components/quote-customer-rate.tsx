"use client";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';
import { money } from '../lib/quotes';
// hourlyRate is the customer's default rate when it is in the requested currency; savedRate/rateCurrency describe the default whatever its currency.
type CustomerRate = { customer: { type: 'company' | 'contact'; id: string; name: string } | null; hourlyRate: number | null; savedRate: number | null; rateCurrency: string | null; canEdit: boolean };
const button = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50';
// Customer rates are keyed by customer and currency; quotes find the customer through their opportunity, invoices through their company or contact.
export type CustomerRateLookup = { endpoint: '/quotes/customer-rate' | '/invoices/customer-rate'; params: Record<string, string> };
const rateKey = (lookup: CustomerRateLookup, currency: string) => ['customer-rate', lookup.endpoint, lookup.params, currency];
const hasCustomer = (lookup: CustomerRateLookup) => Object.values(lookup.params).some(Boolean);
export function useCustomerRate(lookup: CustomerRateLookup, currency: string) {
  return useQuery({ queryKey: rateKey(lookup, currency), queryFn: () => api<CustomerRate>(`${lookup.endpoint}?${new URLSearchParams({ ...lookup.params, currency })}`), enabled: hasCustomer(lookup) });
}
export function QuoteCustomerRate({ opportunity, currency, hasHourlyItems, onApply }: { opportunity: string; currency: string; hasHourlyItems: boolean; onApply: (rate: number) => void }) {
  return <CustomerRatePanel lookup={{ endpoint: '/quotes/customer-rate', params: { opportunity } }} document="quote" missing="Select an opportunity to look up its customer rate." unlinked="Link this opportunity to a company or contact to remember their rate. You can still enter a rate on each item below." currency={currency} hasHourlyItems={hasHourlyItems} onApply={onApply} />;
}
export function CustomerRatePanel({ lookup, document, missing, unlinked, currency, hasHourlyItems, onApply }: { lookup: CustomerRateLookup; document: 'quote' | 'invoice'; missing: string; unlinked?: string; currency: string; hasHourlyItems: boolean; onApply: (rate: number) => void }) {
  const client = useQueryClient();
  const query = useCustomerRate(lookup, currency);
  const save = useMutation({ mutationFn: (hourlyRate: number) => api<CustomerRate>(lookup.endpoint, { method: 'PUT', body: JSON.stringify({ ...Object.fromEntries(Object.entries(lookup.params).filter(([, value]) => value)), currency, hourlyRate }) }), onSuccess: data => { client.setQueryData(rateKey(lookup, currency), data); client.invalidateQueries({ queryKey: ['customer-rate'] }); } });
  return <section className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4"><h3 className="font-bold">Customer hourly rate</h3>
    {!hasCustomer(lookup) ? <p className="mt-2 text-sm text-slate-500">{missing}</p> : query.isLoading ? <p className="mt-2 text-sm text-slate-500">Loading customer rate…</p> : query.isError ? <p role="alert" className="mt-2 text-sm text-rose-600">Customer rate could not be loaded. <button type="button" className="underline" onClick={() => query.refetch()}>Retry</button></p> : !query.data?.customer ? <p className="mt-2 text-sm text-slate-500">{unlinked}</p> : <>
      <p className="mt-2 text-sm text-slate-600">{query.data.customer.name} · {query.data.savedRate === null || !query.data.rateCurrency ? 'No default hourly rate' : `${money(query.data.savedRate, query.data.rateCurrency)} / hour`}</p>
      {query.data.hourlyRate === null && query.data.rateCurrency && query.data.rateCurrency !== currency && <p className="mt-1 text-xs text-amber-700">The default rate is in {query.data.rateCurrency}, so it is not applied to this {document} in {currency}.</p>}
      <RateControls key={`${JSON.stringify(lookup.params)}-${currency}-${query.data.hourlyRate}`} rate={query.data.hourlyRate} currency={currency} canEdit={query.data.canEdit} hasHourlyItems={hasHourlyItems} saving={save.isPending} onSave={rate => save.mutate(rate)} onApply={onApply} />
      <p className="mt-3 text-xs leading-5 text-slate-500">The default rate is kept on the {query.data.customer.type} record{query.data.customer.type === 'company' ? ' (also editable on the company page)' : ''} and used by its quotes and invoices. Saving here makes {currency} the default; it does not change existing quotes, invoices or daily rates.</p>
    </>}{save.error && <p role="alert" className="mt-2 text-sm text-rose-600">{save.error.message}</p>}{save.isSuccess && <p role="status" className="mt-2 text-sm text-emerald-700">Customer rate saved.</p>}
  </section>;
}
function RateControls({ rate, currency, canEdit, hasHourlyItems, saving, onSave, onApply }: { rate: number | null; currency: string; canEdit: boolean; hasHourlyItems: boolean; saving: boolean; onSave: (rate: number) => void; onApply: (rate: number) => void }) {
  const [value, setValue] = useState(rate === null ? '' : String(rate));
  const [applied, setApplied] = useState(false);
  const valid = value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 10000000;
  return <><div className="mt-3 flex flex-wrap items-end gap-3">{canEdit && <><label className="text-sm font-semibold">Default hourly rate ({currency})<input aria-label={`Default hourly rate (${currency})`} className="mt-1 block w-44 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal" type="number" min="0" max="10000000" step="any" value={value} onChange={event => setValue(event.target.value)} /></label><button type="button" className={button} disabled={!valid || saving} onClick={() => onSave(Number(value))}>{saving ? 'Saving…' : 'Save as default rate'}</button></>}
    <button type="button" className={button} disabled={rate === null || !hasHourlyItems} onClick={() => { if (rate !== null) { onApply(rate); setApplied(true); } }}>Apply saved rate to hourly items</button></div>{applied && <p role="status" className="mt-2 text-sm text-emerald-700">Saved rate applied to the current hourly items.</p>}{!hasHourlyItems && <p className="mt-2 text-xs text-slate-500">Add a time item in hours to use the saved rate.</p>}</>;
}
