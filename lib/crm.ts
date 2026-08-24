export type Contact = {
  _id: string;
  name?: { fullName?: string; firstName?: string; lastName?: string };
  email?: string;
  phone?: { generic?: string; mobile?: string; office?: string };
  jobTitle?: string;
  company?: string | { _id: string; name: { companyName: string }; website?: string };
  contactType?: string;
  connectionType?: string;
  notes?: string;
  archivedAt?: string | null;
  createdAt?: string;
  updatedAt: string;
  interactions?: unknown[];
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
  company?: string;
  contact?: string;
  updatedAt: string;
  comms?: { _id?: string; outcome?: string; timeStamp?: string }[];
};

export const contactName = (contact: Contact) => contact.name?.fullName
  || [contact.name?.firstName, contact.name?.lastName].filter(Boolean).join(" ")
  || "Unnamed contact";

export const formatDate = (date?: string) => date
  ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date))
  : "—";

export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "?";

export const companyId = (contact: Contact) => typeof contact.company === "string" ? contact.company : contact.company?._id;
export const companyName = (contact: Contact) => typeof contact.company === "object" ? contact.company.name.companyName : undefined;
