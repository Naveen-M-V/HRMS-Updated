// components/AdminCompletionBar.js
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfileCompleteness } from '../utils/profileCompleteness';
import { useAuth } from '../context/AuthContext';

export default function AdminCompletionBar() {
  const [loading, setLoading] = useState(true);
  const [percent, setPercent] = useState(0);
  const [missing, setMissing] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) throw new Error('Not authenticated');
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5003';
        const res = await fetch(`${apiUrl}/api/my-profile`, {
          credentials: 'include',
          headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load profile');
        const { percent, missing } = getProfileCompleteness(data);
        setPercent(percent);
        setMissing(missing);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  if (loading || error) return null;

  const color = percent < 50 ? 'bg-red-500' : percent < 80 ? 'bg-yellow-500' : 'bg-green-600';

  return (
    <div className="bg-white rounded-lg shadow p-4 cursor-pointer" onClick={() => navigate('/admin/edit-profile')}>
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-gray-800">Admin Details Completion</div>
        <div className="text-sm text-gray-600">{percent}%</div>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded">
        <div className={`h-3 ${color} rounded`} style={{ width: `${percent}%` }} />
      </div>
      {missing.length > 0 && (
        <div className="text-xs text-gray-500 mt-2">
          Missing: {missing.slice(0, 4).join(', ')}{missing.length > 4 ? '…' : ''}
        </div>
      )}
      <div className="text-xs text-green-700 mt-1">Click to complete your profile</div>
    </div>
  );
}
