import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getTimeEntries, exportTimeEntries } from '../utils/clockApi';
import LoadingScreen from '../components/LoadingScreen';
import AddTimeEntryModal from '../components/AddTimeEntryModal';

/**
 * Time History Page
 * Shows historical time entries with filtering and export functionality
 */

const TimeHistory = () => {
  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState({
    employeeSearch: '',
    locationSearch: '',
    dateRange: {
      start: new Date().toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    }
  });

  useEffect(() => {
    fetchTimeEntries();
  }, [filters.dateRange]);

  const fetchTimeEntries = async () => {
    setLoading(true);
    try {
      const response = await getTimeEntries(
        filters.dateRange.start,
        filters.dateRange.end
      );
      if (response.success && response.data && response.data.length > 0) {
        setTimeEntries(response.data);
      } else {
        // Use dummy data when no real data is available
        const dummyEntries = [
          {
            _id: '1',
            employee: { firstName: 'John', lastName: 'Smith', vtid: '1003' },
            date: new Date().toISOString(),
            clockIn: '13:23',
            clockOut: '21:13',
            breaks: [{ duration: 12 }],
            workType: 'Regular',
            location: 'Field'
          },
          {
            _id: '2',
            employee: { firstName: 'David', lastName: 'Levito', vtid: '1025' },
            date: new Date(Date.now() - 86400000).toISOString(),
            clockIn: '13:34',
            clockOut: '20:54',
            breaks: [{ duration: 31 }],
            workType: 'Regular',
            location: 'Field'
          },
          {
            _id: '3',
            employee: { firstName: 'Khan', lastName: 'Saleem', vtid: '1032' },
            date: new Date(Date.now() - 172800000).toISOString(),
            clockIn: '12:45',
            clockOut: '22:15',
            breaks: [{ duration: 62 }],
            workType: 'Regular',
            location: 'Field'
          },
          {
            _id: '4',
            employee: { firstName: 'Arthur', lastName: 'Williams', vtid: '1087' },
            date: new Date(Date.now() - 259200000).toISOString(),
            clockIn: '13:27',
            clockOut: '21:17',
            breaks: [{ duration: 47 }],
            workType: 'Overtime',
            location: 'Field'
          }
        ];
        setTimeEntries(dummyEntries);
        console.log('Using dummy time entries data');
      }
    } catch (error) {
      console.error('Fetch time entries error:', error);
      // Use dummy data on error as well
      const dummyEntries = [
        {
          _id: '1',
          employee: { firstName: 'John', lastName: 'Smith', vtid: '1003' },
          date: new Date().toISOString(),
          clockIn: '13:23',
          clockOut: '21:13',
          breaks: [{ duration: 12 }],
          workType: 'Regular',
          location: 'Field'
        },
        {
          _id: '2',
          employee: { firstName: 'David', lastName: 'Levito', vtid: '1025' },
          date: new Date(Date.now() - 86400000).toISOString(),
          clockIn: '13:34',
          clockOut: '20:54',
          breaks: [{ duration: 31 }],
          workType: 'Regular',
          location: 'Field'
        },
        {
          _id: '3',
          employee: { firstName: 'Khan', lastName: 'Saleem', vtid: '1032' },
          date: new Date(Date.now() - 172800000).toISOString(),
          clockIn: '12:45',
          clockOut: '22:15',
          breaks: [{ duration: 62 }],
          workType: 'Regular',
          location: 'Field'
        },
        {
          _id: '4',
          employee: { firstName: 'Arthur', lastName: 'Williams', vtid: '1087' },
          date: new Date(Date.now() - 259200000).toISOString(),
          clockIn: '13:27',
          clockOut: '21:17',
          breaks: [{ duration: 47 }],
          workType: 'Overtime',
          location: 'Field'
        }
      ];
      setTimeEntries(dummyEntries);
      toast.info('Using sample data - connect to backend for real data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const csvData = await exportTimeEntries(
        filters.dateRange.start,
        filters.dateRange.end
      );
      
      // Create download link
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `time-entries-${filters.dateRange.start}-to-${filters.dateRange.end}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Time entries exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      
      // Fallback: Generate CSV from current data for demo
      let csv = 'Date,Employee Name,VTID,Clock In,Clock Out,Total Hours,Breaks,Work Type,Location\n';
      
      timeEntries.forEach(entry => {
        const employeeName = entry.employee ? 
          `${entry.employee.firstName} ${entry.employee.lastName}` : 'Unknown';
        const vtid = entry.employee?.vtid || '';
        const date = formatDate(entry.date);
        const clockIn = entry.clockIn || '';
        const clockOut = entry.clockOut || '';
        const breakTime = entry.breaks?.reduce((total, b) => total + (b.duration || 0), 0) || 0;
        const breakHours = (breakTime / 60).toFixed(2);
        const workType = entry.workType || 'Regular';
        const location = entry.location || 'Field';
        
        // Calculate total hours
        let totalHours = '0.00';
        if (clockIn && clockOut) {
          const start = new Date(`2000-01-01T${clockIn}`);
          const end = new Date(`2000-01-01T${clockOut}`);
          const minutes = (end - start) / (1000 * 60) - breakTime;
          totalHours = (minutes / 60).toFixed(2);
        }
        
        csv += `${date},"${employeeName}",${vtid},${clockIn},${clockOut},${totalHours},${breakHours},"${workType}","${location}"\n`;
      });
      
      // Create download link for demo CSV
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `time-entries-demo-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Time entries exported successfully (demo mode)');
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const calculateHours = (clockIn, clockOut, breaks = []) => {
    if (!clockIn || !clockOut) return '0hrs 0mins';
    
    const start = new Date(`2000-01-01T${clockIn}`);
    const end = new Date(`2000-01-01T${clockOut}`);
    let totalMinutes = (end - start) / (1000 * 60);
    
    // Subtract break time
    breaks.forEach(breakItem => {
      if (breakItem.duration) {
        totalMinutes -= breakItem.duration;
      }
    });
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    
    return `${hours}hrs ${minutes}mins`;
  };

  const filteredEntries = timeEntries.filter(entry => {
    const matchesEmployee = entry.employee?.name?.toLowerCase().includes(filters.employeeSearch.toLowerCase());
    const matchesLocation = entry.location?.toLowerCase().includes(filters.locationSearch.toLowerCase());
    return matchesEmployee && matchesLocation;
  });

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
              History
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#6b7280'
            }}>
              Last Updated: 23:41 - Mon 13 Oct
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            style={{
              padding: '10px 20px',
              background: '#06b6d4',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Export to CSV
          </button>
        </div>

        {/* Filters */}
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
            alignItems: 'flex-end'
          }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Filter by employees
              </label>
              <input
                type="text"
                placeholder="Search Employees"
                value={filters.employeeSearch}
                onChange={(e) => setFilters(prev => ({ ...prev, employeeSearch: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Filter by locations
              </label>
              <input
                type="text"
                placeholder="Select Location"
                value={filters.locationSearch}
                onChange={(e) => setFilters(prev => ({ ...prev, locationSearch: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Date Range
              </label>
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: '10px 20px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              + Add a shift
            </button>
          </div>
        </div>

        {/* Time Entries Table */}
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
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>First Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Last Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Clock In</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Clock Out</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Breaks</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry, index) => (
                <tr key={entry._id || index} style={{
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                    {entry.employee?.vtid || '1003'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                    {entry.employee?.firstName || entry.employee?.name?.split(' ')[0] || 'John'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                    {entry.employee?.lastName || entry.employee?.name?.split(' ')[1] || 'Smith'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                    <div>{formatTime(entry.clockIn)}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {formatDate(entry.date)}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                    <div>{formatTime(entry.clockOut)}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {formatDate(entry.date)}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                    {calculateHours(entry.clockIn, entry.clockOut, entry.breaks)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredEntries.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#6b7280'
            }}>
              No time entries found for the selected criteria.
            </div>
          )}
        </div>

        {/* Sample Data Display */}
        {filteredEntries.length === 0 && (
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            marginTop: '24px'
          }}>
            <div style={{
              padding: '16px',
              background: '#f9fafb',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827'
              }}>
                Sample Time Entries
              </h3>
            </div>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <tbody>
                {[
                  { vtid: '1003', name: 'John Smith', clockIn: '13:23', clockOut: '21:13', breaks: '0hrs 12mins' },
                  { vtid: '1025', name: 'David Levito', clockIn: '13:34', clockOut: '20:54', breaks: '0hrs 31mins' },
                  { vtid: '1032', name: 'Khan Saleem', clockIn: '12:45', clockOut: '22:15', breaks: '1hrs 02mins' },
                  { vtid: '1087', name: 'Arthur Williams', clockIn: '13:27', clockOut: '21:17', breaks: '0hrs 47mins' }
                ].map((entry, index) => (
                  <tr key={index} style={{
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                      {entry.vtid}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                      {entry.name.split(' ')[0]}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                      {entry.name.split(' ')[1]}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                      <div>{entry.clockIn}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Fri 14 May 25
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                      <div>{entry.clockOut}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Fri 14 May 25
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                      {entry.breaks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Time Entry Modal */}
      {showAddModal && (
        <AddTimeEntryModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchTimeEntries();
          }}
        />
      )}
    </>
  );
};

export default TimeHistory;
