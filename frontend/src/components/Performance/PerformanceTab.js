import React, { useEffect, useState } from 'react';
import { reviewsApi, notesApi, pipsApi, goalsApi } from '../../utils/performanceApi';

const PerformanceTab = ({ user, userProfile }) => {
  const [reviews, setReviews] = useState([]);
  const [notes, setNotes] = useState([]);
  const [pips, setPips] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  const employeeId = userProfile?._id;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (!employeeId) return;

        // Reviews (employee view uses my-reviews endpoint)
        if (user?.userType === 'employee') {
          const myReviews = await reviewsApi.getMyReviews();
          setReviews(myReviews);
        } else {
          const allReviews = await reviewsApi.getAllReviews();
          setReviews(allReviews);
        }

        // Goals
        if (user?.userType === 'employee') {
          const myGoals = await goalsApi.getMyGoals();
          setGoals(myGoals);
        } else {
          const allGoals = await goalsApi.getAllGoals();
          setGoals(allGoals);
        }

        // Notes (only visible to admin/hr/managers)
        try {
          const notesResp = await notesApi.getNotesForEmployee(employeeId);
          setNotes(notesResp);
        } catch (err) {
          // not allowed or none
          setNotes([]);
        }

        // PIPs
        try {
          const pipsResp = await pipsApi.getForEmployee(employeeId);
          setPips(pipsResp);
        } catch (err) {
          setPips([]);
        }
      } catch (error) {
        console.error('Error loading performance data', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [employeeId, user]);

  if (loading) return <div className="p-4">Loading performance...</div>;

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-500">No reviews found.</p>
        ) : (
          <ul className="space-y-2 mt-2">
            {reviews.map(r => (
              <li key={r._id} className="p-3 bg-white border rounded">
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">{r.reviewTitle || r.reviewType}</div>
                    <div className="text-xs text-gray-500">{r.startDate ? new Date(r.startDate).toLocaleDateString() : ''} - {r.dueDate ? new Date(r.dueDate).toLocaleDateString() : ''}</div>
                  </div>
                  <div className="text-sm font-semibold">{r.status}</div>
                </div>
                {r.manager && <div className="text-xs text-gray-600 mt-2">Manager: {r.manager.firstName} {r.manager.lastName}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold">Goals</h2>
        {goals.length === 0 ? (
          <p className="text-sm text-gray-500">No goals found.</p>
        ) : (
          <ul className="space-y-2 mt-2">
            {goals.map(g => (
              <li key={g._id} className="p-3 bg-white border rounded">
                <div className="font-medium">{g.goalName}</div>
                <div className="text-xs text-gray-500">Due: {g.dueDate ? new Date(g.dueDate).toLocaleDateString() : '—'}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold">Improvement Plans</h2>
        {pips.length === 0 ? (
          <p className="text-sm text-gray-500">No improvement plans.</p>
        ) : (
          <ul className="space-y-2 mt-2">
            {pips.map(p => (
              <li key={p._id} className="p-3 bg-white border rounded">
                <div className="font-medium">{new Date(p.startDate).toLocaleDateString()} — {p.endDate ? new Date(p.endDate).toLocaleDateString() : 'Ongoing'}</div>
                <div className="text-sm text-gray-700 mt-2">{p.goals?.map((g,i)=> <div key={i}>• {g.description}</div>)}</div>
                <div className="text-xs text-gray-500 mt-2">Status: {p.status} — Outcome: {p.outcome}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold">Performance Notes (HR & Managers only)</h2>
        {notes.length === 0 ? (
          <p className="text-sm text-gray-500">No notes visible to you.</p>
        ) : (
          <ul className="space-y-2 mt-2">
            {notes.map(n => (
              <li key={n._id} className="p-3 bg-white border rounded">
                <div className="text-sm text-gray-800">{n.content}</div>
                <div className="text-xs text-gray-500 mt-2">By: {n.createdBy?.firstName} {n.createdBy?.lastName} — {new Date(n.createdAt).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PerformanceTab;
