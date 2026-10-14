export interface FilterableTicket {
  id: string;
  subject: string;
  description?: string;
  status: string;
  priority: string;
}

export interface TicketFilters {
  /** A status value, or "all". */
  status: string;
  /** A priority value, or "all". */
  priority: string;
  query: string;
}

const ALL = "all";
const normalize = (value: string) => value.toLocaleLowerCase("tr-TR");

/** The visible ticket list for the current filters; pure so the page can derive it. */
export function filterTickets<T extends FilterableTicket>(
  tickets: readonly T[],
  { status, priority, query }: TicketFilters,
): T[] {
  const needle = normalize(query.trim());
  return tickets.filter(
    (ticket) =>
      (status === ALL || ticket.status === status) &&
      (priority === ALL || ticket.priority === priority) &&
      (!needle ||
        [ticket.subject, ticket.description ?? "", ticket.id].some((field) =>
          normalize(field).includes(needle),
        )),
  );
}
