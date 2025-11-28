import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ComplianceDashboard from '../components/ComplianceDashboard';
import { 
  ChartBarIcon, 
  UserGroupIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

/**
 * AdminDashboard - Main admin interface with location tracking and analytics
 */
const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    onBreakEmployees: 0,
    offlineEmployees: 0,
    totalCertificates: 0,
    expiringCertificates: 0
  });

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // This would be your actual API endpoint
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/admin/dashboard-stats`, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          // Mock data for demonstration
          setStats({
            totalEmployees: 25,
            activeEmployees: 18,
            onBreakEmployees: 4,
            offlineEmployees: 3,
            totalCertificates: 156,
            expiringCertificates: 8
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        // Use mock data on error
        setStats({
          totalEmployees: 25,
          activeEmployees: 18,
          onBreakEmployees: 4,
          offlineEmployees: 3,
          totalCertificates: 156,
          expiringCertificates: 8
        });
      }
    };

    fetchStats();
  }, []);

  const handleEmployeeClick = (employee) => {
    console.log('Employee clicked:', employee);
    // You can implement navigation to employee details or show a modal
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'compliance', name: 'Compliance', icon: DocumentTextIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name || 'Admin'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Employees */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserGroupIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Employees
                      </dt>
                      <dd className="text-3xl font-semibold text-gray-900">
                        {stats.totalEmployees}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              {/* Active Employees */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <div className="h-4 w-4 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Now
                      </dt>
                      <dd className="text-3xl font-semibold text-green-600">
                        {stats.activeEmployees}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              {/* On Break */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        On Break
                      </dt>
                      <dd className="text-3xl font-semibold text-yellow-600">
                        {stats.onBreakEmployees}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              {/* Expiring Certificates */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Expiring Soon
                      </dt>
                      <dd className="text-3xl font-semibold text-red-600">
                        {stats.expiringCertificates}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('compliance')}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <DocumentTextIcon className="w-6 h-6 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Compliance Dashboard</div>
                    <div className="text-sm text-gray-500">Monitor certificates and compliance</div>
                  </div>
                </button>

                <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <UserGroupIcon className="w-6 h-6 text-purple-600" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Manage Employees</div>
                    <div className="text-sm text-gray-500">Add, edit, or remove employees</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">John Doe clocked in</div>
                    <div className="text-xs text-gray-500">2 minutes ago</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Jane Smith started break</div>
                    <div className="text-xs text-gray-500">15 minutes ago</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Certificate expiring for Mike Johnson</div>
                    <div className="text-xs text-gray-500">1 hour ago</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compliance' && (
          <ComplianceDashboard />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
