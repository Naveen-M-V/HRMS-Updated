import React, { useState } from 'react';
import { pipsApi } from '../../../utils/performanceApi';
import { toast } from 'react-toastify';

const PipCreate = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [goalText, setGoalText] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!employeeId || !startDate) return toast.error('Employee and start date are required');
    const goals = goalText ? [{ description: goalText }] : [];
    setSaving(true);
    try {
      await pipsApi.createPlan({ employeeId, startDate, endDate, goals });
      toast.success('PIP created');
      setGoalText('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create PIP');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Create Improvement Plan (PIP)</h1>
      <div className="space-y-3 max-w-md">
        <input value={employeeId} onChange={e=>setEmployeeId(e.target.value)} placeholder="Employee ID" className="w-full px-3 py-2 border rounded" />
        <label className="block text-sm">Start Date</label>
        <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full px-3 py-2 border rounded" />
        <label className="block text-sm">End Date (optional)</label>
        <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full px-3 py-2 border rounded" />
        <textarea value={goalText} onChange={e=>setGoalText(e.target.value)} rows={4} className="w-full px-3 py-2 border rounded" placeholder="One-line goal description"></textarea>
        <div>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded">{saving? 'Saving...':'Create'}</button>
        </div>
      </div>
    </div>
  );
};

export default PipCreate;
