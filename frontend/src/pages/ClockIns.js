import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getClockStatus, clockIn, clockOut } from '../utils/clockApi';
import LoadingScreen from '../components/LoadingScreen';

/**
 * Clock-ins Page
 * Shows detailed employee list with clock in/out functionality
 */

const ClockIns = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    role: 'All Roles',
    staffType: 'All Staff Types',
    company: 'All Companies',
    manager: 'All Managers'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showEntries, setShowEntries] = useState(10);

  useEffect(() => {
    fetchEmployees();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchEmployees, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await getClockStatus();
      if (response.success && response.data && response.data.length > 0) {
        setEmployees(response.data);
      } else {
        // Use dummy data when no real data is available
        const dummyEmployees = [
          { 
            id: '1', 
            name: 'John Smith', 
            firstName: 'John', 
            lastName: 'Smith',
            status: 'clocked_in', 
            vtid: '1003', 
            role: 'Operations',
            staffType: 'Direct',
            company: 'Vitrux Ltd',
            jobTitle: 'Blockages Specialist'
          },
          { 
            id: '2', 
            name: 'David Levito', 
            firstName: 'David', 
            lastName: 'Levito',
            status: 'clocked_in', 
            vtid: '1025', 
            role: 'Engineering',
            staffType: 'Direct',
            company: 'Vitrux Ltd',
            jobTitle: 'Senior Engineer'
          },
          { 
            id: '3', 
            name: 'Khan Saleem', 
            firstName: 'Khan', 
            lastName: 'Saleem',
            status: 'clocked_in', 
            vtid: '1032', 
            role: 'Operations',
            staffType: 'Contract',
            company: 'Vitrux Ltd',
            jobTitle: 'Field Technician'
          },
          { 
            id: '4', 
            name: 'Arthur Williams', 
            firstName: 'Arthur', 
            lastName: 'Williams',
            status: 'clocked_out', 
            vtid: '1087', 
            role: 'Maintenance',
            staffType: 'Direct',
            company: 'Vitrux Ltd',
            jobTitle: 'Maintenance Supervisor'
          },
          { 
            id: '5', 
            name: 'Sarah Johnson', 
            firstName: 'Sarah', 
            lastName: 'Johnson',
            status: 'clocked_out', 
            vtid: '1045', 
            role: 'Administration',
            staffType: 'Direct',
            company: 'Vitrux Ltd',
            jobTitle: 'HR Assistant'
          },
          { 
            id: '6', 
            name: 'Michael Brown', 
            firstName: 'Michael', 
            lastName: 'Brown',
            status: 'clocked_out', 
            vtid: '1056', 
            role: 'IT',
            staffType: 'Direct',
            company: 'Vitrux Ltd',
            jobTitle: 'System Administrator'
          },
          { 
            id: '7', 
            name: 'Emma Davis', 
            firstName: 'Emma', 
            lastName: 'Davis',
            status: 'clocked_out', 
            vtid: '1067', 
            role: 'Finance',
            staffType: 'Direct',
            company: 'Vitrux Ltd',
            jobTitle: 'Accountant'
          },
          { 
            id: '8', 
            name: 'James Wilson', 
            firstName: 'James', 
            lastName: 'Wilson',
            status: 'absent', 
            vtid: '1078', 
            role: 'Operations',
            staffType: 'Direct',
            company: 'Vitrux Ltd',
            jobTitle: 'Operations Manager'
          }
        ];
        setEmployees(dummyEmployees);
        console.log('Using dummy employee data');
      }
    } catch (error) {
      console.error('Fetch employees error:', error);
      // Use dummy data on error as well
      const dummyEmployees = [
        { 
          id: '1', 
          name: 'John Smith', 
          firstName: 'John', 
          lastName: 'Smith',
          status: 'clocked_in', 
          vtid: '1003', 
          role: 'Operations',
          staffType: 'Direct',
          company: 'Vitrux Ltd',
          jobTitle: 'Blockages Specialist'
        },
        { 
          id: '2', 
          name: 'David Levito', 
          firstName: 'David', 
          lastName: 'Levito',
          status: 'clocked_in', 
          vtid: '1025', 
          role: 'Engineering',
          staffType: 'Direct',
          company: 'Vitrux Ltd',
          jobTitle: 'Senior Engineer'
        },
        { 
          id: '3', 
          name: 'Khan Saleem', 
          firstName: 'Khan', 
          lastName: 'Saleem',
          status: 'clocked_in', 
          vtid: '1032', 
          role: 'Operations',
          staffType: 'Contract',
          company: 'Vitrux Ltd',
          jobTitle: 'Field Technician'
        },
        { 
          id: '4', 
          name: 'Arthur Williams', 
          firstName: 'Arthur', 
          lastName: 'Williams',
          status: 'clocked_out', 
          vtid: '1087', 
          role: 'Maintenance',
          staffType: 'Direct',
          company: 'Vitrux Ltd',
          jobTitle: 'Maintenance Supervisor'
        },
        { 
          id: '5', 
          name: 'Sarah Johnson', 
          firstName: 'Sarah', 
          lastName: 'Johnson',
          status: 'clocked_out', 
          vtid: '1045', 
          role: 'Administration',
          staffType: 'Direct',
          company: 'Vitrux Ltd',
          jobTitle: 'HR Assistant'
        },
        { 
          id: '6', 
          name: 'Michael Brown', 
          firstName: 'Michael', 
          lastName: 'Brown',
          status: 'clocked_out', 
          vtid: '1056', 
          role: 'IT',
          staffType: 'Direct',
          company: 'Vitrux Ltd',
          jobTitle: 'System Administrator'
        },
        { 
          id: '7', 
          name: 'Emma Davis', 
          firstName: 'Emma', 
          lastName: 'Davis',
          status: 'clocked_out', 
          vtid: '1067', 
          role: 'Finance',
          staffType: 'Direct',
          company: 'Vitrux Ltd',
          jobTitle: 'Accountant'
        },
        { 
          id: '8', 
          name: 'James Wilson', 
          firstName: 'James', 
          lastName: 'Wilson',
          status: 'absent', 
          vtid: '1078', 
          role: 'Operations',
          staffType: 'Direct',
          company: 'Vitrux Ltd',
          jobTitle: 'Operations Manager'
        }
      ];
      setEmployees(dummyEmployees);
      toast.info('Using sample data - connect to backend for real data');
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async (employeeId) => {
    try {
      const response = await clockIn({ employeeId });
      if (response.success) {
        toast.success('Employee clocked in successfully');
        fetchEmployees(); // Refresh data
      } else {
        toast.error(response.message || 'Failed to clock in');
      }
    } catch (error) {
      console.error('Clock in error:', error);
      // For demo purposes, simulate successful clock in with dummy data
      setEmployees(prev => prev.map(emp => 
        emp.id === employeeId || `emp_${prev.indexOf(emp)}` === employeeId
          ? { ...emp, status: 'clocked_in' }
          : emp
      ));
      toast.success('Employee clocked in successfully (demo mode)');
    }
  };

  const handleClockOut = async (employeeId) => {
    try {
      const response = await clockOut({ employeeId });
      if (response.success) {
        toast.success('Employee clocked out successfully');
        fetchEmployees(); // Refresh data
      } else {
        toast.error(response.message || 'Failed to clock out');
      }
    } catch (error) {
      console.error('Clock out error:', error);
      // For demo purposes, simulate successful clock out with dummy data
      setEmployees(prev => prev.map(emp => 
        emp.id === employeeId || `emp_${prev.indexOf(emp)}` === employeeId
          ? { ...emp, status: 'clocked_out' }
          : emp
      ));
      toast.success('Employee clocked out successfully (demo mode)');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      clocked_in: { background: '#10b981', color: 'white' },
      clocked_out: { background: '#3b82f6', color: 'white' },
      on_break: { background: '#f59e0b', color: 'white' },
      absent: { background: '#ef4444', color: 'white' }
    };

    const labels = {
      clocked_in: 'Clocked In',
      clocked_out: 'Clocked Out',
      on_break: 'On Break',
      absent: 'Absent'
    };

    return (
      <span style={{
        ...styles[status] || styles.absent,
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500'
      }}>
        {labels[status] || 'Unknown'}
      </span>
    );
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.vtid?.toString().includes(searchTerm);
    // Add more filter logic here as needed
    return matchesSearch;
  });

  const displayedEmployees = filteredEmployees.slice(0, showEntries);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div style={{
        padding: '24px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '8px'
            }}>
              Clock-ins
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#6b7280'
            }}>
              Last Updated: {new Date().toLocaleTimeString()} - Mon 13 Oct
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={{
              padding: '10px 20px',
              background: '#06b6d4',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              Add a break
            </button>
            <button style={{
              padding: '10px 20px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              Clock Out
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>13</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Clocked In</div>
          </div>
          <div style={{
            background: '#ffffff',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>7</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Clocked Out</div>
          </div>
          <div style={{
            background: '#ffffff',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>0</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>On a break</div>
          </div>
          <div style={{
            background: '#ffffff',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>1</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Absent</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>Show</span>
              <select
                value={showEntries}
                onChange={(e) => setShowEntries(Number(e.target.value))}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>entries</span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {Object.entries(filters).map(([key, value]) => (
              <select
                key={key}
                value={value}
                onChange={(e) => setFilters(prev => ({ ...prev, [key]: e.target.value }))}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minWidth: '150px'
                }}
              >
                <option value={`All ${key.charAt(0).toUpperCase() + key.slice(1)}s`}>
                  {`All ${key.charAt(0).toUpperCase() + key.slice(1)}s`}
                </option>
              </select>
            ))}
            <button
              onClick={() => {
                setFilters({
                  role: 'All Roles',
                  staffType: 'All Staff Types',
                  company: 'All Companies',
                  manager: 'All Managers'
                });
                setSearchTerm('');
              }}
              style={{
                padding: '8px 16px',
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Employee Table */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead style={{
              background: '#f9fafb'
            }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>VTID</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Role</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>First Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Last Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Staff Type</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Company</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Job Title</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedEmployees.map((employee, index) => (
                <tr key={employee.id || index} style={{
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                    {employee.vtid || '1003'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                    {employee.role || 'Admin'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                    {employee.firstName || employee.name?.split(' ')[0] || 'John'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                    {employee.lastName || employee.name?.split(' ')[1] || 'Smith'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                    {employee.staffType || 'Direct'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                    {employee.company || 'Vitrux Ltd'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                    {employee.jobTitle || 'Blockages'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {getStatusBadge(employee.status)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      {employee.status !== 'clocked_in' && employee.status !== 'on_break' ? (
                        <button
                          onClick={() => handleClockIn(employee.id || `emp_${index}`)}
                          style={{
                            padding: '6px 12px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          Clock In
                        </button>
                      ) : (
                        <button
                          onClick={() => handleClockOut(employee.id || `emp_${index}`)}
                          style={{
                            padding: '6px 12px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          Clock Out
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {displayedEmployees.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#6b7280'
            }}>
              No employees found matching your criteria.
            </div>
          )}
        </div>

        {/* Pagination Info */}
        <div style={{
          marginTop: '16px',
          fontSize: '14px',
          color: '#6b7280',
          textAlign: 'center'
        }}>
          Showing {Math.min(showEntries, filteredEmployees.length)} of {filteredEmployees.length} entries
        </div>
      </div>
    </>
  );
};

export default ClockIns;
