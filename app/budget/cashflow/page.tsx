"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CrmShell } from "../../../components/crm-shell";
import { api } from "../../../lib/api";

type Scope = "freelance" | "personal";
type Summary = {
  monthly: { month: string; income: number; expenses: number; net: number }[];
  suppliers: { supplier: string; amount: number; transactions: number }[];
  categories: { category: string; amount: number; transactions: number }[];
};

const money = (value: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value || 0);
const monthLabel = (value: string) => new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}-01T12:00:00.000Z`));

export default function CashflowPage() {
  const [scope, setScope] = useState<Scope>("freelance");
  const [chosenMonths, setChosenMonths] = useState<Partial<Record<Scope, string>>>({});
  const summaryQuery = useQuery({ queryKey: ["budget", "cashflow-summary", scope], queryFn: () => api<Summary>(`/budget/cashflow-summary?scope=${scope}`) });
  const chosenMonth = chosenMonths[scope];
  const selectedMonth = chosenMonth && summaryQuery.data?.monthly.some((row) => row.month === chosenMonth) ? chosenMonth : summaryQuery.data?.monthly[0]?.month ?? null;
  const detailsQuery = useQuery({
    queryKey: ["budget", "cashflow-details", scope, selectedMonth],
    queryFn: () => api<Summary>(`/budget/cashflow-summary?scope=${scope}&month=${selectedMonth}`),
    enabled: Boolean(selectedMonth),
  });

  return <CrmShell activePath="/budget/cashflow"><div className="mx-auto max-w-[1600px] px-4 py-7 md:px-8 md:py-9">
    <div><p className="text-sm font-semibold text-indigo-600">Budget</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Cashflow details</h1><p className="mt-2 text-sm text-slate-500">Compare each month, then inspect where its expenses went.</p></div>
    <div className="mt-7 flex w-fit max-w-full rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Cashflow type">{(["freelance", "personal"] as const).map((value) => <button key={value} type="button" role="tab" aria-selected={scope === value} onClick={() => setScope(value)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${scope === value ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}>{value === "personal" ? "Personal cashflow" : "Freelance"}</button>)}</div>

    <section className="mt-5 grid min-w-0 items-start gap-5 xl:grid-cols-2">
      <Panel title={`${scope === "freelance" ? "Freelance" : "Personal"} cashflow by month`} subtitle="Select a month to inspect its expenses.">
        {summaryQuery.isLoading ? <Empty>Loading monthly cashflow…</Empty> : summaryQuery.isError ? <Empty error>Monthly cashflow could not be loaded.</Empty> : summaryQuery.data?.monthly.length ? <table className="w-full table-fixed text-left"><thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400 sm:text-[11px]"><th className="w-[25%] px-2 py-3 sm:px-5">Month</th><th className="w-[25%] px-1 py-3 text-right sm:px-3">Income</th><th className="w-[25%] px-1 py-3 text-right sm:px-3">Expenses</th><th className="w-[25%] px-2 py-3 text-right sm:px-5">Profit / Loss</th></tr></thead><tbody>{summaryQuery.data.monthly.map((row) => <tr key={row.month} tabIndex={0} aria-selected={selectedMonth === row.month} onClick={() => setChosenMonths((current) => ({ ...current, [scope]: row.month }))} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setChosenMonths((current) => ({ ...current, [scope]: row.month })); } }} className={`cursor-pointer border-b border-slate-100 last:border-0 outline-none hover:bg-indigo-50 focus-visible:bg-indigo-50 ${selectedMonth === row.month ? "bg-indigo-50" : ""}`}><td className="px-2 py-4 text-xs font-bold text-slate-800 sm:px-5 sm:text-sm">{monthLabel(row.month)}</td><td className="px-1 py-4 text-right text-xs font-semibold text-emerald-700 sm:px-3 sm:text-sm">{money(row.income)}</td><td className="px-1 py-4 text-right text-xs font-semibold text-slate-700 sm:px-3 sm:text-sm">{money(row.expenses)}</td><td className={`px-2 py-4 text-right text-xs font-bold sm:px-5 sm:text-sm ${row.net >= 0 ? "text-indigo-700" : "text-rose-600"}`}>{money(row.net)}</td></tr>)}</tbody></table> : <Empty>No monthly cashflow to show yet.</Empty>}
      </Panel>
      <BreakdownTable title="Expenses by category" label="Category" month={selectedMonth} loading={detailsQuery.isLoading} rows={(detailsQuery.data?.categories ?? []).map((row) => ({ label: row.category, amount: row.amount, transactions: row.transactions }))} />
      <BreakdownTable className="xl:col-span-2" title="Expenses by supplier" label="Supplier" month={selectedMonth} loading={detailsQuery.isLoading} rows={(detailsQuery.data?.suppliers ?? []).map((row) => ({ label: row.supplier, amount: row.amount, transactions: row.transactions }))} />
    </section>
  </div></CrmShell>;
}

function Panel({ title, subtitle, className = "", children }: { title: string; subtitle: string; className?: string; children: React.ReactNode }) {
  return <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white ${className}`}><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-bold text-slate-900">{title}</h2><p className="mt-1 text-xs text-slate-500">{subtitle}</p></div>{children}</div>;
}

function BreakdownTable({ title, label, month, loading, rows, className = "" }: { title: string; label: string; month: string | null; loading: boolean; rows: { label: string; amount: number; transactions: number }[]; className?: string }) {
  return <Panel className={className} title={title} subtitle={month ? monthLabel(month) : "Select a month"}>{!month ? <Empty>Choose a month from the cashflow table.</Empty> : loading ? <Empty>Loading expenses…</Empty> : rows.length ? <table className="w-full table-fixed text-left"><thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400 sm:text-[11px]"><th className="w-1/2 px-3 py-3 sm:px-5">{label}</th><th className="w-1/4 px-2 py-3 text-center sm:px-4">Items</th><th className="w-1/4 px-3 py-3 text-right sm:px-5">Expenses</th></tr></thead><tbody>{rows.map((row) => <tr key={row.label} className="border-b border-slate-100 last:border-0"><td className="break-words px-3 py-4 text-sm font-semibold text-slate-700 sm:px-5">{row.label}</td><td className="px-2 py-4 text-center text-sm text-slate-500 sm:px-4">{row.transactions}</td><td className="px-3 py-4 text-right text-sm font-bold text-slate-900 sm:px-5">{money(row.amount)}</td></tr>)}</tbody><tfoot><tr className="border-t border-slate-200 bg-slate-50"><td className="px-3 py-3 text-sm font-bold text-slate-700 sm:px-5" colSpan={2}>Total</td><td className="px-3 py-3 text-right text-sm font-bold text-slate-950 sm:px-5">{money(rows.reduce((total, row) => total + row.amount, 0))}</td></tr></tfoot></table> : <Empty>No expenses recorded for this month.</Empty>}</Panel>;
}

function Empty({ children, error = false }: { children: React.ReactNode; error?: boolean }) { return <p className={`p-10 text-center text-sm ${error ? "text-rose-600" : "text-slate-500"}`}>{children}</p>; }
