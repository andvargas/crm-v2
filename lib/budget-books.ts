import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { BudgetBook, BudgetScope } from "./crm";

export type BudgetTab = { scope: BudgetScope; label: string; builtIn: boolean; currency: string };

export const BUDGET_CURRENCIES = ["GBP", "EUR", "USD", "HUF", "CHF", "PLN", "CZK", "RON", "SEK", "NOK", "DKK", "CAD", "AUD", "JPY"];

export const formatMoney = (value: number, currency = "GBP") => new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(value || 0);

export const BUILT_IN_BUDGETS: BudgetTab[] = [
  { scope: "personal", label: "Personal", builtIn: true, currency: "GBP" },
  { scope: "freelance", label: "Freelance", builtIn: true, currency: "GBP" },
];

/** Freelance keeps its business fields (project, invoice ref, tax); every other budget uses the personal-style form. */
export const isFreelanceScope = (scope: BudgetScope) => scope === "freelance";

export function useBudgetBooks(includeArchived = false) {
  return useQuery({
    queryKey: ["budget-books", includeArchived],
    queryFn: () => api<{ items: BudgetBook[] }>(`/budget-books${includeArchived ? "?includeArchived=true" : ""}`),
    staleTime: 60_000,
  });
}

/** Built-in tabs followed by active custom budgets, in creation order. */
export function useBudgetTabs(builtIns: BudgetTab[] = BUILT_IN_BUDGETS) {
  const books = useBudgetBooks();
  const tabs = [...builtIns, ...(books.data?.items ?? []).map((book) => ({ scope: book._id, label: book.name, builtIn: false, currency: book.currency || "GBP" }))];
  return { tabs, isLoading: books.isLoading };
}
