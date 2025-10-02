// src/pages/AdminDetailsModal.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDetailsModal() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    bio: '',
    jobTitle: '',
    company: '',
    staffType: 'Admin',
    dateOfBirth: '',
    nationality: '',
    gender: '',
    location: '',
    address: { line1: '', line2: '', city: '', postCode: '', country: '' },
    emergencyContact: { name: '', relationship: '', phone: '' }
  });

  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setLoading(false);
          return;
        }
        const apiUrl = process.env.REACT_APP_API_URL || '';
        const base = apiUrl ? apiUrl : '';
        const resp = await fetch(`${base}/api/my-profile`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const ct = resp.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          throw new Error('Unexpected response');
        }
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.message || 'Failed to load');
        if (!mounted) return;
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          mobile: data.mobile || '',
          bio: data.bio || '',
          jobTitle: Array.isArray(data.jobTitle) ? data.jobTitle.join(', ') : (data.jobTitle || ''),
          department: data.department || '',
          company: data.company || '',
          staffType: data.staffType || 'Admin',
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
          nationality: data.nationality || '',
          gender: data.gender || '',
          location: data.location || '',
          address: {
            line1: data.address?.line1 || '',
            line2: data.address?.line2 || '',
            city: data.address?.city || '',
            postCode: data.address?.postCode || '',
            country: data.address?.country || ''
          },
          emergencyContact: {
            name: data.emergencyContact?.name || '',
            relationship: data.emergencyContact?.relationship || '',
            phone: data.emergencyContact?.phone || ''
          }
        });
      } catch (e) {
        setError(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchProfile();
    return () => { mounted = false; };
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [p, c] = name.split('.');
      setFormData(prev => ({ ...prev, [p]: { ...prev[p], [c]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      setSaving(true);
      const apiUrl = process.env.REACT_APP_API_URL || '';
      const base = apiUrl ? apiUrl : '';
      const resp = await fetch(`${base}/api/admin/update-profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const ct = resp.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await resp.json() : {};
      if (!resp.ok) throw new Error(data.message || 'Failed to save');
      alert('Admin details saved successfully!');
      navigate('/dashboard');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-start justify-center">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow p-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-600 text-white flex items-center justify-between">
          <h2 className="text-lg font-semibold">Complete Admin Details</h2>
          <button onClick={() => navigate(-1)} className="text-white/90 hover:text-white">Close</button>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-8">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* Personal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input name="firstName" value={formData.firstName} onChange={onChange} required className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input name="lastName" value={formData.lastName} onChange={onChange} required className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={onChange} required className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                  <input name="mobile" value={formData.mobile} onChange={onChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={onChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select name="gender" value={formData.gender} onChange={onChange} className="w-full border rounded px-3 py-2">
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* Professional */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                  <input name="jobTitle" value={formData.jobTitle} onChange={onChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input name="department" value={formData.department} onChange={onChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input name="company" value={formData.company} onChange={onChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Staff Type</label>
                  <select name="staffType" value={formData.staffType} onChange={onChange} className="w-full border rounded px-3 py-2">
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                  <input name="address.line1" value={formData.address.line1} onChange={onChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                  <input name="address.line2" value={formData.address.line2} onChange={onChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input name="address.city" value={formData.address.city} onChange={onChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Post Code</label>
                  <input name="address.postCode" value={formData.address.postCode} onChange={onChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input name="address.country" value={formData.address.country} onChange={onChange} className="w-full border rounded px-3 py-2" />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                  <input name="emergencyContact.name" value={formData.emergencyContact.name} onChange={onChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                  <input name="emergencyContact.relationship" value={formData.emergencyContact.relationship} onChange={onChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input name="emergencyContact.phone" value={formData.emergencyContact.phone} onChange={onChange} className="w-full border rounded px-3 py-2" />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea name="bio" rows={4} value={formData.bio} onChange={onChange} className="w-full border rounded px-3 py-2" placeholder="Tell us about yourself..." />
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-emerald-600 text-white rounded disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
