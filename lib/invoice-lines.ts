import { InvoiceLine } from "./crm";

export type InvoicePricingType = NonNullable<InvoiceLine["pricingType"]>;
export type TimeUnit = "hour" | "day";

// Invoice lines follow quote lines: "time" is billed in hours or days, "fixed" is an item or project price.
const TIME_UNITS: Record<string, TimeUnit> = { h: "hour", hr: "hour", hrs: "hour", hour: "hour", hours: "hour", day: "day", days: "day" };
const timeUnitOf = (unit?: string) => TIME_UNITS[(unit || "").trim().toLowerCase()];

// Lines saved before pricingType existed are typed from their unit: hours or days were time worked, anything else a fixed price.
export const pricingTypeOf = (line: Pick<InvoiceLine, "pricingType" | "unit">): InvoicePricingType =>
  line.pricingType ?? (timeUnitOf(line.unit) ? "time" : "fixed");

// Gives every line an explicit type, and time lines the quote units "hour" or "day" (older lines say "hours").
export function normalizeInvoiceLine(line: InvoiceLine): InvoiceLine {
  const pricingType = pricingTypeOf(line);
  return pricingType === "time" ? { ...line, pricingType, unit: timeUnitOf(line.unit) || "hour" } : { ...line, pricingType };
}

export const blankInvoiceLine = (pricingType: InvoicePricingType = "time", hourlyRate = 0): InvoiceLine =>
  pricingType === "time"
    ? { pricingType, description: "", quantity: 0, unit: "hour", rate: hourlyRate }
    : { pricingType, description: "", quantity: 1, unit: "item", rate: 0 };

export const isHourly = (line: InvoiceLine) => pricingTypeOf(line) === "time" && timeUnitOf(line.unit) !== "day";

// Accepts "1:45", "0:30", "2" or "1.5"; returns decimal hours, or null when the text is not a valid duration.
export function parseHours(text: string): number | null {
  const value = text.trim();
  const clock = /^(\d+):([0-5]\d)$/.exec(value);
  if (clock) return Number(clock[1]) + Number(clock[2]) / 60;
  if (/^\d+(\.\d+)?$/.test(value) || /^\.\d+$/.test(value)) return Number(value);
  return null;
}

export function formatHours(hours: number): string {
  const minutes = Math.round((Number(hours) || 0) * 60);
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
}

// Printed quantity for a line: h:mm for hours, the plain number for days and fixed items.
export const lineQuantity = (line: InvoiceLine): string => (isHourly(line) ? formatHours(line.quantity) : String(line.quantity));
