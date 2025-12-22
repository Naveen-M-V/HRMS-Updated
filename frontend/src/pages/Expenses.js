import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  Plus, 
  FileText, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  DollarSign,
  Calendar,
  Tag,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Expenses = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('my-expenses');
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState('employee');

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    tags: '',
    fromDate: '',
    toDate: '',
    page: 1,
    limit: 25
  });

  const dropdownRef = useRef(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    limit: 25
  });

  // Fetch user role
  useEffect(() => {
    // Ensure we use role from stored session when available
    if (user?.role) setUserRole(user.role);
  }, []);

  // Fetch expenses
  useEffect(() => {
    fetchExpenses();
  }, [activeTab, filters]);

  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      // For employee-specific route, always fetch only the logged-in user's expenses
      const endpoint = activeTab === 'my-expenses' ? '/api/expenses' : '/api/expenses/approvals';
      const params = { ...filters };
      if (location.pathname.startsWith('/employee')) {
        // include employeeId to ensure backend returns only this user's data
        params.employeeId = user?.id || user?._id || user?.employeeId || user?.email;
      }
      const response = await axios.get(endpoint, { params });
      setExpenses(response.data.expenses || []);
      setPagination(response.data.pagination || { total: 0, page: 1, pages: 1, limit: 25 });
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError(err.response?.data?.message || 'Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleApprove = async (expenseId) => {
    if (!window.confirm('Are you sure you want to approve this expense claim?')) return;
    
    try {
      await axios.post(`/api/expenses/${expenseId}/approve`);
      fetchExpenses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve expense');
    }
  };

  const handleDecline = async (expenseId) => {
    const reason = window.prompt('Please provide a reason for declining this expense claim:');
    if (!reason || reason.trim().length === 0) {
      alert('Decline reason is required');
      return;
    }
    
    try {
      await axios.post(`/api/expenses/${expenseId}/decline`, { reason });
      fetchExpenses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to decline expense');
    }
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense claim?')) return;
    
    try {
      await axios.delete(`/api/expenses/${expenseId}`);
      fetchExpenses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  const handleExportCSV = async () => {
    // Client-side CSV export of currently visible rows
    try {
      if (!expenses || expenses.length === 0) return;
      const visible = expenses;
      const headers = ['Type', 'Status', 'Submitted On', 'Total'];
      const rows = visible.map((r) => [
        r.category || r.type || 'Expense',
        (r.status || '').toString(),
        r.date ? format(new Date(r.date), 'dd/MM/yyyy') : '',
        r.totalAmount != null ? `${r.currency || ''} ${Number(r.totalAmount).toFixed(2)}` : ''
      ]);

      let csv = headers.join(',') + '\n';
      rows.forEach((row) => {
        csv += row.map((cell) => `"${(cell ?? '').toString().replace(/"/g, '""')}"`).join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `expenses_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export failed', err);
      alert('Failed to export expenses');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      declined: { color: 'bg-red-100 text-red-800', label: 'Declined' },
      paid: { color: 'bg-blue-100 text-blue-800', label: 'Paid' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Expenses</h1>
        <div className="flex gap-3 items-center">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            disabled={expenses.length === 0}
          >
            <Download size={20} />
            Export to CSV
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowAddMenu((s) => !s)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={18} />
              Add New Claim
              <span className="ml-1">▾</span>
            </button>

            {showAddMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-50">
                <button
                  onClick={() => { setShowAddMenu(false); navigate('/expenses/add'); }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50"
                >
                  New Expense
                </button>
                <button
                  onClick={() => { setShowAddMenu(false); navigate('/expenses/add?type=mileage'); }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50"
                >
                  Mileage Claim
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('my-expenses')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'my-expenses'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          My expenses
        </button>
        {['manager', 'admin'].includes(userRole) && (
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'approvals'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Approvals
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar size={16} className="inline mr-1" />
              From
            </label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => handleFilterChange('fromDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar size={16} className="inline mr-1" />
              To
            </label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => handleFilterChange('toDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category/Tags Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Search size={16} className="inline mr-1" />
              Category / Tags
            </label>
            <input
              type="text"
              placeholder="Search..."
              value={filters.tags}
              onChange={(e) => handleFilterChange('tags', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Filter size={16} className="inline mr-1" />
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          {/* View Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">View</label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading expenses...</p>
        </div>
      ) : expenses.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Nothing to see here.</h3>
          <p className="text-gray-500">There are no expenses to review.</p>
        </div>
      ) : (
        /* Expenses Table */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted On</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Options</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <motion.tr
                    key={expense._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.category || expense.type || 'Expense'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(expense.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.submittedOn ? format(new Date(expense.submittedOn), 'dd/MM/yyyy') : (expense.date ? format(new Date(expense.date), 'dd/MM/yyyy') : '')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {expense.currency ? `${expense.currency} ` : ''}{expense.totalAmount != null ? Number(expense.totalAmount).toFixed(2) : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {/* Options 3-dots menu */}
                      <div className="relative inline-block text-left">
                        <button onClick={(e) => {
                          const menu = e.currentTarget.nextElementSibling;
                          if (menu) menu.classList.toggle('hidden');
                        }} className="p-1 rounded hover:bg-gray-100">
                          ⋯
                        </button>
                        <div className="hidden absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-50">
                          <button onClick={() => navigate(`/expenses/${expense._id}`)} className="w-full text-left px-4 py-2 hover:bg-gray-50">View</button>
                          {expense.status === 'pending' && (
                            <>
                              <button onClick={() => navigate(`/expenses/edit/${expense._id}`)} className="w-full text-left px-4 py-2 hover:bg-gray-50">Edit</button>
                              <button onClick={() => handleDelete(expense._id)} className="w-full text-left px-4 py-2 hover:bg-gray-50">Delete</button>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span> of{' '}
                <span className="font-medium">{pagination.total}</span> results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="px-4 py-1 text-gray-700">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Expenses;
