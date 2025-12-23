import React, { useState } from 'react';
import { disciplinaryApi } from '../../../utils/performanceApi';
import { toast } from 'react-toastify';

const DisciplinaryCreate = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [type, setType] = useState('verbal');
  const [reason, setReason] = useState('');
  const [outcome, setOutcome] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!employeeId || !reason.trim()) return toast.error('Employee ID and reason required');
    setSaving(true);
    try {
      await disciplinaryApi.createRecord({ employeeId, type, reason, outcome });
      toast.success('Record created');
      setReason('');
      setOutcome('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create record');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Create Disciplinary Record</h1>
      <div className="space-y-3 max-w-md">
        <input value={employeeId} onChange={e=>setEmployeeId(e.target.value)} placeholder="Employee ID" className="w-full px-3 py-2 border rounded" />
        <select value={type} onChange={e=>setType(e.target.value)} className="w-full px-3 py-2 border rounded">
          <option value="verbal">Verbal warning</option>
          <option value="written">Written warning</option>
          <option value="final">Final warning</option>
        </select>
        <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={4} className="w-full px-3 py-2 border rounded" placeholder="Reason"></textarea>
        <textarea value={outcome} onChange={e=>setOutcome(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded" placeholder="Outcome (optional)"></textarea>
        <div>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded">{saving? 'Saving...':'Create'}</button>
        </div>
      </div>
    </div>
  );
};

export default DisciplinaryCreate;
