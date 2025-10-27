import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getTimeEntries, exportTimeEntries } from '../utils/clockApi';
import LoadingScreen from '../components/LoadingScreen';
import AddTimeEntryModal from '../components/AddTimeEntryModal';

/**
 * Time History Page
 * Shows historical time entries with filtering and export functionality
 * NO DEMO DATA - All data from backend
 * UK Timezone formatting: "Fri, 24 Oct 2025 – 09:03 AM"
 */

const TimeHistory = () => {
  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState({
    employeeSearch: '',
    locationSearch: '',
    dateRange: {
      start: getDefaultStartDate(),
      end: new Date().toISOString().split('T')[0]
    }
  });

  // Get default start date (30 days ago)
  function getDefaultStartDate() {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  }

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
      if (response.success) {
        setTimeEntries(response.data || []);
      } else {
        setTimeEntries([]);
      }
    } catch (error) {
      console.error('Fetch time entries error:', error);
      toast.error('Failed to fetch time entries');
      setTimeEntries([]);
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
      
      // Fallback: Generate CSV from current data
      let csv = 'Date,Employee Name,VTID,Clock In,Clock Out,Total Hours,Breaks,Work Type,Location\n';
      
      timeEntries.forEach(entry => {
        const employeeName = entry.employee ? 
          `${entry.employee.firstName} ${entry.employee.lastName}` : 'Unknown';
        const vtid = entry.employee?.vtid || '';
        const date = formatUKDate(entry.date);
        const clockIn = entry.clockIn || '';
        const clockOut = entry.clockOut || '';
        const breakTime = entry.breaks?.reduce((total, b) => total + (b.duration || 0), 0) || 0;
        const breakHours = (breakTime / 60).toFixed(2);
        const workType = entry.workType || 'Regular';
        const location = entry.location || '';
        
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
      
      // Create download link
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `time-entries-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Time entries exported successfully');
    }
  };

  /**
   * Format date to UK format: "Fri, 24 Oct 2025"
   */
  const formatUKDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      timeZone: "Europe/London",
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  /**
   * Format time to UK format: "09:03 AM"
   */
  const formatUKTime = (timeStr) => {
    if (!timeStr) return '-';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  /**
   * Get current UK time for "Last Updated"
   */
  const getCurrentUKTime = () => {
    const now = new Date();
    return now.toLocaleString("en-GB", {
      timeZone: "Europe/London",
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      weekday: 'short',
      day: '2-digit',
      month: 'short'
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
    const fullName = entry.employee ? 
      `${entry.employee.firstName} ${entry.employee.lastName}`.toLowerCase() : '';
    const matchesEmployee = fullName.includes(filters.employeeSearch.toLowerCase());
    const matchesLocation = entry.location?.toLowerCase().includes(filters.locationSearch.toLowerCase());
    return (filters.employeeSearch === '' || matchesEmployee) && 
           (filters.locationSearch === '' || matchesLocation);
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
              Time Entry History
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#6b7280'
            }}>
              Last Updated: {getCurrentUKTime()} (UK Time)
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
                Start Date
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

            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                End Date
              </label>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, end: e.target.value }
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
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Total Hours</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry, index) => (
                  <tr key={entry._id || index} style={{
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                      {entry.employee?.vtid || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                      {entry.employee?.firstName || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                      {entry.employee?.lastName || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                      <div>{formatUKTime(entry.clockIn)}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {formatUKDate(entry.date)}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                      <div>{formatUKTime(entry.clockOut)}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {formatUKDate(entry.date)}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                      {calculateHours(entry.clockIn, entry.clockOut, entry.breaks)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#6b7280'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                      No Time Entries Found
                    </h3>
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>
                      Try adjusting your date range or filters
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
