import { Opportunity } from './crm';
export type QuoteLine = { pricingType?: 'fixed' | 'time'; section: string; description: string; quantity: number; unit: string; rate: number; amount?: number };
export type QuoteDraft = {
  opportunity: string; title: string; customerName: string; customerEmail: string; customerAddress: string;
  sellerName: string; sellerEmail: string; sellerAddress: string; issueDate: string; validUntil: string | null;
  currency: string; lineItems: QuoteLine[]; discount: number; vatRate: number; introduction: string; terms: string;
};
export type Quote = Omit<QuoteDraft, 'opportunity'> & {
  _id: string; __v: number; owner: string; opportunity: Pick<Opportunity, '_id' | 'name' | 'stage'> | null;
  number: string; status: 'draft' | 'sent' | 'accepted' | 'declined' | 'closed'; subtotal: number; vatAmount: number; total: number;
};
export type QuoteModule = { _id: string; owner: string; name: string; currency: string; lineItems: QuoteLine[] };
export const blankLine = (): QuoteLine => ({ pricingType: 'fixed', section: 'Services', description: '', quantity: 1, unit: 'item', rate: 0 });
export const money = (value: number, currency: string) => new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(value || 0);
export const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
export function totals(draft: QuoteDraft) {
  const subtotal = round(draft.lineItems.reduce((sum, line) => sum + round(line.quantity * line.rate), 0));
  const discount = round(draft.discount);
  const vatAmount = round((subtotal - discount) * draft.vatRate / 100);
  return { subtotal, vatAmount, total: round(subtotal - discount + vatAmount) };
}
export function toDraft(quote: Quote): QuoteDraft {
  return { opportunity: quote.opportunity?._id || '', title: quote.title, customerName: quote.customerName, customerEmail: quote.customerEmail,
    customerAddress: quote.customerAddress, sellerName: quote.sellerName, sellerEmail: quote.sellerEmail, sellerAddress: quote.sellerAddress,
    issueDate: quote.issueDate, validUntil: quote.validUntil, currency: quote.currency,
    lineItems: quote.lineItems.map(({ pricingType, section, description, quantity, unit, rate }) => ({ pricingType: pricingType || 'fixed', section, description, quantity, unit, rate })),
    discount: quote.discount, vatRate: quote.vatRate, introduction: quote.introduction, terms: quote.terms };
}

export const hasTimeEstimates = (lines: QuoteLine[]) => lines.some(line => line.pricingType === 'time');
export const timeQuantity = (line: QuoteLine) => `Approx. ${line.quantity} ${line.unit}${line.quantity === 1 ? '' : 's'}`;
export const timeEstimateNote = 'Time-based services are estimates. Final charges depend on the actual time worked at the stated rates.';
