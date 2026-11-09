type Props = {
  when?: string;
  status?: string;
  from?: string;
  to?: string;
};

function dateInputValue(raw?: string): string {
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

export function MatchListFilters({ when, status, from, to }: Props) {
  return (
    <form method="get" className="match-filters">
      <div className="field">
        <label htmlFor="match-filter-when">When</label>
        <select id="match-filter-when" name="when" defaultValue={when ?? ""}>
          <option value="">All</option>
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="match-filter-status">Status</label>
        <select
          id="match-filter-status"
          name="status"
          defaultValue={status ?? ""}
        >
          <option value="">All</option>
          <option value="scheduled">Scheduled</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="match-filter-from">From</label>
        <input
          id="match-filter-from"
          name="from"
          type="date"
          defaultValue={dateInputValue(from)}
        />
      </div>
      <div className="field">
        <label htmlFor="match-filter-to">To</label>
        <input
          id="match-filter-to"
          name="to"
          type="date"
          defaultValue={dateInputValue(to)}
        />
      </div>
      <button type="submit" className="btn btn-secondary">
        Apply filters
      </button>
    </form>
  );
}
