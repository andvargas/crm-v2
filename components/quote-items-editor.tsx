"use client";
import { blankLine, money, QuoteLine, round, timeQuantity } from '../lib/quotes';
const input = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal';
const button = 'rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-50';
export function QuoteItemsEditor({ lines, currency, onChange }: { lines: QuoteLine[]; currency: string; onChange: (lines: QuoteLine[]) => void }) {
  const change = (index: number, fields: Partial<QuoteLine>) => onChange(lines.map((line, i) => i === index ? { ...line, ...fields } : line));
  return <section className="mt-6 space-y-4"><div><h3 className="font-bold">Quote items</h3><p className="mt-1 text-sm text-slate-500">Choose fixed pricing for products, or a time estimate for work charged by the hour or day.</p></div>
    {lines.map((line, index) => {
      const time = line.pricingType === 'time';
      return <fieldset key={index} className="min-w-0 rounded-xl border border-slate-200 p-4"><legend className="px-1 text-xs font-bold text-slate-500">Item {index + 1}</legend>
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">Pricing type<select aria-label={`Pricing type for item ${index + 1}`} className={input} value={line.pricingType || 'fixed'} onChange={event => change(index, { pricingType: event.target.value as QuoteLine['pricingType'], unit: event.target.value === 'time' ? 'hour' : 'item' })}><option value="fixed">Fixed item / product</option><option value="time">Time estimate</option></select></label><label className="text-sm font-semibold">Section / module<input aria-label="Section / module" className={input} value={line.section} maxLength={100} onChange={event => change(index, { section: event.target.value })} /></label></div>
        <label className="mt-3 block text-sm font-semibold">{time ? 'Service' : 'Description'}<textarea aria-label={time ? 'Service' : 'Description'} className={input} rows={2} required maxLength={2000} placeholder={time ? 'e.g. Website maintenance update' : 'Product or deliverable'} value={line.description} onChange={event => change(index, { description: event.target.value })} /></label>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3"><label className="text-sm font-semibold">{time ? 'Estimated time' : 'Quantity'}<input aria-label={time ? 'Estimated time' : 'Quantity'} className={input} type="number" min="0.001" max="100000" step="any" required value={line.quantity} onChange={event => change(index, { quantity: Number(event.target.value) })} /></label>
          <label className="text-sm font-semibold">{time ? 'Time unit' : 'Unit'}{time ? <select aria-label="Time unit" className={input} value={line.unit} onChange={event => change(index, { unit: event.target.value })}><option value="hour">Hours</option><option value="day">Days</option></select> : <input aria-label="Unit" className={input} value={line.unit} maxLength={30} onChange={event => change(index, { unit: event.target.value })} />}</label>
          <label className="text-sm font-semibold">{time ? `Rate per ${line.unit} (${currency})` : 'Unit price'}<input aria-label={time ? `Rate per ${line.unit} (${currency})` : 'Unit price'} className={input} type="number" min="0" max="10000000" step="any" required value={line.rate} onChange={event => change(index, { rate: Number(event.target.value) })} /></label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div>{time && <p className="text-sm text-slate-600">{timeQuantity(line)} at {money(line.rate, currency)} / {line.unit}</p>}<p className="mt-1 text-sm font-bold">{time ? 'Estimated amount' : 'Amount'}: {money(round(line.quantity * line.rate), currency)}</p></div><button type="button" aria-label={`Remove item ${index + 1}`} className={button} disabled={lines.length === 1} onClick={() => onChange(lines.filter((_, i) => i !== index))}>Remove</button></div>
      </fieldset>;
    })}
    <div className="flex flex-wrap gap-2"><button type="button" className={button} disabled={lines.length >= 100} onClick={() => onChange([...lines, blankLine()])}>+ Add item</button><button type="button" className={button} disabled={lines.length >= 100} onClick={() => onChange([...lines, { ...blankLine(), pricingType: 'time', unit: 'hour' }])}>+ Add time estimate</button></div>
  </section>;
}
