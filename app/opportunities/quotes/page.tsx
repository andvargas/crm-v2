"use client";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CrmShell } from '../../../components/crm-shell';
import { SafeLink as Link } from '../../../components/safe-link';
import { QuoteEditor } from '../../../components/quote-editor';
import { api } from '../../../lib/api';
import { FinanceSettings, Opportunity, formatDate } from '../../../lib/crm';
import { Quote, hasTimeEstimates, money } from '../../../lib/quotes';
export default function QuotesPage() {
  const client = useQueryClient();
  const params = useSearchParams();
  const [search, setSearch] = useState('');
  const [opportunity, setOpportunity] = useState(params.get('opportunity') || '');
  const [status, setStatus] = useState('');
  const [creating, setCreating] = useState(false);
  const quotes = useQuery({ queryKey: ['quotes'], queryFn: () => api<Quote[]>('/quotes') });
  const opportunities = useQuery({ queryKey: ['opportunities'], queryFn: () => api<Opportunity[]>('/opportunities') });
  const settings = useQuery({ queryKey: ['finance-settings'], queryFn: () => api<{ settings: FinanceSettings | null }>('/finance-settings') });
  const items = (quotes.data || []).filter(item => (!opportunity || item.opportunity?._id === opportunity) && (!status || item.status === status) && [item.title, item.number, item.customerName, item.opportunity?.name].some(value => value?.toLowerCase().includes(search.toLowerCase())));
  return <CrmShell activePath="/opportunities/quotes" search={search} onSearch={setSearch}><div className="mx-auto max-w-[1400px] px-4 py-7 md:px-8 md:py-9">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-indigo-600">Opportunities</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Quotes</h1><p className="mt-2 text-sm text-slate-500">Build modular proposals. Keep every option and revision with its opportunity.</p></div><button disabled={!opportunities.data?.length || settings.isLoading} onClick={() => setCreating(true)} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">+ New quote</button></div>
    {opportunities.isError && <p role="alert" className="mt-4 text-sm text-rose-600">Opportunities could not be loaded. Reload to try again.</p>}{opportunities.isSuccess && !opportunities.data.length && <p className="mt-4 text-sm text-slate-600"><Link href="/opportunities" className="font-semibold text-indigo-600">Create an opportunity</Link> before adding its first quote.</p>}
    <div className="my-6 flex flex-wrap gap-3"><select aria-label="Filter by opportunity" value={opportunity} onChange={e => setOpportunity(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">All opportunities</option>{opportunities.data?.map(item => <option key={item._id} value={item._id}>{item.name}</option>)}</select><select aria-label="Filter by status" value={status} onChange={e => setStatus(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">All statuses</option>{['draft', 'sent', 'accepted', 'declined', 'closed'].map(value => <option key={value} value={value}>{value}</option>)}</select></div>
    {quotes.isLoading ? <p className="py-12 text-center">Loading quotes…</p> : quotes.isError ? <p role="alert" className="py-12 text-center text-rose-600">Quotes could not be loaded. Reload to try again.</p> : <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="w-full min-w-[750px] text-left text-sm"><thead className="border-b border-slate-100 text-xs uppercase text-slate-400"><tr><th className="p-5">Quote</th><th className="p-5">Customer / opportunity</th><th className="p-5">Status</th><th className="p-5">Valid until</th><th className="p-5 text-right">Total</th></tr></thead><tbody>{items.map(item => <tr key={item._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50"><td className="p-5"><Link href={`/opportunities/quotes/${item._id}`} className="font-bold text-indigo-700">{item.title}</Link><p className="mt-1 text-xs text-slate-400">{item.number}</p></td><td className="p-5">{item.customerName}<p className="mt-1 text-xs text-slate-400">{item.opportunity?.name || 'Opportunity unavailable'}</p></td><td className="p-5"><span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold capitalize text-indigo-700">{item.status}</span></td><td className="p-5 text-slate-500">{item.validUntil ? formatDate(item.validUntil) : 'No expiry'}</td><td className="p-5 text-right font-bold">{money(item.total, item.currency)}{hasTimeEstimates(item.lineItems) && <span className="mt-1 block text-xs font-normal text-slate-500">Estimated</span>}</td></tr>)}</tbody></table>{!items.length && <div className="px-5 py-16 text-center"><p className="font-semibold">No quotes yet in this view</p><p className="mt-2 text-sm text-slate-500">Create a quote to start assembling your proposal.</p></div>}</div>}
  </div>{creating && <QuoteEditor opportunities={opportunities.data || []} selectedOpportunity={opportunity} settings={settings.data?.settings} onClose={() => setCreating(false)} onSaved={quote => { client.invalidateQueries({ queryKey: ['quotes'] }); window.location.assign(`/opportunities/quotes/${quote._id}`); }} />}</CrmShell>;
}
