import { useState } from "react";
import BorrowReport from "./BorrowReport";
import TopEquipmentReport from "./TopEquipmentReport";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("borrow");

  return (
    <main className="container py-4">
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

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="m-0">Reports</h3>
        <button className="btn btn-outline-secondary no-print" onClick={() => window.print()}>
          Print Report
        </button>
      </div>

      <ul className="nav nav-tabs no-print mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "borrow" ? "active" : ""}`}
            onClick={() => setActiveTab("borrow")}
          >
            Borrow Report
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "top-equipment" ? "active" : ""}`}
            onClick={() => setActiveTab("top-equipment")}
          >
            Top Equipment
          </button>
        </li>
      </ul>

      {activeTab === "borrow" ? <BorrowReport /> : <TopEquipmentReport />}
    </main>
  );
}

