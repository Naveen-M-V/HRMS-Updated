import React, { useEffect, useState } from 'react';
import { disciplinaryApi } from '../../../utils/performanceApi';

const DisciplinaryList = () => {
  const [records, setRecords] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchRecords = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const res = await disciplinaryApi.getForEmployee(employeeId);
      setRecords(Array.isArray(res) ? res : (res && res.records) || []);
    } catch (err) {
      console.error(err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ if(employeeId) fetchRecords(); }, [employeeId]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Disciplinary Records</h1>
      <div className="mb-4">
        <input value={employeeId} onChange={e=>setEmployeeId(e.target.value)} placeholder="Employee ID" className="px-3 py-2 border rounded w-64" />
        <button onClick={fetchRecords} className="ml-2 px-3 py-2 bg-blue-600 text-white rounded">Load</button>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="space-y-2">
          {records.length === 0 ? <p className="text-sm text-gray-500">No records found.</p> : records.map(r=> (
            <div key={r._id} className="p-3 bg-white rounded border">
              <div className="font-medium">{r.type}</div>
              <div className="text-sm text-gray-700 mt-1">{r.reason}</div>
              <div className="text-xs text-gray-500 mt-2">By: {r.createdBy?.firstName} {r.createdBy?.lastName} — {new Date(r.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DisciplinaryList;
