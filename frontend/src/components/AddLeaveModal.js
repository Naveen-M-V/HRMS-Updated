import React, { useState } from "react";
import axios from "../utils/axiosConfig";

export default function AddLeaveModal({ employee, onClose, onSuccess }) {
  const [type, setType] = useState("Annual leave");
  const [totalDays, setTotalDays] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValid = type && totalDays && Number(totalDays) > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError("");
    try {
      const userId = employee._id || employee.id;
      
      // Calculate end date based on number of days
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + Number(totalDays) - 1);
      
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/leave/employee-hub/annual-leave`, {
        employeeId: userId,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        reason: notes || `${type} - ${totalDays} days`
      });
      
      console.log('Leave record created:', response.data);
      alert('Annual leave added successfully!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to add leave record:', err);
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Failed to add absence. Please try again.";
      setError(errorMessage);
      alert(`Error details: ${errorMessage}\n\nCheck console for full error.`);
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
          <div>
            <label className="block text-gray-700 text-[16px] mb-2 font-medium">Total Days</label>
            <div className="relative">
              <input
                type="number"
                min="1"
                className="w-full h-12 border border-[#c9d4df] rounded-lg pl-3 pr-10 text-[16px] placeholder-gray-400 focus:ring-2 focus:ring-blue-200"
                placeholder="Number of days"
                value={totalDays}
                onChange={e => setTotalDays(e.target.value)}
                autoComplete="off"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">days</span>
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
