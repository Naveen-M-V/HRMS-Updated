import React, { useState } from 'react';
import { notesApi } from '../../../utils/performanceApi';
import { toast } from 'react-toastify';

const NoteCreate = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('hr_manager_only');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!employeeId || !content.trim()) return toast.error('Employee ID and content are required');
    setSaving(true);
    try {
      const res = await notesApi.createNote({ employeeId, content, visibility });
      toast.success('Note created');
      setContent('');
    } catch (err) {
      console.error('Create note failed', err);
      toast.error('Failed to create note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Create Performance Note</h1>
      <div className="space-y-3 max-w-md">
        <input value={employeeId} onChange={e=>setEmployeeId(e.target.value)} placeholder="Employee ID" className="w-full px-3 py-2 border rounded"/>
        <select value={visibility} onChange={e=>setVisibility(e.target.value)} className="w-full px-3 py-2 border rounded">
          <option value="hr_manager_only">HR & Manager only</option>
          <option value="private">Private</option>
        </select>
        <textarea value={content} onChange={e=>setContent(e.target.value)} rows={6} className="w-full px-3 py-2 border rounded" placeholder="Note content"></textarea>
        <div>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded">{saving? 'Saving...':'Create'}</button>
        </div>
      </div>
    </div>
  );
};

export default NoteCreate;
