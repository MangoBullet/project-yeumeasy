import { useEffect, useState } from "react";
import { getTopEquipmentReport } from "../../api/reportApi";

function getCurrentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export default function TopEquipmentReport() {
  const initial = getCurrentMonthYear();
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState({
    month: "",
    year: initial.year,
    data: [],
    summary: {
      totalUniqueEquipment: 0,
      totalBorrowCount: 0,
      totalQuantityBorrowed: 0,
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
    async function loadTopEquipmentReport() {
      setLoading(true);
      setError("");
      try {
        const payload = await getTopEquipmentReport({
          month,
          year,
          search: search.trim(),
          page,
          limit,
        });
        setReport(payload);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Failed to load top equipment report"
        );
      } finally {
        setLoading(false);
      }
    }
    loadTopEquipmentReport();
  }, [month, year, search, page, limit]);

  return (
    <section className="report-section">
      <div className="row g-3 mb-3">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="small text-muted">Unique Equipment</div>
              <div className="fs-4 fw-bold">{report.summary.totalUniqueEquipment}</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="small text-muted">Total Borrow Count</div>
              <div className="fs-4 fw-bold">{report.summary.totalBorrowCount}</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="small text-muted">Total Quantity</div>
              <div className="fs-4 fw-bold">{report.summary.totalQuantityBorrowed}</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="small text-muted">Most Borrowed</div>
              <div className="fw-bold">
                {report.summary.mostBorrowedEquipment.equipment || "-"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-2 mb-3 no-print">
        <div className="col-md-2">
          <label className="form-label">Month</label>
          <select
            className="form-select"
            value={month}
            onChange={(e) => {
              setMonth(Number(e.target.value));
              setPage(1);
            }}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <label className="form-label">Year</label>
          <input
            className="form-control"
            type="number"
            min={2000}
            max={9999}
            value={year}
            onChange={(e) => {
              setYear(Number(e.target.value));
              setPage(1);
            }}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Search Equipment</label>
          <input
            className="form-control"
            type="text"
            placeholder="Equipment name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {loading ? <div className="alert alert-info">Loading top equipment report...</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}

      {!loading && !error ? (
        <>
          <div className="mb-2 fw-semibold">
            {report.month} {report.year}
          </div>
          <div className="table-responsive">
            <table className="table table-striped table-hover print-compact">
              <thead className="table-light">
                <tr>
                  <th>Equipment Name</th>
                  <th>Total Borrow Count</th>
                  <th>Total Quantity Borrowed</th>
                </tr>
              </thead>
              <tbody>
                {report.data.length ? (
                  report.data.map((item) => (
                    <tr key={item.equipment}>
                      <td>{item.equipment}</td>
                      <td>{item.borrowCount}</td>
                      <td>{item.totalQuantity}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center text-muted">
                      No top equipment data found.
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
        </>
      ) : null}
    </section>
  );
}

