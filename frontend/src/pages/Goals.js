import { useState, useEffect } from 'react';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { goalsApi } from '../utils/performanceApi';
import { toast } from 'react-toastify';
import CreateGoalDrawer from '../components/Performance/CreateGoalDrawer';
import axios from 'axios';

const API_BASE_URL = '/api';

export default function Goals() {
    const [activeTab, setActiveTab] = useState('all'); // 'my' or 'all'
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [assigneeFilter, setAssigneeFilter] = useState('all');
    const [employees, setEmployees] = useState([]);
    const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

    // Fetch employees for filter dropdown
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/employees`, {
                    withCredentials: true,
                });
                // Ensure we always set an array
                const employeeData = response.data;
                // Accept several response shapes returned by different employee endpoints
                if (Array.isArray(employeeData)) {
                    setEmployees(employeeData);
                } else if (employeeData && Array.isArray(employeeData.employees)) {
                    setEmployees(employeeData.employees);
                } else if (employeeData && Array.isArray(employeeData.data)) {
                    // Backend sometimes returns { success, count, data: [...] }
                    setEmployees(employeeData.data);
                } else {
                    console.warn('Employees data is not in expected format:', employeeData);
                    setEmployees([]);
                }
            } catch (error) {
                console.error('Error fetching employees:', error);
                setEmployees([]); // Set empty array on error
            }
        };
        fetchEmployees();
    }, []);

    // Fetch goals
    const fetchGoals = async () => {
        try {
            setLoading(true);
            let data;
            if (activeTab === 'my') {
                data = await goalsApi.getMyGoals();
            } else {
                data = await goalsApi.getAllGoals({
                    status: statusFilter,
                    assignee: assigneeFilter,
                    search: searchTerm,
                });
            }
            // Ensure data is always an array
            if (Array.isArray(data)) {
                setGoals(data);
            } else {
                console.warn('Goals data is not an array:', data);
                setGoals([]);
            }
        } catch (error) {
            console.error('Error fetching goals:', error);
            toast.error('Failed to fetch goals');
            setGoals([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGoals();
    }, [activeTab, statusFilter, assigneeFilter, searchTerm]);

    const handleCreateGoal = () => {
        setIsCreateDrawerOpen(true);
    };

    const handleGoalCreated = () => {
        setIsCreateDrawerOpen(false);
        fetchGoals();
        toast.success('Goal created successfully');
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            'Not started': 'bg-gray-100 text-gray-800',
            'In progress': 'bg-blue-100 text-blue-800',
            'Completed': 'bg-green-100 text-green-800',
            'Overdue': 'bg-red-100 text-red-800',
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <h1 className="text-2xl font-bold text-gray-900">Performance</h1>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-200 px-6">
                <div className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('my')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'my'
                                ? 'border-green-600 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        My goals
                    </button>
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'all'
                                ? 'border-green-600 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        All goals
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex flex-wrap gap-4 items-center">
                    {/* Search */}
                    <div className="flex-1 min-w-[300px]">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by goal name"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                        <option value="all">All statuses</option>
                        <option value="Not started">Not started</option>
                        <option value="In progress">In progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Overdue">Overdue</option>
                    </select>

                    {/* Assignee Filter */}
                    {activeTab === 'all' && Array.isArray(employees) && employees.length > 0 && (
                        <select
                            value={assigneeFilter}
                            onChange={(e) => setAssigneeFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            <option value="all">All assignees</option>
                            {employees.map((emp) => (
                                <option key={emp._id} value={emp._id}>
                                    {emp.firstName} {emp.lastName}
                                </option>
                            ))}
                        </select>
                    )}

                    {/* Create Goal Button */}
                    <button
                        onClick={handleCreateGoal}
                        className="ml-auto flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Create Goal
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="px-6 py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    </div>
                ) : goals.length === 0 ? (
                    /* Empty State */
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 py-16">
                        <div className="text-center">
                            <div className="mx-auto h-24 w-24 mb-4">
                                <svg viewBox="0 0 100 100" className="w-full h-full text-gray-300">
                                    <circle cx="50" cy="70" r="8" fill="currentColor" />
                                    <path
                                        d="M30 45 Q 30 35, 40 35 L 60 35 Q 70 35, 70 45 L 70 55 Q 70 65, 60 65 L 40 65 Q 30 65, 30 55 Z"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                    />
                                    <path d="M 35 45 L 35 50" stroke="currentColor" strokeWidth="2" />
                                    <path d="M 65 45 L 65 50" stroke="currentColor" strokeWidth="2" />
                                    <ellipse cx="50" cy="25" rx="15" ry="8" fill="currentColor" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                No goals have been created yet
                            </h3>
                            <p className="text-gray-500 mb-6">
                                Create goals for your employees to help track their performance.
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Goals Table */
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Goal Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Assignee
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Start Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Due Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Measurement
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {goals.map((goal) => (
                                    <tr key={goal._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{goal.goalName}</div>
                                            <div className="text-sm text-gray-500 truncate max-w-xs">{goal.description}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {goal.assignee?.firstName} {goal.assignee?.lastName}
                                            </div>
                                            <div className="text-sm text-gray-500">{goal.assignee?.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(goal.startDate)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(goal.dueDate)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(goal.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {goal.measurementType}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Goal Drawer */}
            <CreateGoalDrawer
                isOpen={isCreateDrawerOpen}
                onClose={() => setIsCreateDrawerOpen(false)}
                onSuccess={handleGoalCreated}
                employees={employees}
            />
        </div>
    );
}
