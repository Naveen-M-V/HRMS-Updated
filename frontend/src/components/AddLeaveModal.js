import React, { useState } from "react";
import axios from "../utils/axiosConfig";

export default function AddLeaveModal({ employee, onClose, onSuccess }) {
  const [type, setType] = useState("Annual leave");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValid = type && startDate && endDate;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError("");
    try {
      await axios.post("/api/absence/add", {
        employeeId: employee._id || employee.id,
        type,
        startDate,
        endDate,
        notes,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError("Failed to add absence. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-30" style={{paddingLeft: 100}}>
      <div className="bg-white rounded-lg shadow-xl border border-[#c9d4df] mt-16 w-full max-w-2xl p-10 relative">
        <h2 className="text-[2rem] font-bold text-gray-900 mb-8 text-left">
          Add annual leave for {employee.name || (employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : "")}
        </h2>
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-gray-700 text-[16px] mb-2 font-medium">Absence type</label>
            <div className="relative">
              <select
                className="w-full h-12 border border-[#c9d4df] rounded-lg bg-white pr-10 pl-3 text-[16px] appearance-none focus:ring-2 focus:ring-blue-200"
                value={type}
                onChange={e => setType(e.target.value)}
              >
                <option value="Annual leave">Annual leave</option>
                <option value="Sick leave">Sick leave</option>
                <option value="Unpaid leave">Unpaid leave</option>
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="flex-1">
              <label className="block text-gray-700 text-[16px] mb-2 font-medium">Start</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full h-12 border border-[#c9d4df] rounded-lg pl-3 pr-10 text-[16px] placeholder-gray-400 focus:ring-2 focus:ring-blue-200"
                  placeholder="dd/mm/yyyy"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  autoComplete="off"
                />
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-gray-700 text-[16px] mb-2 font-medium">End</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full h-12 border border-[#c9d4df] rounded-lg pl-3 pr-10 text-[16px] placeholder-gray-400 focus:ring-2 focus:ring-blue-200"
                  placeholder="dd/mm/yyyy"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  autoComplete="off"
                />
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-gray-700 text-[16px] mb-2 font-medium">Notes</label>
            <textarea
              className="w-full min-h-[80px] h-24 border border-[#c9d4df] rounded-lg px-3 py-2 text-[16px] placeholder-gray-400 focus:ring-2 focus:ring-blue-200 resize-none"
              placeholder="Notes regarding the absence"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              disabled={!isValid || loading}
              className={`h-12 px-8 rounded-lg text-[16px] font-medium transition-colors ${isValid && !loading ? 'bg-[#d0d8df] text-gray-700 hover:bg-[#bfc9d6]' : 'bg-[#e9ecf0] text-gray-400 cursor-not-allowed'}`}
            >
              Add absence
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-12 px-8 border-2 border-[#e00070] text-[#e00070] rounded-lg font-medium text-[16px] bg-white hover:bg-[#fbeaf3] transition-colors"
            >
              Back to profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
