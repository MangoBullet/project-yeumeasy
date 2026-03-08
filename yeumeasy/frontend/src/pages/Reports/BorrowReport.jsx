import { useEffect, useMemo, useState } from "react";
import { getBorrowReport } from "../../api/reportApi";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toISOString().slice(0, 10);
}

function getDefaultRange() {
  const today = new Date();
  const endDate = today.toISOString().slice(0, 10);
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  return { startDate, endDate };
}

export default function BorrowReport() {
  const initialRange = useMemo(() => getDefaultRange(), []);
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState({
    data: [],
    dailyData: [],
    monthlyData: [],
    summary: {
      totalBorrowedToday: 0,
      totalBorrowedThisMonth: 0,
      mostBorrowedEquipment: {
        equipment: null,
        borrowCount: 0,
        totalQuantity: 0,
      },
    },
    pagination: {
      totalItems: 0,
      totalPages: 1,
      currentPage: 1,
      limit: 10,
    },
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    async function loadBorrowReport() {
      setLoading(true);
      setError("");
      try {
        const payload = await getBorrowReport({
          startDate,
          endDate,
          search: query,
          page,
          limit,
        });
        setReport(payload);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Failed to load borrow report"
        );
      } finally {
        setLoading(false);
      }
    }
    loadBorrowReport();
  }, [startDate, endDate, query, page, limit]);

  function handleFilterSubmit(event) {
    event.preventDefault();
    setPage(1);
  }

  function clearFilters() {
    setStartDate(initialRange.startDate);
    setEndDate(initialRange.endDate);
    setSearch("");
    setQuery("");
    setPage(1);
  }

  return (
    <section className="report-section">
      <style>
        {`
          @media print {
            .no-print {
              display: none !important;
            }
            .print-compact td,
            .print-compact th {
              padding: 4px !important;
              font-size: 11px !important;
            }
          }
        `}
      </style>

      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Total Borrowed Today</div>
              <div className="fs-4 fw-bold">{report.summary.totalBorrowedToday}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Total Borrowed This Month</div>
              <div className="fs-4 fw-bold">{report.summary.totalBorrowedThisMonth}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Most Borrowed Equipment</div>
              <div className="fs-6 fw-bold">
                {report.summary.mostBorrowedEquipment.equipment || "-"}
              </div>
              <div className="small text-muted">
                Qty: {report.summary.mostBorrowedEquipment.totalQuantity}
              </div>
            </div>
          </div>
        </div>
      </div>

      <form className="row g-2 mb-3 no-print" onSubmit={handleFilterSubmit}>
        <div className="col-md-3">
          <label className="form-label">Start Date</label>
          <input
            className="form-control"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">End Date</label>
          <input
            className="form-control"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Search</label>
          <input
            className="form-control"
            type="text"
            placeholder="User, equipment, status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-md-2 d-flex align-items-end gap-2">
          <button className="btn btn-primary w-100" type="submit">
            Apply
          </button>
          <button className="btn btn-outline-secondary w-100" type="button" onClick={clearFilters}>
            Reset
          </button>
        </div>
      </form>

      {loading ? <div className="alert alert-info">Loading borrow report...</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}

      {!loading && !error ? (
        <>
          <div className="table-responsive">
            <table className="table table-striped table-hover print-compact">
              <thead className="table-light">
                <tr>
                  <th>User Name</th>
                  <th>Equipment Name</th>
                  <th>Quantity</th>
                  <th>Borrow Date</th>
                  <th>Start Date</th>
                  <th>Return Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {report.data.length ? (
                  report.data.map((row, idx) => (
                    <tr key={`${row.user}-${row.equipment}-${idx}`}>
                      <td>{row.user || "-"}</td>
                      <td>{row.equipment || "-"}</td>
                      <td>{row.quantity}</td>
                      <td>{formatDate(row.borrowDate)}</td>
                      <td>{formatDate(row.startDate)}</td>
                      <td>{formatDate(row.returnDate)}</td>
                      <td className="text-capitalize">{row.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center text-muted">
                      No borrow data found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-between align-items-center no-print">
            <div className="small text-muted">
              Page {report.pagination.currentPage} of {report.pagination.totalPages} | Total{" "}
              {report.pagination.totalItems} records
            </div>
            <div className="btn-group">
              <button
                className="btn btn-outline-primary"
                disabled={report.pagination.currentPage <= 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </button>
              <button
                className="btn btn-outline-primary"
                disabled={report.pagination.currentPage >= report.pagination.totalPages}
                onClick={() =>
                  setPage((prev) =>
                    Math.min(prev + 1, report.pagination.totalPages || 1)
                  )
                }
              >
                Next
              </button>
            </div>
          </div>

          <div className="row g-3 mt-3">
            <div className="col-md-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h6>Daily Data</h6>
                  <div className="small text-muted mb-2">Borrow count and quantity by day</div>
                  <ul className="list-group">
                    {report.dailyData.slice(-7).map((item) => (
                      <li className="list-group-item d-flex justify-content-between" key={item.date}>
                        <span>{item.date}</span>
                        <span>
                          {item.borrowCount} tx / {item.totalQuantity} qty
                        </span>
                      </li>
                    ))}
                    {!report.dailyData.length ? (
                      <li className="list-group-item text-muted">No daily summary</li>
                    ) : null}
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h6>Monthly Data</h6>
                  <div className="small text-muted mb-2">Borrow count and quantity by month</div>
                  <ul className="list-group">
                    {report.monthlyData.map((item) => (
                      <li className="list-group-item d-flex justify-content-between" key={item.month}>
                        <span>{item.month}</span>
                        <span>
                          {item.borrowCount} tx / {item.totalQuantity} qty
                        </span>
                      </li>
                    ))}
                    {!report.monthlyData.length ? (
                      <li className="list-group-item text-muted">No monthly summary</li>
                    ) : null}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

