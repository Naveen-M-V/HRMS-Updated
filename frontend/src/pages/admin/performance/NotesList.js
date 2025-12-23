import React, { useEffect, useState } from 'react';
import { notesApi } from '../../../utils/performanceApi';

const NotesList = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState('');

  const fetchNotes = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const res = await notesApi.getNotesForEmployee(employeeId);
      setNotes(Array.isArray(res) ? res : (res && res.notes) || []);
    } catch (err) {
      console.error('Failed to fetch notes', err);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) fetchNotes();
  }, [employeeId]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Performance Notes</h1>
      <div className="mb-4">
        <input value={employeeId} onChange={(e)=>setEmployeeId(e.target.value)} placeholder="Employee ID" className="px-3 py-2 border rounded w-64" />
        <button onClick={fetchNotes} className="ml-2 px-3 py-2 bg-blue-600 text-white rounded">Load</button>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="space-y-2">
          {notes.length === 0 ? <p className="text-sm text-gray-500">No notes found.</p> : (
            notes.map(n => (
              <div key={n._id} className="p-3 bg-white rounded border">
                <div className="text-sm">{n.content}</div>
                <div className="text-xs text-gray-500 mt-1">By: {n.createdBy?.firstName} {n.createdBy?.lastName} — {new Date(n.createdAt).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotesList;
