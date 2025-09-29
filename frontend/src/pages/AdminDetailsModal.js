import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../utils/config';

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
    department: '',
    company: '',
    staffType: 'Admin',
    dateOfBirth: '',
    nationality: '',
    gender: '',
    location: '',
    address: { line1: '', line2: '', city: '', postCode: '', country: '' },
    emergencyContact: { name: '', relationship: '', phone: '' },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) throw new Error('Not authenticated');
        const res = await fetch(`${API_BASE_URL}/my-profile`, {
          credentials: 'include',
          headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
        });
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          const txt = await res.text();
          throw new Error(`Unexpected response: ${ct} ${txt.slice(0, 120)}...`);
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load profile');
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
            country: data.address?.country || '',
          },
          emergencyContact: {
            name: data.emergencyContact?.name || '',
            relationship: data.emergencyContact?.relationship || '',
            phone: data.emergencyContact?.phone || '',
          },
        });
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');
      setSaving(true);
      const res = await fetch(`${API_BASE_URL}/admin/update-profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        const txt = await res.text();
        throw new Error(`Unexpected response: ${ct} ${txt.slice(0, 120)}...`);
      }
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update profile');
      alert('Admin details saved');
      navigate('/dashboard');
    } catch (e) {
      alert(`Save failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-semibold mb-6">Admin Details</h1>
        <div className="w-full max-w-6xl mx-auto bg-white shadow-md rounded-2xl p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 mb-4">{error}</div>
          )}
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-medium mb-1">First Name *</label>
                <input name="firstName" value={formData.firstName} onChange={onChange} className="w-full border rounded-lg p-2" required />
              </div>
              <div>
                <label className="block font-medium mb-1">Last Name *</label>
                <input name="lastName" value={formData.lastName} onChange={onChange} className="w-full border rounded-lg p-2" required />
              </div>
              <div>
                <label className="block font-medium mb-1">Email *</label>
                <input type="email" name="email" value={formData.email} onChange={onChange} className="w-full border rounded-lg p-2" required />
              </div>
              <div>
                <label className="block font-medium mb-1">Mobile</label>
                <input name="mobile" value={formData.mobile} onChange={onChange} className="w-full border rounded-lg p-2" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-medium mb-1">Job Title</label>
                <input name="jobTitle" value={formData.jobTitle} onChange={onChange} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block font-medium mb-1">Department</label>
                <input name="department" value={formData.department} onChange={onChange} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block font-medium mb-1">Company</label>
                <input name="company" value={formData.company} onChange={onChange} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block font-medium mb-1">Staff Type</label>
                <select name="staffType" value={formData.staffType} onChange={onChange} className="w-full border rounded-lg p-2">
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-medium mb-1">Date of Birth</label>
                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={onChange} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block font-medium mb-1">Gender</label>
                <select name="gender" value={formData.gender} onChange={onChange} className="w-full border rounded-lg p-2">
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Nationality</label>
                <input name="nationality" value={formData.nationality} onChange={onChange} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block font-medium mb-1">Location</label>
                <input name="location" value={formData.location} onChange={onChange} className="w-full border rounded-lg p-2" />
              </div>
            </div>

            <div>
              <label className="block font-medium mb-1">Bio</label>
              <textarea name="bio" value={formData.bio} onChange={onChange} className="w-full border rounded-lg p-2" rows={3} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-medium mb-1">Address Line 1</label>
                <input name="address.line1" value={formData.address.line1} onChange={onChange} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block font-medium mb-1">Address Line 2</label>
                <input name="address.line2" value={formData.address.line2} onChange={onChange} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block font-medium mb-1">City</label>
                <input name="address.city" value={formData.address.city} onChange={onChange} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block font-medium mb-1">Post Code</label>
                <input name="address.postCode" value={formData.address.postCode} onChange={onChange} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block font-medium mb-1">Country</label>
                <input name="address.country" value={formData.address.country} onChange={onChange} className="w-full border rounded-lg p-2" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-medium mb-1">Emergency Contact Name</label>
                <input name="emergencyContact.name" value={formData.emergencyContact.name} onChange={onChange} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block font-medium mb-1">Relationship</label>
                <input name="emergencyContact.relationship" value={formData.emergencyContact.relationship} onChange={onChange} className="w-full border rounded-lg p-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block font-medium mb-1">Phone</label>
                <input name="emergencyContact.phone" value={formData.emergencyContact.phone} onChange={onChange} className="w-full border rounded-lg p-2" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => navigate(-1)} className="border px-4 py-2 rounded text-gray-600 hover:bg-gray-100">Cancel</button>
              <button type="submit" disabled={saving} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
