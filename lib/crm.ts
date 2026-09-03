export type Contact = {
  _id: string;
  name?: { fullName?: string; firstName?: string; lastName?: string };
  email?: string;
  phone?: { generic?: string; mobile?: string; office?: string };
  jobTitle?: string;
  company?: string | null | { _id: string; name?: { companyName?: string }; website?: string };
  contactType?: string;
  businessRole?: "customer" | "prospect" | "supplier";
  connectionType?: string;
  notes?: string;
  archivedAt?: string | null;
  createdAt?: string;
  updatedAt: string;
  interactions?: unknown[];
  interactionCount?: number;
  latestInteractionAt?: string | null;
};

export type Company = {
  _id: string;
  name: { companyName: string; shortName?: string };
  segment?: string;
  industry?: string;
  genericEmail?: string;
  phone?: string[];
  website?: string;
  annualIncome?: number | null;
  staffNumber?: number | null;
  archivedAt?: string | null;
  updatedAt: string;
  createdAt: string;
  contacts?: Contact[];
};

export type Interaction = {
  _id: string;
  fullName?: string;
  companyName?: string;
  type?: string;
  channel?: string;
  leadStatus?: string;
  note?: string;
  followUpAt?: string | null;
  followUpNote?: string;
  company?: string | { _id: string; name?: { companyName?: string } };
  contact?: string | { _id: string; name?: Contact["name"]; email?: string };
  createdAt?: string;
  updatedAt: string;
  comms?: { _id?: string; outcome?: string; timeStamp?: string }[];
};

export const INTERACTION_TYPES = ["enquiry", "phonecall", "meeting", "socialising", "message", "cold-prospecting", "warm-prospecting", "supplier", "job application"];
export const INTERACTION_CHANNELS = ["email", "phone", "in-person", "instant-message", "website-form", "comment"];
export const LEAD_STATUSES = [
  { value: "new", label: "New" },
  { value: "enquiry received", label: "Enquiry received" },
  { value: "i contacted", label: "I Contacted" },
  { value: "offer/application sent", label: "Offer/Application sent" },
  { value: "viewed", label: "Viewed" },
  { value: "interested", label: "Interested" },
  { value: "meeting booked", label: "Meeting booked" },
  { value: "met/interviewed", label: "Met/Interviewed" },
  { value: "proposal received", label: "Proposal received" },
  { value: "closed", label: "Closed" },
  { value: "closed won", label: "Closed won" },
  { value: "rejected", label: "Rejected" },
  { value: "i rejected", label: "I Rejected" },
];

export type InvoiceLine = { _id?: string; description: string; quantity: number; unit?: string; rate: number; amount?: number };
export type Invoice = {
  _id: string; number: string; company?: Company | string; contact?: Contact | string;
  customerName: string; customerContact?: string; billingAddress?: string; project?: string; purchaseOrder?: string;
  issueDate: string; supplyDate?: string; dueDate: string; terms?: string; currency: string; lineItems: InvoiceLine[];
  subtotal: number; credit: number; vatRate: number; vatAmount: number; total: number; amountPaid: number;
  status: "draft" | "sent" | "paid" | "overdue" | "void"; paidAt?: string; note?: string; createdAt: string; updatedAt: string;
};

export type FinanceSettings = {
  sellerName: string; tradingName?: string; phone?: string; email?: string; address?: string;
  bankName?: string; accountName?: string; sortCode?: string; accountNumber?: string;
  vatRegistered: boolean; vatNumber?: string; defaultTermsDays: number; defaultCurrency: string; invoiceFooter?: string;
};

export type BudgetTransaction = {
  _id: string; scope: "personal" | "freelance"; transactionType: "income" | "expense"; date: string; amount: number;
  currency: string; counterparty?: string; category?: string; note?: string; project?: string; invoiceReference?: string;
  taxTreatment?: string; hmrcDeductible?: boolean; dwpDeductible?: boolean; source?: "crm" | "cashflow-import";
};

export const OPPORTUNITY_STAGES = [
  { value: "new", label: "New", probability: 10 },
  { value: "qualified", label: "Qualified", probability: 30 },
  { value: "proposal", label: "Proposal", probability: 55 },
  { value: "negotiation", label: "Negotiation", probability: 75 },
  { value: "won", label: "Won", probability: 100 },
  { value: "lost", label: "Lost", probability: 0 },
] as const;
export type OpportunityStage = typeof OPPORTUNITY_STAGES[number]["value"];
export type Opportunity = {
  _id: string; name: string; stage: OpportunityStage; value: number; currency: string; probability: number;
  company?: Company | string | null; contact?: Contact | string | null;
  owner?: { _id: string; name: string; email?: string; role?: string } | string;
  expectedCloseDate?: string | null; nextAction?: string; followUpDate?: string | null; notes?: string; lostReason?: string;
  closedAt?: string | null; createdAt: string; updatedAt: string;
};

export type CrmNotification = {
  key: string; type: "follow_up" | "closing" | "invoice" | "stale_lead"; priority: "high" | "medium";
  title: string; message: string; date: string; href: string; read: boolean;
};
export type NotificationResponse = { items: CrmNotification[]; unreadCount: number };

export const contactName = (contact: Contact) => contact.name?.fullName
  || [contact.name?.firstName, contact.name?.lastName].filter(Boolean).join(" ")
  || "Unnamed contact";

export const formatDate = (date?: string) => date
  ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date))
  : "—";

export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "?";

export const companyId = (contact: Contact) => typeof contact.company === "string" ? contact.company : contact.company?._id;
export const companyName = (contact: Contact) => contact.company && typeof contact.company === "object" ? contact.company.name?.companyName : undefined;

export const CONTACT_TYPES = [
  { value: "jobhunt", label: "Jobhunt" },
  { value: "freelance", label: "Freelance" },
  { value: "repairchap", label: "Repairchap" },
  { value: "friends", label: "Friends & connections" },
];
export const BUSINESS_ROLES = [
  { value: "customer", label: "Customer" },
  { value: "prospect", label: "Prospect" },
  { value: "supplier", label: "Supplier" },
];
export const BUSINESS_ROLE_VALUES = new Set(BUSINESS_ROLES.map(({ value }) => value));

const options = (values: string[]) => values.map((value) => ({ value, label: value }));
export const CONNECTION_TYPES: Record<string, { value: string; label: string }[]> = {
  jobhunt: options(["to evaluate", "to contact", "waiting for reply", "recently in contact", "don't contact yet"]),
  freelance: options(["customer", "prospect", "supplier"]),
  repairchap: options(["to evaluate", "to contact", "waiting for reply", "recommended", "used before"]),
  friends: options(["childhood friend", "family friend", "former colleague", "classmate", "friend from tech events"]),
};

export const normalizeWebsite = (website?: string) => {
  const value = website?.trim() || "";
  if (!value || /^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
};
