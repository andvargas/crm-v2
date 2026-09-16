"use client";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { api } from '../lib/api';
import { FinanceSettings, Opportunity } from '../lib/crm';
import { QuoteCustomerRate } from './quote-customer-rate';
import { QuoteItemsEditor } from './quote-items-editor';
import { blankLine, hasTimeEstimates, timeEstimateNote, money, Quote, QuoteDraft, QuoteModule, toDraft, totals } from '../lib/quotes';
const input = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm';
const button = 'rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-50';
export function QuoteEditor({ quote, opportunities, selectedOpportunity, settings, onClose, onSaved }: {
  quote?: Quote; opportunities: Opportunity[]; selectedOpportunity?: string; settings?: FinanceSettings | null;
  onClose: () => void; onSaved: (quote: Quote) => void;
}) {
  const client = useQueryClient();
  const selected = opportunities.find(item => item._id === selectedOpportunity);
  const selectedCompany = selected && typeof selected.company === 'object' ? selected.company : null;
  const selectedContact = selected && typeof selected.contact === 'object' ? selected.contact : null;
  const [draft, setDraft] = useState<QuoteDraft>(() => quote ? toDraft(quote) : {
    opportunity: selectedOpportunity || '', title: selected?.name || '', customerName: selectedCompany?.name.companyName || selectedContact?.name?.fullName || '', customerEmail: selectedContact?.email || selectedCompany?.genericEmail || '', customerAddress: '',
    sellerName: settings?.tradingName || settings?.sellerName || '', sellerEmail: settings?.email || '', sellerAddress: settings?.address || '',
    issueDate: new Date().toISOString(), validUntil: null, currency: selected?.currency || settings?.defaultCurrency || 'GBP', lineItems: [blankLine()],
    discount: 0, vatRate: 0, introduction: '', terms: '',
  });
  const [moduleName, setModuleName] = useState('');
  const [moduleMessage, setModuleMessage] = useState('');
  const [error, setError] = useState('');
  const modules = useQuery({ queryKey: ['quote-modules'], queryFn: () => api<QuoteModule[]>('/quotes/modules') });
  const save = useMutation({ mutationFn: () => api<Quote>(quote ? `/quotes/${quote._id}` : '/quotes', { method: quote ? 'PATCH' : 'POST', body: JSON.stringify({ ...draft, ...(quote ? { version: quote.__v } : {}) }) }), onSuccess: onSaved, onError: (cause: Error) => setError(cause.message) });
  const saveModule = useMutation({ mutationFn: () => api<QuoteModule>('/quotes/modules', { method: 'POST', body: JSON.stringify({ name: moduleName, currency: draft.currency, lineItems: draft.lineItems }) }), onSuccess: () => { client.invalidateQueries({ queryKey: ['quote-modules'] }); setModuleName(''); setModuleMessage('Module saved to the library.'); }, onError: (cause: Error) => setError(cause.message) });
  const set = <K extends keyof QuoteDraft>(key: K, value: QuoteDraft[K]) => setDraft(current => ({ ...current, [key]: value }));
  const selectOpportunity = (id: string) => {
    const opportunity = opportunities.find(item => item._id === id);
    const company = opportunity && typeof opportunity.company === 'object' ? opportunity.company : null;
    const contact = opportunity && typeof opportunity.contact === 'object' ? opportunity.contact : null;
    setDraft(current => ({ ...current, opportunity: id, title: current.title || opportunity?.name || '', currency: opportunity?.currency || current.currency,
      customerName: company?.name.companyName || contact?.name?.fullName || current.customerName, customerEmail: contact?.email || company?.genericEmail || current.customerEmail }));
  };
  const amount = totals(draft);
  const submit = (event: FormEvent) => { event.preventDefault(); setError(''); if (draft.discount > amount.subtotal) return setError('Discount cannot exceed the subtotal.'); save.mutate(); };
  return <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/45 p-3 md:p-6"><form onSubmit={submit} className="mx-auto max-w-5xl rounded-2xl bg-white p-5 shadow-xl md:p-8" role="dialog" aria-modal="true" aria-label={quote ? 'Edit quote' : 'New quote'}>
    <div className="flex justify-between gap-4"><div><h2 className="text-xl font-bold">{quote ? `Edit ${quote.number}` : 'New quote'}</h2><p className="mt-1 text-sm text-slate-500">Build your proposal from reusable modules or individual items.</p></div><button type="button" className={button} onClick={onClose}>Close</button></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Opportunity<select aria-label="Opportunity" required className={input} value={draft.opportunity} onChange={e => selectOpportunity(e.target.value)}><option value="">Select an opportunity</option>{opportunities.map(item => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label>
      <Field label="Quote title" value={draft.title} onChange={v => set('title', v)} required />
      <Field label="Customer name" value={draft.customerName} onChange={v => set('customerName', v)} required /><Field label="Customer email" type="email" value={draft.customerEmail} onChange={v => set('customerEmail', v)} />
      <Field label="Your business name" value={draft.sellerName} onChange={v => set('sellerName', v)} required /><Field label="Your email" type="email" value={draft.sellerEmail} onChange={v => set('sellerEmail', v)} />
      <Field label="Customer address" value={draft.customerAddress} onChange={v => set('customerAddress', v)} multiline /><Field label="Your address" value={draft.sellerAddress} onChange={v => set('sellerAddress', v)} multiline />
      <Field label="Issue date" type="date" value={draft.issueDate.slice(0, 10)} onChange={v => set('issueDate', v ? `${v}T12:00:00.000Z` : '')} required /><Field label="Valid until (optional)" type="date" value={draft.validUntil?.slice(0, 10) || ''} onChange={v => set('validUntil', v ? `${v}T12:00:00.000Z` : null)} />
      <label className="text-sm font-semibold">Currency<select aria-label="Currency" className={input} value={draft.currency} onChange={e => set('currency', e.target.value)}>{Array.from(new Set([draft.currency, 'GBP', 'EUR', 'USD', 'RON', 'HUF'])).map(value => <option key={value}>{value}</option>)}</select></label>
    </div><div className="mt-4"><Field label="Introduction / scope" multiline value={draft.introduction} onChange={v => set('introduction', v)} /></div>
    <section className="mt-6 rounded-xl bg-slate-50 p-4"><h3 className="font-bold">Module library</h3><p className="mt-1 text-xs text-slate-500">Add a saved package of services. Its items become an editable copy in this quote.</p><select aria-label="Add saved module" className={input} value="" disabled={modules.isLoading || modules.isError} onChange={e => { const savedModule = modules.data?.find(item => item._id === e.target.value); if (savedModule) { const lines = [...draft.lineItems.filter(item => item.description.trim()), ...savedModule.lineItems.map(item => ({ ...item }))]; if (lines.length > 100) setError('A quote can contain at most 100 items.'); else set('lineItems', lines); } }}><option value="">{modules.isLoading ? 'Loading modules…' : 'Choose a module to add'}</option>{modules.data?.filter(savedModule => savedModule.currency === draft.currency).map(savedModule => <option key={savedModule._id} value={savedModule._id}>{savedModule.name} ({savedModule.lineItems.length} items)</option>)}</select>{modules.isError && <p role="alert" className="text-sm text-rose-600">Module library could not be loaded.</p>}<p className="mt-2 text-xs text-slate-500">Only modules in {draft.currency} are shown.</p></section>
    <QuoteCustomerRate key={`${draft.opportunity}-${draft.currency}`} opportunity={draft.opportunity} currency={draft.currency} hasHourlyItems={draft.lineItems.some(line => line.pricingType === 'time' && line.unit === 'hour')} onApply={rate => set('lineItems', draft.lineItems.map(line => line.pricingType === 'time' && line.unit === 'hour' ? { ...line, rate } : line))} />
    <QuoteItemsEditor lines={draft.lineItems} currency={draft.currency} onChange={lines => set('lineItems', lines)} />
    <div className="mt-5 flex flex-wrap items-end gap-2"><Field label="Save these items as a reusable module" value={moduleName} onChange={setModuleName} /><button type="button" className={button} disabled={!moduleName.trim() || saveModule.isPending || draft.lineItems.some(item => !item.description.trim())} onClick={() => { setError(''); setModuleMessage(''); saveModule.mutate(); }}>Save module</button>{moduleMessage && <p role="status" className="text-sm text-emerald-700">{moduleMessage}</p>}</div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label={`Discount (${draft.currency})`} type="number" value={String(draft.discount)} onChange={v => set('discount', Number(v))} /><Field label="VAT (%)" type="number" max="100" value={String(draft.vatRate)} onChange={v => set('vatRate', Number(v))} /></div>
    <div className="mt-5 rounded-xl bg-indigo-50 p-5 text-right text-sm"><p>Subtotal: {money(amount.subtotal, draft.currency)}</p><p className="mt-1">VAT: {money(amount.vatAmount, draft.currency)}</p><p className="mt-2 text-xl font-bold">{hasTimeEstimates(draft.lineItems) ? 'Estimated total' : 'Total'}: {money(amount.total, draft.currency)}</p></div>
    {hasTimeEstimates(draft.lineItems) && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{timeEstimateNote}</p>}
    <div className="mt-5"><Field label="Terms and conditions" multiline value={draft.terms} onChange={v => set('terms', v)} /></div>{error && <p role="alert" className="mt-4 text-sm text-rose-600">{error}</p>}
    <div className="mt-6 flex justify-end gap-3"><button type="button" className={button} onClick={onClose}>Cancel</button><button disabled={save.isPending} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{save.isPending ? 'Saving…' : 'Save quote'}</button></div>
  </form></div>;
}
function Field({ label, value, onChange, type = 'text', required, multiline, min = '0', max }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; multiline?: boolean; min?: string; max?: string }) {
  return <label className="block text-sm font-semibold">{label}{multiline ? <textarea aria-label={label} className={input} rows={3} value={value} required={required} onChange={e => onChange(e.target.value)} /> : <input aria-label={label} className={input} type={type} step={type === 'number' ? 'any' : undefined} min={type === 'number' ? min : undefined} max={max} value={value} required={required} onChange={e => onChange(e.target.value)} />}</label>;
}
