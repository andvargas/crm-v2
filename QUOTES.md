# Quotes

Quotes live under **Opportunities → Quotes**. An opportunity can have multiple independent quotes. Its card and table row link to a filtered quote list.

Create a quote by selecting an opportunity, checking the customer and seller details, and adding items. Items have a section name, description, quantity, unit and price. Save the current items as a named module to reuse them in other quotes in the same currency. Inserted modules are copied; changing a quote cannot change the library or other quotes.

The API calculates line amounts, subtotal, discount, VAT and total. Customer and seller details are snapshots on the quote, so future contact or settings changes do not alter existing documents. Seller defaults come from Finance Settings. VAT starts at zero and must be entered explicitly.

Open a quote to preview it and choose **Print / PDF → Save as PDF** in the browser print dialog. A4 print styles hide navigation and controls, repeat table headings, and keep totals together. Disable browser-added headers/footers when saving if a clean document is preferred.

Only drafts can be edited. Status choices are draft, sent, accepted, declined and closed. Sent is a manual tracking status and does not send an email. Accepted, declined and closed set a closure timestamp. Reopen as a draft to revise, or duplicate to retain the earlier version and create an alternative. Revisions are checked on the API to prevent stale browser tabs overwriting newer changes. Opportunities with quotes cannot be deleted.

## API and rollout

The frontend uses the existing Express backend at `/api/v1/quotes`. Deploy both projects together. MongoDB creates the new Quote and QuoteModule collections; no existing data migration is required. All routes require CRM authentication and organization scoping. Salespeople can create quotes only for opportunities they can edit, and can modify only their own quotes. Admins retain organization-wide editing.

Quote module endpoints: `GET/POST /quotes/modules`, `DELETE /quotes/modules/:id`. Quote endpoints: `GET/POST /quotes`, `GET/PATCH /quotes/:id`, `PATCH /quotes/:id/status`. Content updates include the current `version` and must contain the complete editable document. Status updates include `status` and `version`.

## Future customer delivery

Email delivery and website sharing are intentionally not enabled in this release. The quote id is an internal identifier, not an access secret. A future website integration should introduce high-entropy revocable sharing tokens (store only hashes), a minimal public quote representation, and server-side checks of quote status, closure and expiry on every request. Accepted, declined or closed quotes must stop resolving publicly; reopening should require an explicit new sharing decision. Public responses should disable caching and indexing. Use saved customer-facing snapshots and never expose owner/organization identifiers, internal CRM notes, or finance banking settings.

Email sending should be an explicit action that records delivery results and preserves the exact sent document. Keep delivery state separate from the manually maintained quote status.

## Time estimates and customer rates

Each item can use **Fixed item / product** or **Time estimate** pricing. Time estimates use hours or days, including fractional quantities, and show “Approx.” time, a rate per hour/day and an estimated amount. Quotes containing time estimates are labelled **Estimate**, with an **Estimated total** and a note that final time-based charges depend on actual time worked. Fixed and time-based lines can coexist. Existing items without a pricing type keep their fixed-item behavior. Modules and duplicates retain each item's pricing type.

Under **Customer hourly rate**, save a rate per customer and currency, then choose **Apply saved rate to hourly items**. Application is explicit: saving a customer rate does not overwrite items or existing quotes, and applying it changes only current time-estimate lines measured in hours. Daily rates remain separate manual entries. The linked opportunity's company is used as the customer, falling back to its contact; a manually typed customer name alone does not identify a customer record. Rates can therefore be reused across that customer's opportunities.

`GET /quotes/customer-rate?opportunity=<id>&currency=GBP` returns the customer and saved hourly rate. `PUT /quotes/customer-rate` accepts `{ opportunity, currency, hourlyRate }`. The API derives customer identity from an organization-scoped opportunity and validates the related customer. Saving requires an editable opportunity; existing rates can be changed by their owner or an administrator. Rate records are uniquely indexed by organization, customer type/id and currency. Customer rates use a new QuoteCustomerRate collection, with no data migration required.
